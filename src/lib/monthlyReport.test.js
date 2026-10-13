import { describe, it, expect } from "vitest";
import { DEFAULT_ACCOUNTS as A, allEntries } from "@/lib/accounting";
import { change, monthlyReport, reportWindows } from "@/lib/monthlyReport";

const booking = (id, created, price, status = "confirmed") => ({ id, type: "hotel", title: id, price, paid_amount: price, cost_price: price / 2, status, created_at: `${created}T08:00:00Z` });
const bookings = [
  booking("sep", "2026-09-10", 1_011_000),
  booking("oct1", "2026-10-03", 2_022_000),
  booking("oct2", "2026-10-20", 1_011_000),
  { ...booking("oct-x", "2026-10-21", 500_000, "cancelled"), refunded_amount: 500_000 },
  booking("ly", "2025-10-15", 1_011_000),
];
const rent = (date) => ({ id: `rent-${date}`, date, ref: "R", memo: "Rent", lines: [{ account: "6102", debit: 100_000 }, { account: "1102", credit: 100_000 }] });
const entries = allEntries(bookings, [rent("2026-09-28"), rent("2026-10-28")]);
const report = monthlyReport(entries, A, bookings, "2026-10");
const row = (label) => report.pnl.find((r) => r.label === label).values;

describe("monthly report", () => {
  it("compares a month with the previous month, last year and year to date", () => {
    expect(reportWindows("2026-03").prev).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(row("Total revenue")).toMatchObject({ cur: 3_000_000, prev: 1_000_000, yoy: 1_000_000, ytd: 4_000_000, ytdLy: 1_000_000 });
    expect(row("Net profit").cur).toBe(3_000_000 - 1_516_500 - 100_000);
  });

  it("counts bookings sold and cancellations in the month", () => {
    const m = Object.fromEntries(report.metrics.map((x) => [x.label, x.values]));
    expect(m["Bookings sold"]).toMatchObject({ cur: 2, prev: 1, yoy: 1 });
    expect(m.Cancellations.cur).toBe(1);
  });

  it("reports change in rupiah and percent, with no percent from zero", () => {
    expect(change(150, 100)).toEqual({ abs: 50, pct: 50 });
    expect(change(5, 0).pct).toBeNull();
    expect(change(-50, -100).pct).toBe(50);
  });

  it("writes a summary and a 12-month trend ending on the month", () => {
    expect(report.summary[0]).toBe("Revenue grew 3.0× from September, to Rp 3.000.000.");
    expect(report.trend).toHaveLength(12);
    expect(report.trend.at(-1).month).toBe("Oct 26");
  });
});
