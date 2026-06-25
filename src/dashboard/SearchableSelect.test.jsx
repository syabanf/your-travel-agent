import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchableSelect from "@/dashboard/SearchableSelect";

const OPTIONS = [
  { value: "flight", label: "Flight" },
  { value: "hotel", label: "Hotel" },
  { value: "train", label: "Train" },
];

describe("SearchableSelect", () => {
  it("shows the placeholder when unset and the selected label when set", () => {
    const { rerender } = render(<SearchableSelect value="" onChange={() => {}} options={OPTIONS} placeholder="Pick one" />);
    expect(screen.getByRole("button")).toHaveTextContent("Pick one");
    rerender(<SearchableSelect value="hotel" onChange={() => {}} options={OPTIONS} placeholder="Pick one" />);
    expect(screen.getByRole("button")).toHaveTextContent("Hotel");
  });

  it("opens on click and lists every option", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect value="" onChange={() => {}} options={OPTIONS} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("filters the options as you type", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect value="" onChange={() => {}} options={OPTIONS} />);
    await user.click(screen.getByRole("button"));
    await user.type(screen.getByPlaceholderText("Search…"), "tra");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option")).toHaveTextContent("Train");
  });

  it("calls onChange with the picked value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableSelect value="" onChange={onChange} options={OPTIONS} />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("option", { name: "Train" }));
    expect(onChange).toHaveBeenCalledWith("train");
  });

  it("shows 'No matches' when nothing matches", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect value="" onChange={() => {}} options={OPTIONS} />);
    await user.click(screen.getByRole("button"));
    await user.type(screen.getByPlaceholderText("Search…"), "zzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<SearchableSelect value="" onChange={() => {}} options={OPTIONS} disabled />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
