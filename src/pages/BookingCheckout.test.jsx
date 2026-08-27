import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import BookingCheckout from "./BookingCheckout";
import PackageDetail from "./PackageDetail";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const renderCheckout = (id) =>
  render(
    <MemoryRouter initialEntries={[`/booking/${id}/checkout`]}>
      <Routes>
        <Route path="/booking/:bookingId/checkout" element={<BookingCheckout />} />
        <Route path="/booking" element={<div>MY BOOKINGS</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  try { window.sessionStorage.clear(); } catch { /* ignore */ }
  vi.clearAllMocks();
});

describe("BookingCheckout", () => {
  const mkBooking = () =>
    base44.entities.Booking.create({ type: "package", title: "Bali Escape", price: 1000, status: "pending" });

  it("prefills from auth.me and complains loudly when required fields are blank", async () => {
    const b = await mkBooking();
    const user = userEvent.setup();
    renderCheckout(b.id);

    await screen.findAllByText("Bali Escape");
    await user.click(screen.getByRole("button", { name: /Continue/i }));

    // prefilled from the mock user
    const name = await screen.findByPlaceholderText("As on ID/passport");
    await waitFor(() => expect(name).toHaveValue("Alex Rivera"));
    expect(screen.getByPlaceholderText("your@email.com")).toHaveValue("traveler@iconholiday.app");

    // blank the required fields, then try to proceed
    await user.clear(name);
    await user.clear(screen.getByPlaceholderText("your@email.com"));
    await user.click(screen.getByRole("button", { name: /Proceed to Payment/i }));

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/full name.*email.*phone number/));
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name.className).toMatch(/border-red-500/);
    expect(document.activeElement).toBe(name);
    // still on step 2
    expect(screen.getByRole("button", { name: /Proceed to Payment/i })).toBeInTheDocument();
  });

  it("advances when valid, warns with no payment method, and rewinds one step on back", async () => {
    const b = await mkBooking();
    const user = userEvent.setup();
    renderCheckout(b.id);

    await screen.findAllByText("Bali Escape");
    await user.click(screen.getByRole("button", { name: /Continue/i }));
    await screen.findByPlaceholderText("As on ID/passport");
    await user.type(screen.getByPlaceholderText("+62 812 xxxx xxxx"), "0811");
    await user.click(screen.getByRole("button", { name: /Proceed to Payment/i }));

    const pay = await screen.findByRole("button", { name: /Confirm & Pay/i });
    await user.click(pay);
    expect(toast.error).toHaveBeenCalledWith("Please choose a payment method");

    // back goes to step 2, not out of the flow
    await user.click(screen.getByRole("button", { name: /Back one step/i }));
    expect(await screen.findByPlaceholderText("As on ID/passport")).toBeInTheDocument();
    expect(screen.queryByText("MY BOOKINGS")).toBeNull();

    // and progress was persisted
    const saved = JSON.parse(window.sessionStorage.getItem(`checkout:${b.id}`));
    expect(saved.step).toBe(2);
    expect(saved.guestInfo.phone).toBe("0811");
    expect(saved.guestInfo.full_name).toBe("Alex Rivera");
  });

  it("restores step + guest info after a reload", async () => {
    const b = await mkBooking();
    window.sessionStorage.setItem(
      `checkout:${b.id}`,
      JSON.stringify({ step: 3, guestInfo: { full_name: "Rina", email: "r@x.co", phone: "081", special_request: "" } })
    );
    renderCheckout(b.id);
    expect(await screen.findByRole("button", { name: /Confirm & Pay/i })).toBeInTheDocument();
  });

  it("offers saved-traveller chips that fill the form", async () => {
    const b = await mkBooking();
    window.localStorage.setItem("mora_travelers", JSON.stringify([{ id: "t1", name: "Budi", email: "budi@x.co" }]));
    const user = userEvent.setup();
    renderCheckout(b.id);

    await screen.findAllByText("Bali Escape");
    await user.click(screen.getByRole("button", { name: /Continue/i }));
    await user.click(await screen.findByRole("button", { name: "Budi" }));
    expect(screen.getByPlaceholderText("As on ID/passport")).toHaveValue("Budi");
    expect(screen.getByPlaceholderText("your@email.com")).toHaveValue("budi@x.co");
  });
});

describe("PackageDetail", () => {
  const renderDetail = async (pkgId, search = "") => {
    const qc = new QueryClient();
    return render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/packages/${pkgId}${search}`]}>
          <Routes>
            <Route path="/packages/:id" element={<PackageDetail />} />
            <Route path="/booking/:bookingId/checkout" element={<div>CHECKOUT</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  const mkPkg = () =>
    base44.entities.TourPackage.create({
      title: "Kyoto in Bloom", destination: "Kyoto", price: 500, min_pax: 2, max_pax: 6,
      duration_days: 5, duration_nights: 4, category: "cultural",
      departure_dates: ["2026-10-01", "2026-11-05"],
    });

  it("reads pax + departure from the URL", async () => {
    const p = await mkPkg();
    await renderDetail(p.id, "?pax=4&departure=2026-11-05");
    await screen.findByText("Kyoto in Bloom");
    await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument());
    expect(screen.getByText(/Total · 4 travellers/)).toBeInTheDocument();
  });

  it("re-uses the pending booking instead of creating a duplicate", async () => {
    const p = await mkPkg();
    const user = userEvent.setup();
    const { unmount } = await renderDetail(p.id);
    await screen.findByText("Kyoto in Bloom");

    await act(async () => { await user.click(screen.getByRole("button", { name: /More travellers/i })); });
    await user.click(screen.getByRole("button", { name: /Book this package/i }));
    await screen.findByText("CHECKOUT");
    expect(toast.success).toHaveBeenCalledWith("Package reserved — just a few details left");

    let all = await base44.entities.Booking.filter({ package_id: p.id });
    expect(all).toHaveLength(1);
    expect(all[0].guests).toBe(3);
    unmount();

    // come back and book again — should update, not create a second draft
    await renderDetail(p.id, "?pax=5&departure=2026-11-05");
    await screen.findByText("Kyoto in Bloom");
    await waitFor(() => expect(screen.getByText("5")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Book this package/i }));
    await screen.findByText("CHECKOUT");

    all = await base44.entities.Booking.filter({ package_id: p.id });
    expect(all).toHaveLength(1);
    expect(all[0].guests).toBe(5);
    expect(all[0].price).toBe(2500);
  });
});
