import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmHost, confirmDialog } from "@/components/ConfirmDialog";

// This dialog guards every destructive action in the app, so the contract that
// matters is: it always resolves, and it only resolves true on an explicit yes.
describe("confirmDialog", () => {
  it("shows the title and body, and resolves true when confirmed", async () => {
    const user = userEvent.setup();
    render(<ConfirmHost />);

    const pending = confirmDialog({
      title: "Delete this customer?",
      body: "Nadia will be permanently removed.",
      confirmLabel: "Delete",
      destructive: true,
    });

    expect(await screen.findByText("Delete this customer?")).toBeInTheDocument();
    expect(screen.getByText("Nadia will be permanently removed.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await expect(pending).resolves.toBe(true);
  });

  it("resolves false when cancelled", async () => {
    const user = userEvent.setup();
    render(<ConfirmHost />);
    const pending = confirmDialog({ title: "Delete?" });
    await screen.findByText("Delete?");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await expect(pending).resolves.toBe(false);
  });

  it("resolves false on Escape — the safe default", async () => {
    const user = userEvent.setup();
    render(<ConfirmHost />);
    const pending = confirmDialog({ title: "Delete?" });
    await screen.findByText("Delete?");
    await user.keyboard("{Escape}");
    await expect(pending).resolves.toBe(false);
  });

  it("closes after answering", async () => {
    const user = userEvent.setup();
    render(<ConfirmHost />);
    const pending = confirmDialog({ title: "Delete?" });
    await screen.findByText("Delete?");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await pending;
    await waitFor(() => expect(screen.queryByText("Delete?")).not.toBeInTheDocument());
  });

  it("is a labelled modal dialog", async () => {
    render(<ConfirmHost />);
    confirmDialog({ title: "Delete?" });
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
