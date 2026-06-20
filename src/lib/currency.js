// Currency helpers — the app is localized to Indonesian Rupiah (IDR).
// Amounts are stored as plain numbers in IDR.

const idrFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

/**
 * Format a number as Rupiah, e.g. formatIDR(1500000) -> "Rp 1.500.000".
 * @param {number|string} amount
 * @param {{ symbol?: boolean }} [opts] - set symbol:false to omit the "Rp " prefix
 */
export function formatIDR(amount, opts = {}) {
  const { symbol = true } = opts;
  const n = Number(amount);
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  const formatted = idrFormatter.format(safe);
  return symbol ? `Rp ${formatted}` : formatted;
}

/**
 * Compact Rupiah for tight spaces, e.g. 1500000 -> "Rp 1,5jt", 75000 -> "Rp 75rb".
 * @param {number|string} amount
 */
export function formatIDRCompact(amount) {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  if (safe >= 1_000_000) {
    const v = safe / 1_000_000;
    return `Rp ${(Math.round(v * 10) / 10).toLocaleString('id-ID')}jt`;
  }
  if (safe >= 1_000) {
    return `Rp ${Math.round(safe / 1000).toLocaleString('id-ID')}rb`;
  }
  return formatIDR(safe);
}

export const CURRENCY = 'IDR';
