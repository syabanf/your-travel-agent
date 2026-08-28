import { describe, it, expect } from "vitest";
import {
  PACKAGE_CATEGORIES, categoryMeta, categoryLabel, packageTotal, packageDiscount,
  minDpPercent, dpOptions, DEFAULT_MIN_DP_PERCENT,
} from "@/data/packageCategories";

describe("package categories", () => {
  it("exposes a stable set of categories with a value, label and icon", () => {
    expect(PACKAGE_CATEGORIES.length).toBeGreaterThan(0);
    for (const c of PACKAGE_CATEGORIES) {
      expect(c.value).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.icon).toBeTruthy();
    }
  });

  it("resolves a known category", () => {
    expect(categoryLabel("honeymoon")).toBe("Honeymoon");
    expect(categoryMeta("beach").value).toBe("beach");
  });

  it("offers the two commercial tiers", () => {
    const values = PACKAGE_CATEGORIES.map((c) => c.value);
    expect(values).toContain("signature");
    expect(values).toContain("cost_saver");
    expect(categoryLabel("cost_saver")).toBe("Cost Saver");
  });

  it("falls back gracefully for an unknown or missing category", () => {
    expect(categoryMeta("nonsense").icon).toBeTruthy();
    expect(categoryLabel(undefined)).toBe("Package");
  });
});

describe("packageTotal", () => {
  it("multiplies the per-person price by the party size", () => {
    expect(packageTotal({ price: 1_000_000 }, 3)).toBe(3_000_000);
  });
  it("treats a missing or invalid party size as one traveller", () => {
    expect(packageTotal({ price: 1_000_000 }, 0)).toBe(1_000_000);
    expect(packageTotal({ price: 1_000_000 }, undefined)).toBe(1_000_000);
  });
  it("is 0 when the package has no price", () => {
    expect(packageTotal({}, 4)).toBe(0);
    expect(packageTotal(null, 2)).toBe(0);
  });
});

describe("packageDiscount", () => {
  it("computes the percentage saved", () => {
    expect(packageDiscount({ price: 75, price_before: 100 })).toBe(25);
  });
  it("is null when there is no genuine discount", () => {
    expect(packageDiscount({ price: 100 })).toBeNull();               // no before-price
    expect(packageDiscount({ price: 100, price_before: 100 })).toBeNull(); // same price
    expect(packageDiscount({ price: 100, price_before: 80 })).toBeNull();  // "before" is lower
    expect(packageDiscount(null)).toBeNull();
  });
});

describe("down payment", () => {
  it("uses the package minimum, or the default when unset", () => {
    expect(minDpPercent({ min_dp_percent: 20 })).toBe(20);
    expect(minDpPercent({})).toBe(DEFAULT_MIN_DP_PERCENT);
    // Out-of-range values must not let someone book for nothing.
    expect(minDpPercent({ min_dp_percent: 0 })).toBe(DEFAULT_MIN_DP_PERCENT);
    expect(minDpPercent({ min_dp_percent: 150 })).toBe(DEFAULT_MIN_DP_PERCENT);
    expect(minDpPercent(null)).toBe(DEFAULT_MIN_DP_PERCENT);
  });

  it("never offers less than the package's own minimum", () => {
    expect(dpOptions({ min_dp_percent: 70 }).map((o) => o.percent)).toEqual([70, 100]);
  });

  it("always ends with paying in full, and never repeats a step", () => {
    const percents = dpOptions({ min_dp_percent: 50 }).map((o) => o.percent);
    expect(percents[percents.length - 1]).toBe(100);
    expect(new Set(percents).size).toBe(percents.length);
  });

  it("offers the full ladder for a low minimum", () => {
    expect(dpOptions({ min_dp_percent: 20 }).map((o) => o.percent)).toEqual([20, 50, 70, 100]);
  });
});
