import { describe, it, expect } from "vitest";
import {
  PACKAGE_CATEGORIES, categoryMeta, categoryLabel, packageTotal, packageDiscount,
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
