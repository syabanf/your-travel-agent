import { describe, it, expect } from "vitest";
import {
  totalOf,
  paidOf,
  balanceOf,
  paymentProgress,
  isFullyPaid,
  isPartiallyPaid,
  derivedPaymentStatus,
  amountForPercent,
  tripAccess,
} from "@/lib/payments";

const bk = (price, paid, extra = {}) => ({ price, paid_amount: paid, ...extra });

describe("amounts", () => {
  it("reads price and paid, clamping paid to the total", () => {
    expect(totalOf(bk(100, 0))).toBe(100);
    // An overpayment must not produce a negative balance downstream.
    expect(paidOf(bk(100, 150))).toBe(100);
    expect(balanceOf(bk(100, 150))).toBe(0);
  });

  it("treats missing or nonsense values as zero", () => {
    for (const bad of [undefined, null, {}, { price: "abc" }, { price: -5 }]) {
      expect(totalOf(bad)).toBe(0);
      expect(balanceOf(bad)).toBe(0);
    }
  });

  it("computes the outstanding balance", () => {
    expect(balanceOf(bk(1000000, 300000))).toBe(700000);
  });

  it("reports progress, counting a free booking as settled", () => {
    expect(paymentProgress(bk(1000, 250))).toBe(0.25);
    expect(paymentProgress(bk(0, 0))).toBe(1);
  });
});

describe("payment state", () => {
  it("distinguishes unpaid, deposit and settled", () => {
    expect(isFullyPaid(bk(100, 100))).toBe(true);
    expect(isPartiallyPaid(bk(100, 100))).toBe(false);
    expect(isPartiallyPaid(bk(100, 30))).toBe(true);
    expect(isPartiallyPaid(bk(100, 0))).toBe(false);
  });

  it("derives a status that matches the numbers", () => {
    expect(derivedPaymentStatus(bk(100, 100))).toBe("paid");
    expect(derivedPaymentStatus(bk(100, 30))).toBe("deposit");
    expect(derivedPaymentStatus(bk(100, 0))).toBe("unpaid");
  });

  it("leaves a cancelled booking's own status alone", () => {
    expect(derivedPaymentStatus(bk(100, 100, { status: "cancelled", payment_status: "refunded" }))).toBe("refunded");
  });

  it("converts a percentage to a whole-rupiah amount", () => {
    expect(amountForPercent(1850000, 20)).toBe(370000);
    expect(amountForPercent(129000000, 50)).toBe(64500000);
    // Out-of-range percentages are clamped rather than producing silly numbers.
    expect(amountForPercent(100, 150)).toBe(100);
    expect(amountForPercent(100, -10)).toBe(0);
  });
});

describe("tripAccess", () => {
  const locked = { id: "t1", locked_until_paid: true, booking_id: "b1" };

  it("leaves a self-made trip open", () => {
    expect(tripAccess({ id: "t1" }, []).locked).toBe(false);
  });

  it("locks a gated trip while a balance remains", () => {
    const a = tripAccess(locked, [bk(100, 30, { id: "b1" })]);
    expect(a.locked).toBe(true);
    expect(a.balance).toBe(70);
  });

  it("opens it once the balance clears", () => {
    expect(tripAccess(locked, [bk(100, 100, { id: "b1" })]).locked).toBe(false);
  });

  it("falls back to a booking recorded against the trip", () => {
    const a = tripAccess({ id: "t1", locked_until_paid: true }, [bk(100, 0, { id: "bX", trip_id: "t1" })]);
    expect(a.locked).toBe(true);
  });

  it("fails open when the booking behind a gated trip is missing", () => {
    // Better to show a trip someone may have paid for than to strand them.
    expect(tripAccess(locked, []).locked).toBe(false);
  });
});
