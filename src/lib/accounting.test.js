import { describe, it, expect } from "vitest";
import {
  DEFAULT_ACCOUNTS as A, allEntries, balanceSheet, bookingEntries, cashFlow, incomeStatement,
  isBalanced, ledger, receivablesAging, trialBalance,
} from "@/lib/accounting";

const bookings = [
  { id: "b1", type: "hotel", title: "Ubud villa", price: 10_110_000, paid_amount: 4_000_000, cost_price: 8_000_000, status: "confirmed", created_at: "2026-01-10T08:00:00Z", updated_at: "2026-01-12T08:00:00Z" },
  { id: "b2", type: "flight", title: "CGK-DPS", price: 2_000_000, paid_amount: 2_000_000, cost_price: 1_700_000, status: "completed", created_at: "2026-02-01T08:00:00Z", check_out: "2026-02-20" },
  { id: "b3", type: "package", title: "Kyoto", price: 5_000_000, paid_amount: 1_500_000, refunded_amount: 1_000_000, status: "cancelled", created_at: "2026-02-05T08:00:00Z", updated_at: "2026-02-08T08:00:00Z" },
];
const manual = [
  { id: "j1", date: "2026-01-01", ref: "CAP", memo: "Opening capital", lines: [{ account: "1102", debit: 25_000_000 }, { account: "3101", credit: 25_000_000 }] },
  { id: "j2", date: "2026-02-28", ref: "RENT", memo: "Rent", lines: [{ account: "6102", debit: 500_000 }, { account: "1102", credit: 500_000 }] },
];
const entries = allEntries(bookings, manual);

describe("booking postings", () => {
  it("balances every entry it posts", () => {
    expect(entries.every((e) => isBalanced(e.lines))).toBe(true);
  });

  it("invoices tax-inclusive: sales net of PPN, by booking type", () => {
    const [invoice] = bookingEntries(bookings[0]);
    expect(invoice.lines).toEqual([
      { account: "1201", debit: 10_110_000 },
      { account: "4102", credit: 10_000_000 },
      { account: "2201", credit: 110_000 },
    ]);
  });

  it("keeps the non-refunded part of a cancelled booking as income", () => {
    const pl = incomeStatement(entries, A, "2026-02-01", "2026-02-28");
    expect(pl.revenue.find((r) => r.code === "4201").amount).toBe(500_000);
  });
});

describe("reports", () => {
  it("has a trial balance whose debits equal its credits", () => {
    const tb = trialBalance(entries, A, "2026-12-31");
    expect(tb.debit).toBe(tb.credit);
  });

  it("balances the balance sheet, current earnings included", () => {
    const bs = balanceSheet(entries, A, "2026-12-31");
    expect(bs.balanced).toBe(true);
    expect(bs.earnings).toBe(incomeStatement(entries, A, null, "2026-12-31").net);
  });

  it("ends the cash flow where the bank ledger ends", () => {
    const cf = cashFlow(entries, A, "2026-02-01", "2026-02-28");
    const bank = ledger(entries, "1102", A, "2026-02-01", "2026-02-28");
    expect(cf.opening).toBe(bank.opening);
    expect(cf.closing).toBe(bank.closing);
  });

  it("ages unpaid balances from the invoice date", () => {
    const aging = receivablesAging(bookings, "2026-03-15");
    expect(aging.total).toBe(6_110_000);
    expect(aging.rows[0].bucket).toBe("61–90 days");
  });

  it("rejects a manual entry that doesn't balance", () => {
    expect(isBalanced([{ account: "6102", debit: 100 }, { account: "1102", credit: 90 }])).toBe(false);
    expect(isBalanced([{ account: "6102", debit: 100, credit: 100 }])).toBe(false);
  });
});
