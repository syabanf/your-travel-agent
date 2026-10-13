import { useEffect, useMemo, useState } from "react";
import { backend } from "@/api/backend";
import { formatIDR } from "@/lib/currency";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Wallet, TrendingUp, Receipt, Banknote, Landmark, Download, Scale } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import Skeleton, { SkeletonStat } from "@/components/Skeletons";
import { BRAND } from "@/lib/brand";

// Legend labels in readable text colour; the swatch already shows the series colour.
const legendLabel = (v) => <span style={{ color: BRAND.foreground }}>{v}</span>;
import { downloadCSV } from "@/lib/csv";
import { Link } from "react-router-dom";
import { DEFAULT_ACCOUNTS, allEntries, balanceSheet, cashFlow, incomeStatement, ledger, receivablesAging } from "@/lib/accounting";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AXIS = { fontSize: 11, stroke: BRAND.muted };
const TOOLTIP_STYLE = { background: "#fff", border: "1px solid rgba(15, 26, 21,0.12)", borderRadius: 12, color: BRAND.ink, fontSize: 12 };

function Kpi({ icon: Icon, label, value, sub, tone = "primary" }) {
  const toneClass = tone === "good" ? "text-success" : tone === "bad" ? "text-accent-strong" : "text-foreground";
  return (
    <div className="bg-card rounded-card p-4 min-w-0 shadow-card">
      <div className="flex items-center gap-1.5 text-muted text-[11px] uppercase tracking-wider"><Icon className="w-4 h-4 text-accent-strong shrink-0" />{label}</div>
      <div className={`text-lg lg:text-xl font-display font-bold mt-1.5 leading-tight break-words tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
function Card({ icon: Icon, title, subtitle, children, right }) {
  return (
    <div className="bg-card rounded-card overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-accent-strong" /><div><h2 className="font-display font-semibold text-foreground leading-tight">{title}</h2>{subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}</div></div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function DashboardERP() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [bookings, suppliers, customers, manual, accounts] = await Promise.all([
          backend.entities.Booking.list("-created_at", 2000),
          backend.entities.Supplier.list("-created_at", 500),
          backend.entities.Customer.list("-created_at", 500),
          backend.entities.JournalEntry.list("date", 2000),
          backend.entities.Account.list("code"),
        ]);
        if (alive) setData({ bookings, suppliers, customers, manual, accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS });
      } catch {
        if (alive) { toast.error("Couldn't load financial data"); setData({ bookings: [], suppliers: [], customers: [], manual: [], accounts: DEFAULT_ACCOUNTS }); }
      }
    })();
    return () => { alive = false; };
  }, []);

  // Every figure comes from the same ledger as Accounting, so the two pages agree.
  const f = useMemo(() => {
    if (!data) return null;
    const { accounts } = data;
    const entries = allEntries(data.bookings, data.manual);
    const to = moment().format("YYYY-MM-DD");
    const from = period === "year" ? moment().startOf("year").format("YYYY-MM-DD") : null;
    const pl = incomeStatement(entries, accounts, from, to);
    const bs = balanceSheet(entries, accounts, to);
    const cf = cashFlow(entries, accounts, from, to);
    const aging = receivablesAging(data.bookings, to);
    const ppn = ledger(entries, "2201", accounts, from, to).rows.reduce((t, r) => t + r.credit, 0);

    const custMap = Object.fromEntries(data.customers.map((c) => [c.id, c]));
    const arRows = aging.rows.map((b) => [custMap[b.customer_id]?.name || b.provider || "Walk-in", b.title, formatIDR(b.due)]);
    // Open payables: supplier cost on confirmed bookings not yet completed (completed ones are paid).
    const supMap = Object.fromEntries(data.suppliers.map((x) => [x.id, x]));
    const apAgg = {};
    for (const b of data.bookings) {
      if (b.status !== "confirmed" || !b.supplier_id || !b.cost_price) continue;
      const k = b.supplier_id;
      apAgg[k] = apAgg[k] || { name: supMap[k]?.name || k, n: 0, payable: 0 };
      apAgg[k].n++;
      apAgg[k].payable += b.cost_price;
    }
    const apList = Object.values(apAgg).sort((a, b) => b.payable - a.payable);

    // Month by month over the period (the last 12 months for "All time").
    const start = from ? moment(from) : moment().subtract(11, "months").startOf("month");
    const monthly = [];
    for (const m = start.clone().startOf("month"); m.isSameOrBefore(moment(), "month"); m.add(1, "month")) {
      const p = incomeStatement(entries, accounts, m.format("YYYY-MM-DD"), m.clone().endOf("month").format("YYYY-MM-DD"));
      monthly.push({ month: `${MONTHS[m.month()]} ${m.format("YY")}`, revenue: p.totalRevenue, cost: p.totalCost + p.totalExpense, profit: p.net });
    }
    return {
      revenue: pl.totalRevenue, cogs: pl.totalCost, gross: pl.gross, grossPct: pl.totalRevenue ? Math.round((pl.gross / pl.totalRevenue) * 100) : 0,
      opex: pl.totalExpense, net: pl.net, ppn,
      ar: aging.total, arRows, pendingCount: aging.rows.length,
      apList, ap: bs.liabilities.find((l) => l.code === "2101")?.amount || 0,
      cf, monthly,
      confirmedCount: data.bookings.filter((b) => (b.status === "confirmed" || b.status === "completed") && (!from || b.created_at >= from)).length,
    };
  }, [data, period]);

  const exportPL = () => {
    if (!f) return;
    downloadCSV("ich-income-statement", ["Line item", "Amount (IDR)"], [
      ["Revenue (net of PPN)", f.revenue],
      ["Cost of sales (suppliers)", -f.cogs],
      ["Gross profit", f.gross],
      ["Operating expenses", -f.opex],
      ["Net profit", f.net],
      ["PPN collected (payable, not income)", f.ppn],
    ]);
    toast.success("Income statement exported");
  };

  const SRow = ({ label, value, bold, negative, total }) => (
    <div className={`flex items-center justify-between px-5 py-3 ${total ? "bg-surface-2" : ""} ${bold ? "" : "border-b border-border"}`}>
      <span className={`text-sm ${bold ? "font-semibold text-foreground" : "text-muted"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? "font-display font-bold" : ""} ${negative ? "text-accent-strong" : value < 0 ? "text-accent-strong" : "text-foreground"}`}>
        {negative ? `(${formatIDR(Math.abs(value))})` : formatIDR(value)}
      </span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-accent-strong font-semibold mb-1 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Finance</p>
          <h1 className="text-2xl font-display font-bold text-foreground">Financial Report</h1>
          <p className="text-sm text-muted mt-0.5">Income statement, receivables, payables, cash flow & tax — derived from your bookings.</p>
        </div>
        <button onClick={exportPL} disabled={!f} className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-strong text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-50 disabled:opacity-50 sheen"><Download className="w-4 h-4" /> Export P&L</button>
      </header>

      {!f ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
          <Skeleton className="h-[260px] w-full rounded-2xl mb-4" />
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {[{ k: "all", l: "All time" }, { k: "year", l: "This year" }].map((p) => (
              <button key={p.k} onClick={() => setPeriod(p.k)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p.k ? "bg-accent/10 text-accent-strong" : "text-muted hover:bg-surface"}`}>{p.l}</button>
            ))}
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 stagger">
            <Kpi icon={Wallet} label="Revenue" value={formatIDR(f.revenue)} sub={`${f.confirmedCount} confirmed`} />
            <Kpi icon={TrendingUp} label="Gross profit" value={formatIDR(f.gross)} sub={`${f.grossPct}% margin`} tone="good" />
            <Kpi icon={Banknote} label="Net profit" value={formatIDR(f.net)} sub="after operating expenses" tone={f.net >= 0 ? "good" : "bad"} />
            <Kpi icon={Receipt} label="Receivables" value={formatIDR(f.ar)} sub={`${f.pendingCount} unpaid`} />
            <Kpi icon={Landmark} label="Payables" value={formatIDR(f.ap)} sub="owed to suppliers" />
          </div>

          {/* Income statement */}
          <div className="mb-4">
            <Card icon={Scale} title="Income statement (P&L)" subtitle="From the ledger: bookings plus journal entries." right={<Link to="/dashboard/accounting" className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-accent-strong hover:bg-accent-soft">Open Accounting</Link>}>
              <div>
                <SRow label="Revenue, net of PPN" value={f.revenue} />
                <SRow label="Cost of sales (suppliers)" value={f.cogs} negative />
                <SRow label="Gross profit" value={f.gross} bold total />
                <SRow label="Operating expenses (journal)" value={f.opex} negative />
                <SRow label="Net profit" value={f.net} bold total />
                <SRow label="PPN collected, owed to the tax office" value={f.ppn} />
              </div>
            </Card>
          </div>

          {/* Revenue vs cost chart */}
          <div className="mb-4">
            <Card icon={TrendingUp} title="Revenue, cost & profit by month">
              <div className="p-5">
                {f.monthly.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={f.monthly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 26, 21,0.06)" vertical={false} />
                      <XAxis dataKey="month" tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} />
                      <YAxis tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatIDR(v, { symbol: false })} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [formatIDR(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} formatter={legendLabel} />
                      <Bar dataKey="revenue" name="Revenue" fill={BRAND.ink} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Cost" fill={BRAND.warning} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Profit" fill={BRAND.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-[200px] flex items-center justify-center text-sm text-muted">No data yet</div>}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            {/* Accounts receivable */}
            <Card icon={Receipt} title="Accounts receivable" subtitle="Unpaid balances on open bookings, oldest first.">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border"><th className="px-5 py-2.5 font-medium">Customer</th><th className="px-5 py-2.5 font-medium">Booking</th><th className="px-5 py-2.5 font-medium text-right">Due</th></tr></thead>
                <tbody>
                  {f.arRows.map((r, i) => (<tr key={i} className="border-b border-border last:border-0"><td className="px-5 py-2.5 font-medium text-foreground">{r[0]}</td><td className="px-5 py-2.5 text-muted truncate max-w-[160px]">{r[1]}</td><td className="px-5 py-2.5 text-right text-accent-strong font-semibold">{r[2]}</td></tr>))}
                  {f.arRows.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-muted">Nothing outstanding.</td></tr>}
                  {f.arRows.length > 0 && <tr className="bg-surface-2"><td className="px-5 py-2.5 font-semibold" colSpan={2}>Total receivable</td><td className="px-5 py-2.5 text-right font-display font-bold text-foreground">{formatIDR(f.ar)}</td></tr>}
                </tbody>
              </table>
              </div>
            </Card>

            {/* Accounts payable */}
            <Card icon={Landmark} title="Accounts payable" subtitle="Supplier cost on confirmed bookings.">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-border"><th className="px-5 py-2.5 font-medium">Supplier</th><th className="px-5 py-2.5 font-medium text-right">Bookings</th><th className="px-5 py-2.5 font-medium text-right">Payable</th></tr></thead>
                <tbody>
                  {f.apList.map((v, i) => (<tr key={i} className="border-b border-border last:border-0"><td className="px-5 py-2.5 font-medium text-foreground">{v.name}</td><td className="px-5 py-2.5 text-right text-muted">{v.n}</td><td className="px-5 py-2.5 text-right text-foreground font-semibold">{formatIDR(v.payable)}</td></tr>))}
                  {f.apList.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-muted">Nothing payable.</td></tr>}
                  {f.apList.length > 0 && <tr className="bg-surface-2"><td className="px-5 py-2.5 font-semibold">Total payable</td><td /><td className="px-5 py-2.5 text-right font-display font-bold text-foreground">{formatIDR(f.ap)}</td></tr>}
                </tbody>
              </table>
              </div>
            </Card>
          </div>

          {/* Cash flow */}
          <Card icon={Banknote} title="Cash flow" subtitle="Cash and bank accounts, from the ledger.">
            <div>
              <SRow label="Opening cash and bank" value={f.cf.opening} />
              {f.cf.rows.map((r) => <SRow key={r.label} label={r.label} value={r.amount} />)}
              <SRow label="Closing cash and bank" value={f.cf.closing} bold total />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
