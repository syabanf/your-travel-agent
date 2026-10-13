/**
 * Double-entry accounting for the back office.
 *
 * Bookings post their own journal entries, derived from price, paid_amount,
 * cost_price and status the same way payment state is (lib/payments.js), so
 * the books can't drift from the bookings. Staff add everything else
 * (expenses, capital, equipment) as manual entries. Every report below reads
 * only those entries.
 */
import { paidOf, totalOf } from "@/lib/payments";

/**
 * PPN on a travel agency's billing. Prices are tax-inclusive, so the tax is
 * carved out of each invoice. 1.1% follows the "besaran tertentu" rate for
 * travel agents; confirm it with your tax adviser before filing.
 */
export const PPN_RATE = 0.011;

export const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "cost", label: "Cost of sales" },
  { value: "expense", label: "Expense" },
];

/** Chart of accounts. `system` accounts receive the automatic booking postings. */
export const DEFAULT_ACCOUNTS = [
  { code: "1101", name: "Cash on hand", type: "asset", cash: true },
  { code: "1102", name: "Bank BCA", type: "asset", cash: true, system: true },
  { code: "1201", name: "Accounts receivable", type: "asset", system: true },
  { code: "1301", name: "Supplier deposits", type: "asset" },
  { code: "1501", name: "Office equipment", type: "asset" },
  { code: "2101", name: "Accounts payable (suppliers)", type: "liability", system: true },
  { code: "2102", name: "Customer deposits", type: "liability", system: true },
  { code: "2201", name: "PPN payable", type: "liability", system: true },
  { code: "3101", name: "Owner's capital", type: "equity" },
  { code: "3201", name: "Retained earnings", type: "equity", system: true },
  { code: "4101", name: "Tour package sales", type: "revenue", system: true },
  { code: "4102", name: "Hotel sales", type: "revenue", system: true },
  { code: "4103", name: "Ticketing and transport sales", type: "revenue", system: true },
  { code: "4104", name: "Activity sales", type: "revenue", system: true },
  { code: "4201", name: "Cancellation income", type: "revenue", system: true },
  { code: "5101", name: "Cost of sales (suppliers)", type: "cost", system: true },
  { code: "6101", name: "Salaries", type: "expense" },
  { code: "6102", name: "Office rent", type: "expense" },
  { code: "6103", name: "Marketing and ads", type: "expense" },
  { code: "6104", name: "Payment and bank fees", type: "expense" },
  { code: "6105", name: "Utilities and internet", type: "expense" },
  { code: "6199", name: "Other operating expenses", type: "expense" },
];

const BANK = "1102", AR = "1201", AP = "2101", DEPOSITS = "2102", PPN = "2201", CANCEL = "4201", COGS = "5101";
const SALES = { package: "4101", tour: "4101", hotel: "4102", flight: "4103", transport: "4103", train: "4103", bus: "4103", ship: "4103" };
export const salesAccount = (type) => SALES[type] || "4104";

/** Debit-normal types grow with debits; the rest grow with credits. */
const DEBIT_NORMAL = new Set(["asset", "cost", "expense"]);
const day = (iso) => String(iso || "").slice(0, 10);
const n = (v) => Math.round(Number(v) || 0);

const entry = (id, date, ref, memo, lines, source = "booking") => ({
  id, date: day(date), ref, memo, source,
  lines: lines.filter((l) => l.debit || l.credit),
});

