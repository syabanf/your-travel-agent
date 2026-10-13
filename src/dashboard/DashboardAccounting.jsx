import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import moment from "moment";
import { toast } from "sonner";
import { BookOpen, CheckCircle2, Download, Landmark, Pencil, Plus, Scale, Trash2, TriangleAlert, X } from "lucide-react";
import { backend } from "@/api/backend";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import Drawer from "@/dashboard/Drawer";
import SearchableSelect from "@/dashboard/SearchableSelect";
import DateTimePicker from "@/components/DateTimePicker";
import MonthlyReport from "@/dashboard/MonthlyReport";
import { confirmDialog } from "@/components/ConfirmDialog";
import { downloadCSV } from "@/lib/csv";
import { formatIDR } from "@/lib/currency";
import {
  DEFAULT_ACCOUNTS, allEntries, balanceSheet, cashFlow, incomeStatement, isBalanced, ledger, receivablesAging, trialBalance,
} from "@/lib/accounting";

const TABS = [
  ["monthly", "Monthly report"],
  ["pl", "Profit & loss"],
  ["balance", "Balance sheet"],
  ["cash", "Cash flow"],
  ["trial", "Trial balance"],
  ["ledger", "General ledger"],
  ["journal", "Journal"],
  ["receivables", "Receivables"],
];

