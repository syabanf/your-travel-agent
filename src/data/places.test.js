import { describe, it, expect } from "vitest";
import { placeOptions, searchPlaces } from "@/data/places";

describe("place search", () => {
  it("offers only airports for flights and keeps the code in the value", () => {
    const rows = placeOptions("flight");
    expect(rows.every((r) => r.code)).toBe(true);
    expect(rows.find((r) => r.code === "CGK").value).toBe("Jakarta (CGK)");
  });

  it("offers areas as well as cities for hotels", () => {
    const rows = placeOptions("hotel");
    expect(rows.find((r) => r.title === "Ubud").value).toBe("Ubud, Bali");
    expect(rows.some((r) => r.kind === "airport")).toBe(false);
  });

  it("ranks an exact airport code first, then names that start with the query", () => {
    const rows = placeOptions("flight");
    expect(searchPlaces(rows, "dps")[0].code).toBe("DPS");
    expect(searchPlaces(rows, "ba")[0].title).toMatch(/^Ba/);
    expect(searchPlaces(rows, "  ")).toEqual([]);
  });
});