/** The journal entries one booking produces. */
export function bookingEntries(b) {
  const price = totalOf(b);
  const paid = paidOf(b);
  const ref = b.confirmation_code || b.id;
  const out = [];
  if (b.status === "cancelled") {
    const refunded = Math.min(n(b.refunded_amount), paid);
    if (paid) out.push(entry(`${b.id}:receipt`, b.created_at, ref, `Payment received: ${b.title}`, [{ account: BANK, debit: paid }, { account: DEPOSITS, credit: paid }]));
    if (refunded) out.push(entry(`${b.id}:refund`, b.updated_at || b.created_at, ref, `Refund on cancellation: ${b.title}`, [{ account: DEPOSITS, debit: refunded }, { account: BANK, credit: refunded }]));
    if (paid > refunded) out.push(entry(`${b.id}:forfeit`, b.updated_at || b.created_at, ref, `Cancellation fee kept: ${b.title}`, [{ account: DEPOSITS, debit: paid - refunded }, { account: CANCEL, credit: paid - refunded }]));
    return out;
  }
  if (price) {
    const tax = Math.round((price * PPN_RATE) / (1 + PPN_RATE));
    out.push(entry(`${b.id}:invoice`, b.created_at, ref, `Invoice: ${b.title}`, [
      { account: AR, debit: price },
      { account: salesAccount(b.type), credit: price - tax },
      { account: PPN, credit: tax },
    ]));
  }
  if (paid) out.push(entry(`${b.id}:payment`, b.updated_at || b.created_at, ref, `Payment received: ${b.title}`, [{ account: BANK, debit: paid }, { account: AR, credit: paid }]));
  const cost = n(b.cost_price);
  if (cost && (b.status === "confirmed" || b.status === "completed")) {
    out.push(entry(`${b.id}:cost`, b.created_at, ref, `Supplier cost: ${b.title}`, [{ account: COGS, debit: cost }, { account: AP, credit: cost }]));
    if (b.status === "completed") out.push(entry(`${b.id}:supplier`, b.check_out || b.check_in || b.updated_at, ref, `Supplier paid: ${b.title}`, [{ account: AP, debit: cost }, { account: BANK, credit: cost }]));
  }
  return out;
}

/** Booking postings and manual entries, oldest first. */
export const allEntries = (bookings = [], manual = []) =>
  [...bookings.flatMap(bookingEntries), ...manual.map((m) => ({ ...m, date: day(m.date), source: "manual" }))]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

/** True when debits equal credits and every line has one side. */
export const isBalanced = (lines = []) => {
  const d = lines.reduce((s, l) => s + n(l.debit), 0);
  const c = lines.reduce((s, l) => s + n(l.credit), 0);
  return d > 0 && d === c && lines.every((l) => l.account && !(n(l.debit) && n(l.credit)));
};

const inRange = (date, from, to) => (!from || date >= from) && (!to || date <= to);
const typeOf = (accounts) => Object.fromEntries(accounts.map((a) => [a.code, a.type]));
const signed = (type, debit, credit) => (DEBIT_NORMAL.has(type) ? debit - credit : credit - debit);

/** Debit and credit totals per account over a date range. */
function totals(entries, from, to) {
  const t = {};
  for (const e of entries) {
    if (!inRange(e.date, from, to)) continue;
    for (const l of e.lines) {
      t[l.account] = t[l.account] || { debit: 0, credit: 0 };
      t[l.account].debit += n(l.debit);
      t[l.account].credit += n(l.credit);
    }
  }
  return t;
}

/** One account's postings with a running balance, from an opening balance at `from`. */
export function ledger(entries, account, accounts, from, to) {
  const type = typeOf(accounts)[account] || "asset";
  const before = from ? totals(entries, null, prevDay(from))[account] : null;
  let balance = before ? signed(type, before.debit, before.credit) : 0;
  const opening = balance;
  const rows = [];
  for (const e of entries) {
    if (!inRange(e.date, from, to)) continue;
    for (const l of e.lines) {
      if (l.account !== account) continue;
      balance += signed(type, n(l.debit), n(l.credit));
      rows.push({ id: e.id, date: e.date, ref: e.ref, memo: l.note || e.memo, source: e.source, debit: n(l.debit), credit: n(l.credit), balance });
    }
  }
  return { opening, rows, closing: balance };
}

/** Every account's debit or credit balance as of `to`. Debits and credits match. */
export function trialBalance(entries, accounts, to) {
  const t = totals(entries, null, to);
  const rows = accounts.map((a) => {
    const { debit = 0, credit = 0 } = t[a.code] || {};
    const net = debit - credit;
    return { ...a, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 };
  }).filter((r) => r.debit || r.credit);
  return { rows, debit: rows.reduce((s, r) => s + r.debit, 0), credit: rows.reduce((s, r) => s + r.credit, 0) };
}