const D = "YYYY-MM-DD";
const PERIODS = {
  month: ["This month", () => [moment().startOf("month"), moment()]],
  last_month: ["Last month", () => [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")]],
  quarter: ["This quarter", () => [moment().startOf("quarter"), moment()]],
  year: ["This year", () => [moment().startOf("year"), moment()]],
  "12m": ["Last 12 months", () => [moment().subtract(12, "months").add(1, "day"), moment()]],
};

/** Money in a statement: negatives in brackets, the accountant's way. */
const Money = ({ v, strong = false }) => (
  <span className={`tabular-nums ${strong ? "font-bold" : ""} ${v < 0 ? "text-accent-strong" : "text-foreground"}`}>
    {v < 0 ? `(${formatIDR(-v)})` : formatIDR(v)}
  </span>
);

const Line = ({ label, v, total = false, indent = false }) => (
  <div className={`flex items-center justify-between gap-4 px-5 py-2.5 text-sm ${total ? "bg-surface-2 font-semibold" : "border-b border-border"}`}>
    <span className={total ? "text-foreground" : `text-body ${indent ? "pl-4" : ""}`}>{label}</span>
    <Money v={v} strong={total} />
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <p className="eyebrow px-5 pb-1.5 pt-4">{title}</p>
    {children}
  </div>
);

const Card = ({ title, sub, action, children }) => (
  <section className="overflow-hidden rounded-card bg-card shadow-card">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const ExportButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-border">
    <Download className="size-3.5" aria-hidden="true" /> Export CSV
  </button>
);

const Balanced = ({ ok, what }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-success-soft text-success" : "bg-accent-soft text-accent-strong"}`}>
    {ok ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <TriangleAlert className="size-3.5" aria-hidden="true" />}
    {ok ? `${what} balance` : `${what} don't balance`}
  </span>
);

const TH = "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted";
const TD = "px-5 py-2.5 text-sm";

/**
 * Accounting (back office): double-entry books built from the bookings plus
 * manual journal entries, with the statements an accountant expects.
 */
export default function DashboardAccounting() {
  const { role } = useRole();
  const canPost = can(role, "accounting", "create");
  const [params, setParams] = useSearchParams();
  const tab = TABS.some(([k]) => k === params.get("tab")) ? params.get("tab") : "monthly";
  const period = params.get("period") || "year";
  const [from, to] = period === "custom"
    ? [params.get("from") || moment().startOf("year").format(D), params.get("to") || moment().format(D)]
    : PERIODS[period]?.[1]().map((m) => m.format(D)) || PERIODS.year[1]().map((m) => m.format(D));
  const set = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) v ? n.set(k, v) : n.delete(k); return n; }, { replace: true });

  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [openEntry, setOpenEntry] = useState(null);

  const load = async () => {
    const [bookings, manual, accounts, customers] = await Promise.all([
      backend.entities.Booking.list("-created_at", 2000),
      backend.entities.JournalEntry.list("date", 2000),
      backend.entities.Account.list("code"),
      backend.entities.Customer.list(),
    ]);
    setData({ bookings, manual, accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS, customers });
  };
  useEffect(() => { load().catch(() => setData({ bookings: [], manual: [], accounts: DEFAULT_ACCOUNTS, customers: [] })); }, []);

  const books = useMemo(() => {
    if (!data) return null;
    const entries = allEntries(data.bookings, data.manual);
    const { accounts } = data;
    return {
      entries,
      pl: incomeStatement(entries, accounts, from, to),
      bs: balanceSheet(entries, accounts, to),
      cf: cashFlow(entries, accounts, from, to),
      tb: trialBalance(entries, accounts, to),
      ar: receivablesAging(data.bookings, to),
    };
  }, [data, from, to]);

  const accountName = (code) => {
    const a = data?.accounts.find((x) => x.code === code);
    return a ? `${a.code} ${a.name}` : code;
  };
  const accountOptions = (data?.accounts || []).filter((a) => a.active !== false).map((a) => ({ value: a.code, label: `${a.code} ${a.name}` }));
  const rangeLabel = `${moment(from).format("D MMM YYYY")} to ${moment(to).format("D MMM YYYY")}`;
  const file = (name) => `ich-${name}-${from}-to-${to}`;

  const saveEntry = async (e) => {
    e.preventDefault();
    const lines = editing.lines
      .map((l) => ({ account: l.account, debit: Math.round(Number(l.debit) || 0), credit: Math.round(Number(l.credit) || 0), ...(l.note?.trim() ? { note: l.note.trim() } : {}) }))
      .filter((l) => l.account && (l.debit || l.credit));
    if (!editing.memo.trim()) { toast.error("Add a description for the entry"); return; }
    if (!isBalanced(lines)) { toast.error("Debits and credits must match, with each line on one side only"); return; }
    const payload = { date: editing.date, ref: editing.ref.trim(), memo: editing.memo.trim(), lines };
    try {
      if (editing.id) await backend.entities.JournalEntry.update(editing.id, payload);
      else await backend.entities.JournalEntry.create(payload);
      toast.success(editing.id ? "Journal entry saved" : "Journal entry posted", { description: `${payload.memo} · ${formatIDR(lines.reduce((s, l) => s + l.debit, 0))}` });
      setEditing(null);
      await load();
    } catch {
      toast.error("The entry wasn't saved. Try again.");
    }
  };

  const removeEntry = async (entry) => {
    const ok = await confirmDialog({ title: "Delete this journal entry?", body: `"${entry.memo}" leaves the books and every report.`, confirmLabel: "Delete", destructive: true });
    if (!ok) return;
    try {
      await backend.entities.JournalEntry.delete(entry.id);
      toast.success("Journal entry deleted", { description: entry.memo });
      setOpenEntry(null);
      await load();
    } catch { toast.error("The entry wasn't deleted. Try again."); }
  };

  const newEntry = () => setEditing({ date: moment().format(D), ref: "", memo: "", lines: [{ account: "", debit: "", credit: "", note: "" }, { account: "1102", debit: "", credit: "", note: "" }] });

  const kpis = books && [
    ["Revenue", books.pl.totalRevenue, rangeLabel],
    ["Gross profit", books.pl.gross, books.pl.totalRevenue ? `${Math.round((books.pl.gross / books.pl.totalRevenue) * 100)}% margin` : "No sales"],
    ["Net profit", books.pl.net, "After operating expenses"],
    ["Cash and bank", books.cf.closing, `On ${moment(to).format("D MMM")}`],
    ["Receivables", books.ar.total, `${books.ar.rows.length} unpaid invoice${books.ar.rows.length === 1 ? "" : "s"}`],
    ["Payables", books.bs.liabilities.find((l) => l.code === "2101")?.amount || 0, "Owed to suppliers"],
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="accounting" />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent-strong">
            <BookOpen className="size-3.5" aria-hidden="true" /> Finance
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Accounting</h1>
          <p className="mt-0.5 text-sm text-muted">
            Bookings post their own entries; add expenses and other movements as journal entries. Accounts live in <Link to="/dashboard/master?tab=accounts" className="font-semibold text-accent-strong hover:underline">Master data</Link>.
          </p>
        </div>
        {canPost && (
          <button type="button" onClick={newEntry} className="sheen inline-flex h-11 items-center gap-2 rounded-full bg-accent-strong px-4 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark">
            <Plus className="size-4" aria-hidden="true" /> New journal entry
          </button>
        )}
      </header>

      {tab !== "monthly" && <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Period">
        {[...Object.entries(PERIODS).map(([k, [l]]) => [k, l]), ["custom", "Custom"]].map(([k, l]) => (
          <button key={k} type="button" aria-pressed={period === k} onClick={() => set({ period: k })}
            className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${period === k ? "bg-ink text-white" : "bg-card text-muted shadow-card hover:text-foreground"}`}>
            {l}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="w-40"><DateTimePicker type="date" value={from} onChange={(v) => set({ from: v })} label="From" /></div>
            <span className="text-sm text-muted">to</span>
            <div className="w-40"><DateTimePicker type="date" value={to} onChange={(v) => set({ to: v })} label="To" min={from} /></div>
          </div>
        )}
      </div>}

      {!books ? <div className="skeleton h-96" /> : (
        <>
          {tab !== "monthly" && <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
            {kpis.map(([label, v, sub]) => (
              <div key={label} className="rounded-card bg-card p-4 shadow-card">
                <p className="eyebrow">{label}</p>
                <p className={`stat-value mt-1 text-lg font-extrabold sm:text-xl ${v < 0 ? "text-accent-strong" : "text-foreground"}`}>{v < 0 ? `(${formatIDR(-v)})` : formatIDR(v)}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>
              </div>
            ))}
          </div>}

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar" role="tablist" aria-label="Report">
            {TABS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => set({ tab: k })}
                className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${tab === k ? "bg-accent-strong text-white shadow-glow" : "bg-card text-muted shadow-card hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === "monthly" && <MonthlyReport entries={books.entries} accounts={data.accounts} bookings={data.bookings} />}

          {tab === "pl" && (
            <Card title="Profit and loss" sub={rangeLabel} action={<ExportButton onClick={() => downloadCSV(file("profit-and-loss"), ["Section", "Account", "Amount (IDR)"], [
              ...books.pl.revenue.map((r) => ["Revenue", `${r.code} ${r.name}`, r.amount]), ["Revenue", "Total revenue", books.pl.totalRevenue],
              ...books.pl.cost.map((r) => ["Cost of sales", `${r.code} ${r.name}`, -r.amount]), ["", "Gross profit", books.pl.gross],
              ...books.pl.expense.map((r) => ["Operating expenses", `${r.code} ${r.name}`, -r.amount]), ["", "Net profit", books.pl.net],
            ])} />}>
              <Section title="Revenue">
                {books.pl.revenue.map((r) => <Line key={r.code} label={`${r.code} ${r.name}`} v={r.amount} indent />)}
                <Line label="Total revenue" v={books.pl.totalRevenue} total />
              </Section>
              <Section title="Cost of sales">
                {books.pl.cost.map((r) => <Line key={r.code} label={`${r.code} ${r.name}`} v={-r.amount} indent />)}
                <Line label="Gross profit" v={books.pl.gross} total />
              </Section>
              <Section title="Operating expenses">
                {books.pl.expense.length ? books.pl.expense.map((r) => <Line key={r.code} label={`${r.code} ${r.name}`} v={-r.amount} indent />) : <p className="px-5 pb-3 text-sm text-muted">No expenses posted in this period.</p>}
                <Line label="Net profit" v={books.pl.net} total />
              </Section>
            </Card>
          )}

          {tab === "balance" && (
            <Card title="Balance sheet" sub={`As of ${moment(to).format("D MMMM YYYY")}`} action={<div className="flex flex-wrap items-center gap-2"><Balanced ok={books.bs.balanced} what="Assets and claims" /><ExportButton onClick={() => downloadCSV(file("balance-sheet"), ["Section", "Account", "Amount (IDR)"], [
              ...books.bs.assets.map((r) => ["Assets", `${r.code} ${r.name}`, r.amount]), ["Assets", "Total assets", books.bs.totalAssets],
              ...books.bs.liabilities.map((r) => ["Liabilities", `${r.code} ${r.name}`, r.amount]), ["Liabilities", "Total liabilities", books.bs.totalLiabilities],
              ...books.bs.equity.map((r) => ["Equity", `${r.code} ${r.name}`, r.amount]), ["Equity", "Current earnings", books.bs.earnings], ["Equity", "Total equity", books.bs.totalEquity],
            ])} /></div>}>
              <div className="grid lg:grid-cols-2">
                <Section title="Assets">
                  {books.bs.assets.map((r) => <Line key={r.code} label={`${r.code} ${r.name}`} v={r.amount} indent />)}
                  <Line label="Total assets" v={books.bs.totalAssets} total />
                </Section>
                <div className="lg:border-l lg:border-border">
                  <Section title="Liabilities">
                    {books.bs.liabilities.map((r) => <Line key={r.code} label={`${r.code} ${r.name}`} v={r.amount} indent />)}
                    <Line label="Total liabilities" v={books.bs.totalLiabilities} total />
                  </Section>
                  <Section title="Equity">
                    {books.bs.equity.map((r) => <Line key={r.code} label={`${r.code} ${r.name}`} v={r.amount} indent />)}
                    <Line label="Current earnings (not yet closed)" v={books.bs.earnings} indent />
                    <Line label="Total liabilities and equity" v={books.bs.totalLiabilities + books.bs.totalEquity} total />
                  </Section>
                </div>
              </div>
            </Card>
          )}

          {tab === "cash" && (
            <Card title="Cash flow" sub={`${rangeLabel} · accounts marked as cash or bank`} action={<ExportButton onClick={() => downloadCSV(file("cash-flow"), ["Line", "Amount (IDR)"], [["Opening balance", books.cf.opening], ...books.cf.rows.map((r) => [r.label, r.amount]), ["Net change", books.cf.net], ["Closing balance", books.cf.closing]])} />}>
              <Line label="Opening cash and bank" v={books.cf.opening} total />
              {books.cf.rows.length ? books.cf.rows.map((r) => <Line key={r.label} label={r.label} v={r.amount} indent />) : <p className="px-5 py-3 text-sm text-muted">No cash moved in this period.</p>}
              <Line label="Net change" v={books.cf.net} />
              <Line label="Closing cash and bank" v={books.cf.closing} total />
            </Card>
          )}

          {tab === "trial" && (
            <Card title="Trial balance" sub={`As of ${moment(to).format("D MMMM YYYY")}`} action={<div className="flex flex-wrap items-center gap-2"><Balanced ok={books.tb.debit === books.tb.credit} what="Debits and credits" /><ExportButton onClick={() => downloadCSV(file("trial-balance"), ["Code", "Account", "Debit", "Credit"], [...books.tb.rows.map((r) => [r.code, r.name, r.debit || "", r.credit || ""]), ["", "Total", books.tb.debit, books.tb.credit]])} /></div>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead><tr className="border-b border-border"><th className={TH}>Account</th><th className={`${TH} text-right`}>Debit</th><th className={`${TH} text-right`}>Credit</th></tr></thead>
                  <tbody>
                    {books.tb.rows.map((r) => (
                      <tr key={r.code} className="cursor-pointer border-b border-border transition-colors hover:bg-surface-2" onClick={() => set({ tab: "ledger", account: r.code })}>
                        <td className={TD}><span className="font-mono text-xs font-semibold text-foreground">{r.code}</span> <span className="text-body">{r.name}</span></td>
                        <td className={`${TD} text-right tabular-nums text-foreground`}>{r.debit ? formatIDR(r.debit) : ""}</td>
                        <td className={`${TD} text-right tabular-nums text-foreground`}>{r.credit ? formatIDR(r.credit) : ""}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-2 font-semibold"><td className={TD}>Total</td><td className={`${TD} text-right tabular-nums`}>{formatIDR(books.tb.debit)}</td><td className={`${TD} text-right tabular-nums`}>{formatIDR(books.tb.credit)}</td></tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === "ledger" && (() => {
            const code = params.get("account") || "1102";
            const lg = ledger(books.entries, code, data.accounts, from, to);
            return (
              <Card title="General ledger" sub={`${accountName(code)} · ${rangeLabel}`} action={<div className="flex flex-wrap items-center gap-2">
                <div className="w-64"><SearchableSelect value={code} onChange={(v) => set({ account: v })} options={accountOptions} ariaLabel="Account" /></div>
                <ExportButton onClick={() => downloadCSV(file(`ledger-${code}`), ["Date", "Ref", "Description", "Debit", "Credit", "Balance"], [["", "", "Opening balance", "", "", lg.opening], ...lg.rows.map((r) => [r.date, r.ref, r.memo, r.debit || "", r.credit || "", r.balance])])} />
              </div>}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead><tr className="border-b border-border"><th className={TH}>Date</th><th className={TH}>Ref</th><th className={TH}>Description</th><th className={`${TH} text-right`}>Debit</th><th className={`${TH} text-right`}>Credit</th><th className={`${TH} text-right`}>Balance</th></tr></thead>
                    <tbody>
                      <tr className="border-b border-border bg-surface-2"><td className={TD} colSpan={5}>Opening balance</td><td className={`${TD} text-right`}><Money v={lg.opening} /></td></tr>
                      {lg.rows.map((r, i) => (
                        <tr key={`${r.id}-${i}`} className="border-b border-border">
                          <td className={`${TD} whitespace-nowrap text-muted`}>{moment(r.date).format("D MMM YYYY")}</td>
                          <td className={`${TD} font-mono text-xs text-body`}>{r.ref}</td>
                          <td className={`${TD} text-foreground`}>{r.memo}</td>
                          <td className={`${TD} text-right tabular-nums`}>{r.debit ? formatIDR(r.debit) : ""}</td>
                          <td className={`${TD} text-right tabular-nums`}>{r.credit ? formatIDR(r.credit) : ""}</td>
                          <td className={`${TD} text-right`}><Money v={r.balance} /></td>
                        </tr>
                      ))}
                      {!lg.rows.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">No postings to this account in the period.</td></tr>}
                      <tr className="bg-surface-2 font-semibold"><td className={TD} colSpan={5}>Closing balance</td><td className={`${TD} text-right`}><Money v={lg.closing} strong /></td></tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

          {tab === "journal" && (() => {
            const rows = books.entries.filter((e) => e.date >= from && e.date <= to).reverse();
            return (
              <Card title="Journal" sub={`${rows.length} entries · ${rangeLabel}`} action={<ExportButton onClick={() => downloadCSV(file("journal"), ["Date", "Ref", "Description", "Source", "Account", "Debit", "Credit"], rows.flatMap((e) => e.lines.map((l) => [e.date, e.ref, e.memo, e.source, accountName(l.account), l.debit || "", l.credit || ""])))} />}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead><tr className="border-b border-border"><th className={TH}>Date</th><th className={TH}>Ref</th><th className={TH}>Description</th><th className={TH}>Source</th><th className={`${TH} text-right`}>Amount</th></tr></thead>
                    <tbody>
                      {rows.map((e) => (
                        <tr key={e.id} onClick={() => setOpenEntry(e)} className="cursor-pointer border-b border-border transition-colors hover:bg-surface-2">
                          <td className={`${TD} whitespace-nowrap text-muted`}>{moment(e.date).format("D MMM YYYY")}</td>
                          <td className={`${TD} font-mono text-xs text-body`}>{e.ref}</td>
                          <td className={`${TD} text-foreground`}>{e.memo}</td>
                          <td className={TD}><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${e.source === "manual" ? "bg-info-soft text-info" : "bg-surface text-body"}`}>{e.source === "manual" ? "Manual" : "Booking"}</span></td>
                          <td className={`${TD} text-right tabular-nums text-foreground`}>{formatIDR(e.lines.reduce((s, l) => s + (l.debit || 0), 0))}</td>
                        </tr>
                      ))}
                      {!rows.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">No entries in this period.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

          {tab === "receivables" && (() => {
            const custName = (b) => data.customers.find((c) => c.id === b.customer_id)?.name || b.provider || "Walk-in";
            return (
              <Card title="Receivables aging" sub={`Unpaid balances as of ${moment(to).format("D MMMM YYYY")}`} action={<ExportButton onClick={() => downloadCSV(file("receivables-aging"), ["Customer", "Booking", "Invoice date", "Age (days)", "Bucket", "Due (IDR)"], books.ar.rows.map((r) => [custName(r), r.title, r.created_at?.slice(0, 10), r.age, r.bucket, r.due]))} />}>
                <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
                  {books.ar.summary.map((s) => (
                    <div key={s.label} className="bg-card px-5 py-3">
                      <p className="eyebrow">{s.label}</p>
                      <p className={`mt-0.5 text-base font-bold tabular-nums ${s.amount && s.label !== "0–30 days" ? "text-accent-strong" : "text-foreground"}`}>{formatIDR(s.amount)}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead><tr className="border-b border-border"><th className={TH}>Customer</th><th className={TH}>Booking</th><th className={TH}>Invoiced</th><th className={`${TH} text-right`}>Age</th><th className={`${TH} text-right`}>Due</th></tr></thead>
                    <tbody>
                      {books.ar.rows.map((r) => (
                        <tr key={r.id} className="border-b border-border">
                          <td className={`${TD} text-foreground`}>{custName(r)}</td>
                          <td className={TD}><Link to={`/dashboard/bookings/${r.id}`} className="font-medium text-foreground hover:text-accent-strong hover:underline">{r.title}</Link></td>
                          <td className={`${TD} whitespace-nowrap text-muted`}>{moment(r.created_at).format("D MMM YYYY")}</td>
                          <td className={`${TD} text-right tabular-nums text-body`}>{r.age} days</td>
                          <td className={`${TD} text-right font-semibold tabular-nums text-foreground`}>{formatIDR(r.due)}</td>
                        </tr>
                      ))}
                      {!books.ar.rows.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">Nothing outstanding.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}
        </>
      )}

      <Drawer open={!!openEntry} onClose={() => setOpenEntry(null)} icon={Scale} width="max-w-lg" title={openEntry?.memo || ""} subtitle={openEntry ? `${openEntry.ref} · ${moment(openEntry.date).format("D MMMM YYYY")}` : ""}>
        {openEntry && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-card bg-card shadow-card">
              <table className="w-full">
                <thead><tr className="border-b border-border"><th className={TH}>Account</th><th className={`${TH} text-right`}>Debit</th><th className={`${TH} text-right`}>Credit</th></tr></thead>
                <tbody>
                  {openEntry.lines.map((l, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className={TD}><span className="block text-foreground">{accountName(l.account)}</span>{l.note && <span className="block text-xs text-muted">{l.note}</span>}</td>
                      <td className={`${TD} text-right tabular-nums`}>{l.debit ? formatIDR(l.debit) : ""}</td>
                      <td className={`${TD} text-right tabular-nums`}>{l.credit ? formatIDR(l.credit) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {openEntry.source === "manual" ? (canPost && (
              <div className="flex gap-2">
                <button type="button" onClick={() => removeEntry(openEntry)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold text-accent-strong transition-colors hover:bg-accent-soft"><Trash2 className="size-4" aria-hidden="true" /> Delete</button>
                <button type="button" onClick={() => { setEditing({ ...openEntry, lines: openEntry.lines.map((l) => ({ ...l, debit: l.debit || "", credit: l.credit || "", note: l.note || "" })) }); setOpenEntry(null); }} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-2"><Pencil className="size-4" aria-hidden="true" /> Edit</button>
              </div>
            )) : (
              <p className="flex items-start gap-2 rounded-2xl bg-surface-2 px-4 py-3 text-xs text-body">
                <Landmark className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                The booking posts this entry. Change the booking to change it.
              </p>
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={!!editing} onClose={() => setEditing(null)} icon={editing?.id ? Pencil : Plus} width="max-w-2xl" title={editing?.id ? "Edit journal entry" : "New journal entry"} subtitle="Expenses, capital, transfers and corrections">
        {editing && (() => {
          const debit = editing.lines.reduce((s, l) => s + (Math.round(Number(l.debit)) || 0), 0);
          const credit = editing.lines.reduce((s, l) => s + (Math.round(Number(l.credit)) || 0), 0);
          const setLine = (i, patch) => setEditing((p) => ({ ...p, lines: p.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
          return (
            <form onSubmit={saveEntry} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="eyebrow mb-1 block">Date</span><DateTimePicker type="date" value={editing.date} onChange={(v) => setEditing((p) => ({ ...p, date: v }))} label="Entry date" /></label>
                <label className="block"><span className="eyebrow mb-1 block">Reference</span><input value={editing.ref} onChange={(e) => setEditing((p) => ({ ...p, ref: e.target.value }))} placeholder="INV-0042" className="dash-input" /></label>
              </div>
              <label className="block"><span className="eyebrow mb-1 block">Description *</span><input value={editing.memo} onChange={(e) => setEditing((p) => ({ ...p, memo: e.target.value }))} placeholder="October office rent" className="dash-input" /></label>

              <div className="space-y-2">
                <p className="eyebrow">Lines</p>
                {editing.lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_7.5rem_7.5rem_2.5rem] items-start gap-2 rounded-2xl bg-card p-2 shadow-card">
                    <div className="space-y-1.5">
                      <SearchableSelect value={l.account} onChange={(v) => setLine(i, { account: v })} options={accountOptions} placeholder="Account" ariaLabel={`Line ${i + 1} account`} />
                      <input value={l.note} onChange={(e) => setLine(i, { note: e.target.value })} placeholder="Line note (optional)" aria-label={`Line ${i + 1} note`} className="dash-input h-9" />
                    </div>
                    <input type="number" min="0" value={l.debit} onChange={(e) => setLine(i, { debit: e.target.value, credit: e.target.value ? "" : l.credit })} placeholder="Debit" aria-label={`Line ${i + 1} debit`} className="dash-input text-right" />
                    <input type="number" min="0" value={l.credit} onChange={(e) => setLine(i, { credit: e.target.value, debit: e.target.value ? "" : l.debit })} placeholder="Credit" aria-label={`Line ${i + 1} credit`} className="dash-input text-right" />
                    <button type="button" onClick={() => setEditing((p) => ({ ...p, lines: p.lines.filter((_, j) => j !== i) }))} disabled={editing.lines.length <= 2} aria-label={`Remove line ${i + 1}`} title={editing.lines.length <= 2 ? "An entry needs at least two lines" : undefined} className="flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground disabled:opacity-30">
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setEditing((p) => ({ ...p, lines: [...p.lines, { account: "", debit: "", credit: "", note: "" }] }))} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-border">
                  <Plus className="size-3.5" aria-hidden="true" /> Add line
                </button>
              </div>

              <div className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm ${debit && debit === credit ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                <span className="font-semibold">Debits {formatIDR(debit)} · Credits {formatIDR(credit)}</span>
                <span>{debit && debit === credit ? "Balanced" : `Off by ${formatIDR(Math.abs(debit - credit))}`}</span>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditing(null)} className="h-11 flex-1 rounded-full text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground">Cancel</button>
                <button type="submit" className="sheen h-11 flex-1 rounded-full bg-accent-strong text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark">{editing.id ? "Save entry" : "Post entry"}</button>
              </div>
            </form>
          );
        })()}
      </Drawer>
    </div>
  );
}
