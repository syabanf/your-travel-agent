import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import ProtectedContent from "./ProtectedContent";

/**
 * This component is deterrence, not security — a page cannot stop an OS
 * screenshot. These cover the parts it CAN do, so they don't silently rot.
 */

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("ich_user_email", "rina.sari@example.com");
});

const renderGuarded = () =>
  render(
    <ProtectedContent label="Trip plan">
      <p>Day 1 — Arrive Cemoro Lawang</p>
    </ProtectedContent>
  );

describe("ProtectedContent", () => {
  it("renders the content it wraps", () => {
    renderGuarded();
    expect(screen.getByText("Day 1 — Arrive Cemoro Lawang")).toBeInTheDocument();
  });

  it("stamps the viewer's identity across it", () => {
    // The watermark is the only measure that survives an actual screenshot,
    // so a leak points back at a person.
    const { container } = renderGuarded();
    const marks = container.querySelectorAll(".ich-watermark span");
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0].textContent).toContain("rina.sari@example.com");
  });

  it("keeps the watermark out of the accessibility tree", () => {
    const { container } = renderGuarded();
    expect(container.querySelector(".ich-watermark")).toHaveAttribute("aria-hidden", "true");
  });

  it("blanks when the window loses focus and comes back on focus", () => {
    renderGuarded();
    expect(screen.queryByText(/hidden/i)).not.toBeInTheDocument();

    act(() => { window.dispatchEvent(new Event("blur")); });
    expect(screen.getByText("Trip plan hidden")).toBeInTheDocument();

    act(() => { window.dispatchEvent(new Event("focus")); });
    expect(screen.queryByText("Trip plan hidden")).not.toBeInTheDocument();
  });

  it("carries a print notice to swap in for the content", () => {
    const { container } = renderGuarded();
    expect(container.querySelector(".ich-print-notice")).toBeInTheDocument();
  });

  it("blocks the context menu and drag routes to copying", () => {
    const { container } = renderGuarded();
    const guard = container.querySelector(".ich-protected");

    const menu = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    guard.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(true);

    const drag = new MouseEvent("dragstart", { bubbles: true, cancelable: true });
    guard.dispatchEvent(drag);
    expect(drag.defaultPrevented).toBe(true);
  });

  it("still shows something when there is no signed-in identity", () => {
    window.localStorage.clear();
    const { container } = renderGuarded();
    expect(container.querySelectorAll(".ich-watermark span")[0].textContent.trim()).toBeTruthy();
  });
});