/** Profit and loss over a range. */
export function incomeStatement(entries, accounts, from, to) {
  const t = totals(entries, from, to);
  const section = (type) => accounts.filter((a) => a.type === type)
    .map((a) => ({ ...a, amount: signed(type, t[a.code]?.debit || 0, t[a.code]?.credit || 0) }))
    .filter((a) => a.amount);
  const sum = (rows) => rows.reduce((s, r) => s + r.amount, 0);
  const revenue = section("revenue"), cost = section("cost"), expense = section("expense");
  const gross = sum(revenue) - sum(cost);
  return { revenue, cost, expense, totalRevenue: sum(revenue), totalCost: sum(cost), gross, totalExpense: sum(expense), net: gross - sum(expense) };
}

/** Balance sheet as of `to`. Profit not yet closed shows as current earnings. */
export function balanceSheet(entries, accounts, to) {
  const t = totals(entries, null, to);
  const section = (type) => accounts.filter((a) => a.type === type)
    .map((a) => ({ ...a, amount: signed(type, t[a.code]?.debit || 0, t[a.code]?.credit || 0) }))
    .filter((a) => a.amount);
  const sum = (rows) => rows.reduce((s, r) => s + r.amount, 0);
  const assets = section("asset"), liabilities = section("liability"), equity = section("equity");
  const earnings = incomeStatement(entries, accounts, null, to).net;
  const totalEquity = sum(equity) + earnings;
  return { assets, liabilities, equity, earnings, totalAssets: sum(assets), totalLiabilities: sum(liabilities), totalEquity, balanced: sum(assets) === sum(liabilities) + totalEquity };
}

/** Cash in and out of the cash accounts over a range, grouped by the other side of each entry. */
export function cashFlow(entries, accounts, from, to) {
  const cash = new Set(accounts.filter((a) => a.cash).map((a) => a.code));
  const kind = typeOf(accounts);
  const groups = {};
  let opening = 0;
  for (const e of entries) {
    const move = e.lines.filter((l) => cash.has(l.account)).reduce((s, l) => s + n(l.debit) - n(l.credit), 0);
    if (!move) continue;
    if (from && e.date < from) { opening += move; continue; }
    if (!inRange(e.date, from, to)) continue;
    const other = e.lines.find((l) => !cash.has(l.account))?.account;
    const t = kind[other];
    const label = t === "equity" ? "Financing (capital)" : t === "asset" && other !== AR ? "Investing (equipment, deposits)"
      : move > 0 ? (other === AR ? "Received from customers" : other === DEPOSITS ? "Deposits received" : "Other receipts")
      : other === AP ? "Paid to suppliers" : other === DEPOSITS ? "Refunds to customers" : "Operating expenses paid";
    groups[label] = (groups[label] || 0) + move;
  }
  const rows = Object.entries(groups).map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount);
  const net = rows.reduce((s, r) => s + r.amount, 0);
  return { opening, rows, net, closing: opening + net };
}

/** Unpaid balances by age since the invoice: current, 31–60, 61–90, over 90 days. */
export function receivablesAging(bookings, asOf) {
  const buckets = [["0–30 days", 30], ["31–60 days", 60], ["61–90 days", 90], ["Over 90 days", Infinity]];
  const rows = bookings
    .filter((b) => b.status !== "cancelled" && totalOf(b) - paidOf(b) > 0 && day(b.created_at) <= asOf)
    .map((b) => {
      const age = Math.max(0, Math.round((Date.parse(asOf) - Date.parse(day(b.created_at))) / 86_400_000));
      return { ...b, age, due: totalOf(b) - paidOf(b), bucket: buckets.find(([, max]) => age <= max)[0] };
    })
    .sort((a, b) => b.age - a.age);
  const summary = buckets.map(([label]) => ({ label, amount: rows.filter((r) => r.bucket === label).reduce((s, r) => s + r.due, 0) }));
  return { rows, summary, total: rows.reduce((s, r) => s + r.due, 0) };
}

function prevDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
