import { describe, it, expect } from "vitest";
import moment from "moment";
import { periodRange, comparisonRange, inSpan, pctDelta, comparisonLabel, sumIn, countIn } from "@/dashboard/periodCompare";

describe("pctDelta", () => {
  it("computes the signed percentage change", () => {
    expect(pctDelta(150, 100)).toBe(50);
    expect(pctDelta(50, 100)).toBe(-50);
    expect(pctDelta(100, 100)).toBe(0);
  });
  it("rounds to the nearest integer", () => {
    expect(pctDelta(133, 100)).toBe(33);
  });
  it("returns null when there's no baseline", () => {
    expect(pctDelta(10, 0)).toBeNull();
    expect(pctDelta(10, null)).toBeNull();
  });
});

describe("inSpan", () => {
  it("includes everything when the span is null (all time)", () => {
    expect(inSpan("2020-01-01", null)).toBe(true);
    expect(inSpan(null, null)).toBe(true);
  });
  it("excludes undated rows from a bounded span", () => {
    const span = { start: moment().subtract(10, "days"), end: moment() };
    expect(inSpan(null, span)).toBe(false);
  });
  it("includes values inside [start, end) only", () => {
    const span = { start: moment("2024-01-01"), end: moment("2024-02-01") };
    expect(inSpan("2024-01-15", span)).toBe(true);
    expect(inSpan("2023-12-31", span)).toBe(false);
    expect(inSpan("2024-02-15", span)).toBe(false);
  });
});

describe("periodRange / comparisonRange", () => {
  it("all-time has no bound and no comparison window", () => {
    expect(periodRange("all")).toBeNull();
    expect(comparisonRange("all", "prev")).toBeNull();
  });
  it("30d spans the last ~30 days", () => {
    const r = periodRange("30d");
    expect(r).not.toBeNull();
    expect(r.end.diff(r.start, "days")).toBe(30);
  });
  it("'prev' is an equally-long window ending where the period starts", () => {
    const cmp = comparisonRange("30d", "prev");
    expect(cmp.end.diff(cmp.start, "days")).toBe(30);
    // ends ~30 days ago (the start of the current 30-day window)
    expect(Math.abs(cmp.end.diff(moment().subtract(30, "days"), "seconds"))).toBeLessThan(5);
  });
  it("'year' shifts the window back exactly one year", () => {
    const cmp = comparisonRange("ytd", "year");
    expect(cmp.start.format("YYYY-MM-DD")).toBe(moment().subtract(1, "year").startOf("year").format("YYYY-MM-DD"));
  });
  it("returns null when comparison is 'none'", () => {
    expect(comparisonRange("30d", "none")).toBeNull();
  });
});

describe("sumIn / countIn", () => {
  const rows = [
    { d: "2024-01-10", amt: 100 },
    { d: "2024-01-20", amt: 200 },
    { d: "2023-12-01", amt: 999 },
  ];
  const span = { start: moment("2024-01-01"), end: moment("2024-02-01") };
  it("sums numeric values within the span", () => {
    expect(sumIn(rows, "d", (r) => r.amt, span)).toBe(300);
  });
  it("counts rows within the span", () => {
    expect(countIn(rows, "d", span)).toBe(2);
  });
  it("countIn respects an extra filter", () => {
    expect(countIn(rows, "d", span, (r) => r.amt > 150)).toBe(1);
  });
});

describe("comparisonLabel", () => {
  it("labels the active comparison", () => {
    expect(comparisonLabel("year")).toBe("vs last year");
    expect(comparisonLabel("prev")).toBe("vs prev period");
    expect(comparisonLabel("none")).toBe("");
  });
});
