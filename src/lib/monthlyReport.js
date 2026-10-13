/**
 * The monthly management report: one month's profit and loss and key
 * figures, set against the previous month, the same month last year and
 * year to date. Everything reads the ledger in lib/accounting.js.
 */
import moment from "moment";
import { balanceSheet, incomeStatement } from "@/lib/accounting";
import { totalOf } from "@/lib/payments";

const D = "YYYY-MM-DD";
const span = (start, end) => ({ from: start.format(D), to: end.format(D) });

/** The windows a month is compared with. `month` is "YYYY-MM". */
export function reportWindows(month) {
  const m = moment(`${month}-01`);
  const prev = m.clone().subtract(1, "month");
  const ly = m.clone().subtract(1, "year");
  return {
    cur: span(m.clone().startOf("month"), m.clone().endOf("month")),
    prev: span(prev.clone().startOf("month"), prev.clone().endOf("month")),
    yoy: span(ly.clone().startOf("month"), ly.clone().endOf("month")),
    ytd: span(m.clone().startOf("year"), m.clone().endOf("month")),
    ytdLy: span(ly.clone().startOf("year"), ly.clone().endOf("month")),
  };
}

/** Change from a base: amount and percent (null when the base is zero). */
export const change = (cur, base) => ({ abs: cur - base, pct: base ? Math.round(((cur - base) / Math.abs(base)) * 1000) / 10 : null });

const KEYS = ["cur", "prev", "yoy", "ytd", "ytdLy"];
const across = (fn) => Object.fromEntries(KEYS.map((k) => [k, fn(k)]));

/**
 * Report rows. Each row carries a value per window (cur, prev, yoy, ytd,
 * ytdLy) and `better`: "up" when growth is good news, "down" for costs.
 */
export function monthlyReport(entries, accounts, bookings, month) {
  const w = reportWindows(month);
  const pl = across((k) => incomeStatement(entries, accounts, w[k].from, w[k].to));
  const codes = (section) => [...new Set(KEYS.flatMap((k) => pl[k][section].map((a) => a.code)))].sort();
  const amount = (k, section, code) => pl[k][section].find((a) => a.code === code)?.amount || 0;
  const name = (code) => accounts.find((a) => a.code === code)?.name || code;

  const pnl = [
    ...codes("revenue").map((c) => ({ label: `${c} ${name(c)}`, section: "Revenue", values: across((k) => amount(k, "revenue", c)), better: "up" })),
    { label: "Total revenue", section: "Revenue", total: true, values: across((k) => pl[k].totalRevenue), better: "up" },
    ...codes("cost").map((c) => ({ label: `${c} ${name(c)}`, section: "Cost of sales", values: across((k) => amount(k, "cost", c)), better: "down" })),
    { label: "Gross profit", section: "Cost of sales", total: true, values: across((k) => pl[k].gross), better: "up" },
    ...codes("expense").map((c) => ({ label: `${c} ${name(c)}`, section: "Operating expenses", values: across((k) => amount(k, "expense", c)), better: "down" })),
    { label: "Total operating expenses", section: "Operating expenses", total: true, values: across((k) => pl[k].totalExpense), better: "down" },
    { label: "Net profit", section: "Result", total: true, values: across((k) => pl[k].net), better: "up" },
  ];

  const inWindow = (b, k) => { const d = String(b.created_at).slice(0, 10); return d >= w[k].from && d <= w[k].to; };
  const sold = (k) => bookings.filter((b) => b.status !== "cancelled" && inWindow(b, k));
  const margin = (k, v) => (pl[k].totalRevenue ? Math.round((v / pl[k].totalRevenue) * 1000) / 10 : 0);
  const sheet = across((k) => balanceSheet(entries, accounts, w[k].to));
  const balance = (k, test) => [...sheet[k].assets, ...sheet[k].liabilities].filter(test).reduce((s, a) => s + a.amount, 0);
  const cashCodes = new Set(accounts.filter((a) => a.cash).map((a) => a.code));

  const metrics = [
    { label: "Bookings sold", format: "count", values: across((k) => sold(k).length), better: "up" },
    { label: "Average booking value", format: "idr", values: across((k) => { const s = sold(k); return s.length ? Math.round(s.reduce((t, b) => t + totalOf(b), 0) / s.length) : 0; }), better: "up" },
    { label: "Cancellations", format: "count", values: across((k) => bookings.filter((b) => b.status === "cancelled" && inWindow(b, k)).length), better: "down" },
    { label: "Gross margin", format: "pct", values: across((k) => margin(k, pl[k].gross)), better: "up" },
    { label: "Net margin", format: "pct", values: across((k) => margin(k, pl[k].net)), better: "up" },
    { label: "Cash and bank at month end", format: "idr", values: across((k) => balance(k, (a) => cashCodes.has(a.code))), better: "up", balance: true },
    { label: "Receivables at month end", format: "idr", values: across((k) => balance(k, (a) => a.code === "1201")), better: "down", balance: true },
    { label: "Payables at month end", format: "idr", values: across((k) => balance(k, (a) => a.code === "2101")), better: "down", balance: true },
  ];

  const trend = [];
  for (let i = 11; i >= 0; i--) {
    const m = moment(`${month}-01`).subtract(i, "months");
    const p = incomeStatement(entries, accounts, m.clone().startOf("month").format(D), m.clone().endOf("month").format(D));
    trend.push({ month: m.format("MMM YY"), revenue: p.totalRevenue, gross: p.gross, expense: p.totalExpense, net: p.net });
  }

  return { month, label: moment(`${month}-01`).format("MMMM YYYY"), windows: w, pnl, metrics, trend, summary: summarize(pnl, month) };
}

/** Three plain sentences on what moved, for the top of the report. */
function summarize(pnl, month) {
  const m = moment(`${month}-01`);
  const prevName = m.clone().subtract(1, "month").format("MMMM");
  const total = (label) => pnl.find((r) => r.label === label).values;
  const rev = total("Total revenue"), net = total("Net profit");
  const say = (v, base, what, vs) => {
    const c = change(v, base);
    if (!base) return `${what} was ${idr(v)}; ${vs} had none to compare.`;
    // Past doubling, a multiple reads better than "rose 993%".
    if (c.pct >= 100 && base > 0) return `${what} grew ${(v / base).toFixed(1)}× ${vs}, to ${idr(v)}.`;
    return `${what} ${c.abs >= 0 ? "rose" : "fell"} ${Math.round(Math.abs(c.pct))}% ${vs}, to ${idr(v)}.`;
  };
  const lines = [say(rev.cur, rev.prev, "Revenue", `from ${prevName}`), say(net.cur, net.yoy, "Net profit", `against ${m.clone().subtract(1, "year").format("MMMM YYYY")}`)];
  const movers = pnl.filter((r) => !r.total).map((r) => ({ ...r, d: r.values.cur - r.values.prev })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  if (movers[0]?.d) lines.push(`The biggest move from ${prevName} was ${movers[0].label.replace(/^\d+ /, "")}, ${movers[0].d > 0 ? "up" : "down"} ${idr(Math.abs(movers[0].d))}.`);
  return lines;
}

const idr = (n) => `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(n))}`;
