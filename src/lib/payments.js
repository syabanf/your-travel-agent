/**
 * Payment state for bookings, and the trip-unlock rule that hangs off it.
 *
 * A booking carries the full price plus how much has actually been paid, so a
 * deposit and a settled balance are the same shape. Everything else — the
 * outstanding balance, the progress bar, whether a trip is readable — is
 * derived from those two numbers rather than stored separately, so they can't
 * drift out of sync.
 */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Total price of a booking (0 when unknown). */
export const totalOf = (booking) => num(booking?.price);

/** How much the traveller has actually paid so far, never above the total. */
export const paidOf = (booking) => Math.min(num(booking?.paid_amount), totalOf(booking));

/** What's still owed. */
export const balanceOf = (booking) => Math.max(0, totalOf(booking) - paidOf(booking));

/** 0..1 — how far along the payment is. A free/zero-price booking counts as settled. */
export function paymentProgress(booking) {
  const total = totalOf(booking);
  if (!total) return 1;
  return Math.min(1, paidOf(booking) / total);
}

/** True once nothing is outstanding. */
export const isFullyPaid = (booking) => balanceOf(booking) === 0;

/** True when something has been paid but a balance remains. */
export const isPartiallyPaid = (booking) => paidOf(booking) > 0 && !isFullyPaid(booking);

/**
 * Derived payment_status, so the badge always matches the numbers.
 * Cancelled/refunded bookings keep whatever status they were given.
 */
export function derivedPaymentStatus(booking) {
  if (booking?.status === "cancelled") return booking.payment_status || "refunded";
  if (isFullyPaid(booking)) return "paid";
  if (isPartiallyPaid(booking)) return "deposit";
  return "unpaid";
}

/** The amount due for a given percentage of the total, rounded to whole rupiah. */
export const amountForPercent = (total, percent) =>
  Math.round((num(total) * Math.min(100, Math.max(0, num(percent)))) / 100);

/**
 * Trip access.
 *
 * A trip the traveller built themselves has no booking behind it and is always
 * open. A trip that came from a purchase stays locked — visible, but with its
 * day-by-day detail withheld — until the booking behind it is settled in full.
 *
 * @param {object} trip
 * @param {object[]} bookings  bookings already loaded for this trip
 * @returns {{locked: boolean, booking: object|null, balance: number, progress: number}}
 */
export function tripAccess(trip, bookings = []) {
  const open = { locked: false, booking: null, balance: 0, progress: 1 };
  if (!trip?.locked_until_paid) return open;

  // Prefer the booking explicitly tied to the trip; fall back to any booking
  // recorded against it.
  const booking =
    (trip.booking_id && bookings.find((b) => b.id === trip.booking_id)) ||
    bookings.find((b) => b.trip_id === trip.id) ||
    null;

  // Flagged as gated but the booking can't be found: fail open rather than
  // stranding someone in front of a trip they may well have paid for.
  if (!booking) return open;

  return {
    locked: !isFullyPaid(booking),
    booking,
    balance: balanceOf(booking),
    progress: paymentProgress(booking),
  };
}
