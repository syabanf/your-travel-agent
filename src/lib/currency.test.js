import { describe, it, expect } from "vitest";
import { formatIDR, formatIDRCompact, CURRENCY } from "@/lib/currency";

// formatIDR joins "Rp" to the amount with a non-breaking space (U+00A0) so the
// currency and number never wrap onto separate lines. Built via fromCharCode so
// the source stays pure-ASCII and unambiguous.
const N = String.fromCharCode(0xa0);

describe("formatIDR", () => {
  it("formats with the Rp prefix and id-ID thousands separators", () => {
    expect(formatIDR(1500000)).toBe(`Rp${N}1.500.000`);
  });
  it("omits the symbol when symbol:false", () => {
    expect(formatIDR(1500000, { symbol: false })).toBe("1.500.000");
  });
  it("rounds fractional amounts", () => {
    expect(formatIDR(1500.6)).toBe(`Rp${N}1.501`);
  });
  it("coerces numeric strings", () => {
    expect(formatIDR("75000")).toBe(`Rp${N}75.000`);
  });
  it("falls back to 0 for non-finite input", () => {
    expect(formatIDR(NaN)).toBe(`Rp${N}0`);
    expect(formatIDR(undefined)).toBe(`Rp${N}0`);
    expect(formatIDR(Infinity)).toBe(`Rp${N}0`);
  });
  it("uses a non-breaking space between Rp and the amount", () => {
    expect(formatIDR(1000).charCodeAt(2)).toBe(0xa0);
  });
  it("exposes the IDR currency code", () => {
    expect(CURRENCY).toBe("IDR");
  });
});

describe("formatIDRCompact", () => {
  it("abbreviates millions with jt", () => {
    expect(formatIDRCompact(1500000)).toBe(`Rp${N}1,5jt`);
  });
  it("abbreviates thousands with rb", () => {
    expect(formatIDRCompact(75000)).toBe(`Rp${N}75rb`);
  });
  it("formats small amounts in full", () => {
    expect(formatIDRCompact(500)).toBe(`Rp${N}500`);
  });
});
