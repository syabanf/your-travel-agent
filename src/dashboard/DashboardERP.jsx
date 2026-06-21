import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Wallet, TrendingUp, Receipt, Banknote, Landmark, Download, Scale, Building2, Users } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import Skeleton, { SkeletonStat } from "@/components/Skeletons";

const TAX_RATE = 0.11;   // PPN (VAT) on operating profit
const OPEX_RATE = 0.12;  // estimated operating expenses as % of revenue
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AXIS = { fontSize: 11, stroke: "#5A6B85" };
const TOOLTIP_STYLE = { background: "#fff", border: "1px solid rgba(11,27,59,0.12)", borderRadius: 12, color: "#0B1B3B", fontSize: 12 };

function Kpi({ icon: Icon, label, value, sub, tone = "primary" }) {
  const toneClass = tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-mora-primary";
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 p-4 min-w-0">
      <div className="flex items-center gap-1.5 text-mora-neutral text-[11px] uppercase tracking-wider"><Icon className="w-4 h-4 text-gold shrink-0" />{label}</div>
      <div className={`text-lg lg:text-xl font-display font-bold mt-1.5 leading-tight break-words tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-mora-neutral/70 mt-0.5">{sub}</div>}
    </div>
  );
}
function Card({ icon: Icon, title, subtitle, children, right }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-mora-primary/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-gold" /><div><h2 className="font-display font-semibold text-mora-primary leading-tight">{title}</h2>{subtitle && <p className="text-xs text-mora-neutral mt-0.5">{subtitle}</p>}</div></div>
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
        const [bookings, suppliers, customers] = await Promise.all([
          base44.entities.Booking.list("-created_date", 500),
          base44.entities.Supplier.list("-created_date", 500),
          base44.entities.Customer.list("-created_date", 500),
        ]);
        if (alive) setData({ bookings, suppliers, customers });
      } catch {
        if (alive) { toast.error("Couldn't load financial data"); setData({ bookings: [], suppliers: [], customers: [] }); }
      }
    })();
    return () => { alive = false; };
  }, []);

  const thisYear = moment().year();
  const inPeriod = (b) => period === "all" || moment(b.created_date).year() === thisYear;

  const f = useMemo(() => {
    if (!data) return null;
    const bookings = data.bookings.filter(inPeriod);
    const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const pending = bookings.filter((b) => b.status === "pending");

    const revenue = confirmed.reduce((s, b) => s + (b.price || 0), 0);
    const cogs = confirmed.reduce((s, b) => s + (b.cost_price || 0), 0);
    const gross = revenue - cogs;
    const grossPct = revenue ? Math.round((gross / revenue) * 100) : 0;
    const opex = Math.round(revenue * OPEX_RATE);
    const ebit = gross - opex;
    const tax = ebit > 0 ? Math.round(ebit * TAX_RATE) : 0;
    const net = ebit - tax;

    // Accounts receivable — pending (unpaid) bookings owed to us.
    const ar = pending.reduce((s, b) => s + (b.price || 0), 0);
    const supMap = Object.fromEntries(data.suppliers.map((s) => [s.id, s]));
    const custMap = Object.fromEntries(data.customers.map((c) => [c.id, c]));
    const arRows = pending.map((b) => [custMap[b.customer_id]?.name || b.provider || "—", b.title, formatIDR(b.price || 0)]);

    // Accounts payable — supplier cost on confirmed bookings.
    const apAgg = {};
    confirmed.forEach((b) => { if (!b.supplier_id) return; const k = b.supplier_id; apAgg[k] = apAgg[k] || { name: supMap[k]?.name || k, n: 0, payable: 0 }; apAgg[k].n++; apAgg[k].payable += b.cost_price || 0; });
    const apList = Object.values(apAgg).sort((a, b) => b.payable - a.payable);
    const ap = apList.reduce((s, v) => s + v.payable, 0);

    // Cash flow
    const refunds = cancelled.reduce((s, b) => s + (b.refunded_amount || 0), 0);
    const inflow = revenue;
    const outflow = cogs + refunds;
    const netCash = inflow - outflow;

    // Monthly revenue / cost / profit
    const byMonth = {};
    confirmed.forEach((b) => { const m = MONTHS[moment(b.check_in || b.created_date).month()]; byMonth[m] = byMonth[m] || { month: m, revenue: 0, cost: 0 }; byMonth[m].revenue += b.price || 0; byMonth[m].cost += b.cost_price || 0; });
    const monthly = MONTHS.filter((m) => byMonth[m]).map((m) => ({ ...byMonth[m], profit: byMonth[m].revenue - byMonth[m].cost }));

    return { revenue, cogs, gross, grossPct, opex, ebit, tax, net, ar, arRows, apList, ap, refunds, inflow, outflow, netCash, monthly, confirmedCount: confirmed.length, pendingCount: pending.length };
  }, [data, period]);

  const exportPL = () => {
    if (!f) return;
    const rows = [
      ["Revenue (confirmed sales)", f.revenue],
      ["Cost of sales (supplier)", -f.cogs],
      ["Gross profit", f.gross],
      ["Operating expenses (est.)", -f.opex],
      ["Operating profit (EBIT)", f.ebit],
      ["Tax (PPN 11%)", -f.tax],
      ["Net profit", f.net],
    ];
    const csv = [["Line item", "Amount (IDR)"], ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mora-income-statement-${moment().format("YYYY-MM-DD")}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success("Income statement exported");
  };

  const SRow = ({ label, value, bold, negative, total }) => (
    <div className={`flex items-center justify-between px-5 py-3 ${total ? "bg-mora-primary/[0.03]" : ""} ${bold ? "" : "border-b border-mora-primary/5"}`}>
      <span className={`text-sm ${bold ? "font-semibold text-mora-primary" : "text-mora-neutral"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? "font-display font-bold" : ""} ${negative ? "text-red-600" : value < 0 ? "text-red-600" : "text-mora-primary"}`}>
        {negative ? `(${formatIDR(Math.abs(value))})` : formatIDR(value)}
      </span>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Scale className="w-3.5 h-3.5" /> Finance</p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">ERP Reports</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Income statement, receivables, payables, cash flow & tax — derived from your bookings.</p>
        </div>
        <button onClick={exportPL} disabled={!f} className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium btn-primary disabled:opacity-50"><Download className="w-4 h-4" /> Export P&L</button>
      </header>

      {!f ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
          <Skeleton className="h-[260px] w-full rounded-2xl mb-4" />
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {[{ k: "all", l: "All time" }, { k: "year", l: "This year" }].map((p) => (
              <button key={p.k} onClick={() => setPeriod(p.k)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p.k ? "bg-mora-gold/10 text-gold" : "text-mora-neutral hover:bg-mora-primary/5"}`}>{p.l}</button>
            ))}
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4 stagger">
            <Kpi icon={Wallet} label="Revenue" value={formatIDR(f.revenue)} sub={`${f.confirmedCount} confirmed`} />
            <Kpi icon={TrendingUp} label="Gross profit" value={formatIDR(f.gross)} sub={`${f.grossPct}% margin`} tone="good" />
            <Kpi icon={Banknote} label="Net profit" value={formatIDR(f.net)} sub="after opex & tax" tone={f.net >= 0 ? "good" : "bad"} />
            <Kpi icon={Receipt} label="Receivables" value={formatIDR(f.ar)} sub={`${f.pendingCount} pending`} />
            <Kpi icon={Landmark} label="Payables" value={formatIDR(f.ap)} sub="to suppliers" />
          </div>

          {/* Income statement */}
          <div className="mb-4">
            <Card icon={Scale} title="Income statement (P&L)" subtitle="Profit & loss from confirmed bookings.">
              <div>
                <SRow label="Revenue — confirmed sales" value={f.revenue} />
                <SRow label="Cost of sales — supplier cost" value={f.cogs} negative />
                <SRow label="Gross profit" value={f.gross} bold total />
                <SRow label="Operating expenses (estimated)" value={f.opex} negative />
                <SRow label="Operating profit (EBIT)" value={f.ebit} bold total />
                <SRow label="Tax — PPN 11%" value={f.tax} negative />
                <SRow label="Net profit" value={f.net} bold total />
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
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,27,59,0.06)" vertical={false} />
                      <XAxis dataKey="month" tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} />
                      <YAxis tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatIDR(v, { symbol: false })} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [formatIDR(v), n]} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="revenue" name="Revenue" fill="#0B1B3B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Cost" fill="#C99A3F" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Profit" fill="#AD1F23" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-[200px] flex items-center justify-center text-sm text-mora-neutral/60">No data yet</div>}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-4">
            {/* Accounts receivable */}
            <Card icon={Receipt} title="Accounts receivable" subtitle="Pending bookings awaiting payment.">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5"><th className="px-5 py-2.5 font-medium">Customer</th><th className="px-5 py-2.5 font-medium">Booking</th><th className="px-5 py-2.5 font-medium text-right">Due</th></tr></thead>
                <tbody>
                  {f.arRows.map((r, i) => (<tr key={i} className="border-b border-mora-primary/5 last:border-0"><td className="px-5 py-2.5 font-medium text-mora-primary">{r[0]}</td><td className="px-5 py-2.5 text-mora-neutral truncate max-w-[160px]">{r[1]}</td><td className="px-5 py-2.5 text-right text-gold font-semibold">{r[2]}</td></tr>))}
                  {f.arRows.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-mora-neutral/60">Nothing outstanding.</td></tr>}
                  {f.arRows.length > 0 && <tr className="bg-mora-primary/[0.03]"><td className="px-5 py-2.5 font-semibold" colSpan={2}>Total receivable</td><td className="px-5 py-2.5 text-right font-display font-bold text-mora-primary">{formatIDR(f.ar)}</td></tr>}
                </tbody>
              </table>
            </Card>

            {/* Accounts payable */}
            <Card icon={Landmark} title="Accounts payable" subtitle="Supplier cost on confirmed bookings.">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5"><th className="px-5 py-2.5 font-medium">Supplier</th><th className="px-5 py-2.5 font-medium text-right">Bookings</th><th className="px-5 py-2.5 font-medium text-right">Payable</th></tr></thead>
                <tbody>
                  {f.apList.map((v, i) => (<tr key={i} className="border-b border-mora-primary/5 last:border-0"><td className="px-5 py-2.5 font-medium text-mora-primary">{v.name}</td><td className="px-5 py-2.5 text-right text-mora-neutral">{v.n}</td><td className="px-5 py-2.5 text-right text-mora-primary font-semibold">{formatIDR(v.payable)}</td></tr>))}
                  {f.apList.length === 0 && <tr><td colSpan={3} className="px-5 py-8 text-center text-mora-neutral/60">Nothing payable.</td></tr>}
                  {f.apList.length > 0 && <tr className="bg-mora-primary/[0.03]"><td className="px-5 py-2.5 font-semibold">Total payable</td><td /><td className="px-5 py-2.5 text-right font-display font-bold text-mora-primary">{formatIDR(f.ap)}</td></tr>}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Cash flow */}
          <Card icon={Banknote} title="Cash flow" subtitle="Simplified inflow vs outflow.">
            <div>
              <SRow label="Cash in — confirmed payments" value={f.inflow} />
              <SRow label="Cash out — supplier costs" value={f.cogs} negative />
              <SRow label="Cash out — refunds" value={f.refunds} negative />
              <SRow label="Net cash flow" value={f.netCash} bold total />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
