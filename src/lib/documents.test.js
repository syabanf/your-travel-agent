import { describe, it, expect } from "vitest";
import { receiptHTML, quotationHTML } from "@/lib/voucher";

const deposit = {
  confirmation_code: "ICH-PKG-MV21", title: "Maldives Signature Overwater — 2 pax",
  price: 129000000, paid_amount: 64500000, payment_plan: "dp", dp_percent: 50,
  balance_due_date: "2026-09-17", guests: 2, currency: "IDR",
};
const settled = { ...deposit, paid_amount: 129000000, payment_plan: "full", balance_due_date: null };

describe("receiptHTML", () => {
  it("shows the balance outstanding on a deposit", () => {
    const html = receiptHTML(deposit, { customerName: "Putri Wijaya" });
    expect(html).toContain("64.500.000");   // both paid and balance are this figure
    expect(html).toContain("129.000.000");
    expect(html).toMatch(/50%/);
    expect(html).toContain("Putri Wijaya");
  });

  it("marks a settled booking as paid in full", () => {
    expect(receiptHTML(settled)).toMatch(/Lunas|Paid in full/i);
  });

  it("escapes user-supplied text", () => {
    const html = receiptHTML({ ...deposit, title: '<img src=x onerror="alert(1)">' });
    expect(html).not.toContain("<img src=x");
  });

  it("survives junk input", () => {
    for (const bad of [undefined, null, {}, { price: "abc" }]) {
      expect(() => receiptHTML(bad)).not.toThrow();
    }
  });
});

describe("quotationHTML", () => {
  it("prices a package per person and totals by pax", () => {
    const html = quotationHTML({ id: "pkg_x", title: "Bromo", price: 1850000, min_dp_percent: 20 }, { pax: 3 });
    expect(html).toContain("5.550.000");  // 1.85M x 3
    expect(html).toMatch(/20%/);
  });

  it("treats a booking price as the party total, not per head", () => {
    const html = quotationHTML(deposit, { pax: 2 });
    expect(html).toContain("129.000.000");
    expect(html).not.toContain("258.000.000");
  });

  it("survives junk input", () => {
    for (const bad of [undefined, null, {}]) expect(() => quotationHTML(bad)).not.toThrow();
  });
});
