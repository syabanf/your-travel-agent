import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { CategoryBars, Delta } from "@/dashboard/charts";
import PeriodControls from "@/dashboard/PeriodControls";
import { periodRange, comparisonRange, inSpan, pctDelta, comparisonLabel } from "@/dashboard/periodCompare";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  CalendarCheck,
  UserPlus,
  TrendingUp,
  Map as MapIcon,
  Percent,
  Receipt,
  Coins,
  Target,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import Skeleton, { SkeletonStat } from "@/components/Skeletons";

const PALETTE = ["#AD1F23", "#0B1B3B", "#C99A3F", "#5A6B85", "#0EA5E9", "#10B981"];

const TOOLTIP_STYLE = {
  background: "#fff",
  border: "1px solid rgba(11,27,59,0.12)",
  borderRadius: 12,
  color: "#0B1B3B",
  fontSize: 12,
};

const AXIS = { fontSize: 11, stroke: "#5A6B85" };

const MONTH_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const TIERS = ["bronze", "silver", "gold", "platinum"];

/* ---------------------------- small building blocks ---------------------------- */

function KpiCard({ icon: Icon, value, label, to, delta, deltaLabel, higherIsBetter = true }) {
  const inner = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gold" />
        </div>
        {delta !== undefined && <Delta pct={delta} label={deltaLabel} higherIsBetter={higherIsBetter} />}
      </div>
      <p className="stat-value text-lg lg:text-xl font-display font-bold text-mora-primary">{value}</p>
      <p className="text-xs text-mora-neutral mt-1 flex items-center gap-1">{label}{to && <span className="text-mora-neutral/40">→</span>}</p>
    </>
  );
  const base = "bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0 block";
  return to
    ? <Link to={to} className={`${base} hover:shadow-md hover:border-mora-gold/30 transition-all press`}>{inner}</Link>
    : <div className={base}>{inner}</div>;
}

function ChartCard({ title, subtitle, hasData, children }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 p-5">
      <div className="mb-4">
        <h2 className="font-display font-semibold text-mora-primary">{title}</h2>
        {subtitle && <p className="text-xs text-mora-neutral mt-0.5">{subtitle}</p>}
      </div>
      {hasData ? (
        children
      ) : (
        <div className="h-[240px] flex items-center justify-center text-sm text-mora-neutral/60">
          No data yet
        </div>
      )}
    </div>
  );
}

const cap = (s) => {
  const str = s == null ? "" : String(s);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

function ReportTable({ title, subtitle, columns, rows, onExport }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div>
          <h2 className="font-display font-semibold text-mora-primary">{title}</h2>
          {subtitle && <p className="text-xs text-mora-neutral mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onExport}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-gold"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3 ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-sm text-mora-neutral/60"
                >
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function DashboardReports() {
  const navigate = useNavigate();
  // Drill from a chart segment into the matching filtered list.
  const drill = (path) => navigate(path);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("all"); // periodCompare keys
  const [comparison, setComparison] = useState("prev"); // none | prev | year
  const [tab, setTab] = useState("analytics"); // "analytics" | "tables"

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookings, trips, customers, destinations, promotions, leads] = await Promise.all([
          base44.entities.Booking.list("-created_date", 500),
          base44.entities.Trip.list("-created_date", 500),
          base44.entities.Customer.list("-created_date", 500),
          base44.entities.Destination.list("-created_date", 500),
          base44.entities.Promotion.list("-created_date", 500),
          base44.entities.Lead.list("-created_date", 500),
        ]);
        if (!cancelled) setData({ bookings, trips, customers, destinations, promotions, leads });
      } catch (err) {
        console.error("Failed to load report data", err);
        if (!cancelled) {
          toast.error("Couldn't load report data");
          setData({ bookings: [], trips: [], customers: [], destinations: [], promotions: [], leads: [] });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Current + comparison windows for the selected period.
  const curRange = useMemo(() => periodRange(period), [period]);
  const cmpRange = useMemo(() => comparisonRange(period, comparison), [period, comparison]);
  const cmpLabel = comparisonLabel(comparison);

  // Period-filtered bookings & trips (customers/destinations/promos shown in full).
  const bookings = useMemo(() => (data ? data.bookings.filter((b) => inSpan(b.created_date, curRange)) : []), [data, curRange]);
  const trips = useMemo(() => (data ? data.trips.filter((t) => inSpan(t.created_date, curRange)) : []), [data, curRange]);

  // Comparable scalar metrics for an arbitrary window — drives the period-over-period deltas.
  const { cur, cmp } = useMemo(() => {
    const calc = (span) => {
      if (!data) return null;
      const bk = data.bookings.filter((b) => inSpan(b.created_date, span));
      const tr = data.trips.filter((t) => inSpan(t.created_date, span));
      const conf = bk.filter((b) => b.status === "confirmed");
      const rev = conf.reduce((s, b) => s + (Number(b.price) || 0), 0);
      const cost = conf.reduce((s, b) => s + (Number(b.cost_price) || 0), 0);
      const commission = conf.reduce((s, b) => s + (Number(b.commission) || 0), 0);
      const outstanding = bk
        .filter((b) => b.payment_status && b.payment_status !== "paid" && b.status !== "cancelled")
        .reduce((s, b) => s + (Number(b.price) || 0), 0);
      const newCustomers = data.customers.filter((c) => inSpan(c.joined_date || c.created_date, span)).length;
      const lds = data.leads.filter((l) => inSpan(l.created_date, span));
      const won = lds.filter((l) => l.status === "won").length;
      return {
        revenue: rev, cost, commission, outstanding, newCustomers,
        bookingCount: bk.length, confirmedCount: conf.length, tripCount: tr.length,
        grossProfit: rev - cost, avgBooking: conf.length ? rev / conf.length : 0,
        leadCount: lds.length, wonLeads: won, conversion: lds.length ? Math.round((won / lds.length) * 100) : 0,
      };
    };
    return { cur: calc(curRange), cmp: cmpRange ? calc(cmpRange) : null };
  }, [data, curRange, cmpRange]);

  // pctDelta only when a comparison window is active; undefined hides the pill entirely.
  const d = (a, b) => (cmp ? pctDelta(a, b) : undefined);

  const confirmed = useMemo(() => bookings.filter((b) => b.status === "confirmed"), [bookings]);

  const revenue = useMemo(
    () => confirmed.reduce((sum, b) => sum + (Number(b.price) || 0), 0),
    [confirmed]
  );
  const avgBooking = confirmed.length ? revenue / confirmed.length : 0;

  // Revenue by month (confirmed only).
  const revenueByMonth = useMemo(() => {
    const acc = {};
    for (const b of confirmed) {
      const label = moment(b.check_in || b.created_date).format("MMM");
      acc[label] = (acc[label] || 0) + (Number(b.price) || 0);
    }
    return MONTH_ORDER.filter((m) => acc[m] != null).map((m) => ({ month: m, revenue: acc[m] }));
  }, [confirmed]);

  // Bookings by type.
  const bookingsByType = useMemo(() => {
    const acc = {};
    for (const b of bookings) {
      const key = b.type || "other";
      acc[key] = (acc[key] || 0) + 1;
    }
    return Object.entries(acc)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [bookings]);

  // Trips by status.
  const tripsByStatus = useMemo(() => {
    const acc = {};
    for (const t of trips) {
      const key = t.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
    }
    return Object.entries(acc).map(([status, count]) => ({ status, count }));
  }, [trips]);

  // Customers by tier (full set, not period-filtered).
  const customersByTier = useMemo(() => {
    if (!data) return [];
    const acc = {};
    for (const c of data.customers) {
      const key = (c.tier || "unknown").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
    }
    const ordered = TIERS.filter((t) => acc[t]).map((t) => ({ name: t, value: acc[t] }));
    const extras = Object.keys(acc)
      .filter((k) => !TIERS.includes(k))
      .map((k) => ({ name: k, value: acc[k] }));
    return [...ordered, ...extras];
  }, [data]);

  // Top destinations by trip count.
  const topDestinations = useMemo(() => {
    const acc = {};
    for (const t of trips) {
      const key = t.destination || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
    }
    return Object.entries(acc)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [trips]);

  // Confirmed booking counts per month (aligned with revenueByMonth labels).
  const confirmedCountByMonth = useMemo(() => {
    const acc = {};
    for (const b of confirmed) {
      const label = moment(b.check_in || b.created_date).format("MMM");
      acc[label] = (acc[label] || 0) + 1;
    }
    return acc;
  }, [confirmed]);

  // Total booking value per type (all bookings, not just confirmed).
  const valueByType = useMemo(() => {
    const acc = {};
    for (const b of bookings) {
      const key = b.type || "other";
      acc[key] = (acc[key] || 0) + (Number(b.price) || 0);
    }
    return acc;
  }, [bookings]);

  // Lifetime spend aggregates per customer tier (full set, not period-filtered).
  const tierStats = useMemo(() => {
    if (!data) return {};
    const acc = {};
    for (const c of data.customers) {
      const key = (c.tier || "unknown").toLowerCase();
      if (!acc[key]) acc[key] = { count: 0, spend: 0 };
      acc[key].count += 1;
      acc[key].spend += Number(c.lifetime_spend) || 0;
    }
    return acc;
  }, [data]);

  // --- Analytical metrics ---
  const confirmedCost = confirmed.reduce((s, b) => s + (Number(b.cost_price) || 0), 0);
  const grossProfit = revenue - confirmedCost;
  const marginPct = revenue ? Math.round((grossProfit / revenue) * 100) : 0;
  const confirmedRate = bookings.length ? Math.round((confirmed.length / bookings.length) * 100) : 0;
  const customerCount = data?.customers.length || 0;
  const revPerCustomer = customerCount ? Math.round(revenue / customerCount) : 0;
  const profitAcc = {};
  confirmed.forEach((b) => { const k = b.type || "other"; profitAcc[k] = (profitAcc[k] || 0) + ((Number(b.price) || 0) - (Number(b.cost_price) || 0)); });
  const profitByType = Object.entries(profitAcc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const topCustomers = (data?.customers || []).slice().sort((a, b) => (Number(b.lifetime_spend) || 0) - (Number(a.lifetime_spend) || 0)).slice(0, 8).map((c) => ({ name: c.name, value: Number(c.lifetime_spend) || 0 }));
  const totalTierSpend = Object.values(tierStats).reduce((s, t) => s + t.spend, 0);
  const hiTierShare = totalTierSpend ? Math.round((((tierStats.platinum?.spend || 0) + (tierStats.gold?.spend || 0)) / totalTierSpend) * 100) : 0;
  const topTrip = topDestinations[0];
  const tripShare = (trips.length && topTrip) ? Math.round((topTrip.count / trips.length) * 100) : 0;
  const ratios = data ? [
    { label: "Confirmed rate", value: `${confirmedRate}%`, hint: `${confirmed.length} of ${bookings.length} bookings` },
    { label: "Gross margin", value: `${marginPct}%`, hint: `${formatIDR(grossProfit)} profit` },
    { label: "Avg booking value", value: formatIDR(avgBooking), hint: "per confirmed booking" },
    { label: "Revenue / customer", value: formatIDR(revPerCustomer), hint: `${customerCount} customers` },
  ] : [];
  const insights = data ? [
    `Confirmed bookings convert at ${confirmedRate}% of all bookings.`,
    marginPct ? `Gross margin is ${marginPct}% — ${formatIDR(grossProfit)} profit on ${formatIDR(revenue)} revenue.` : `Confirmed revenue totals ${formatIDR(revenue)}.`,
    topTrip ? `${topTrip.name} leads demand at ${tripShare}% of planned trips.` : "No trips planned yet.",
    `Platinum & gold customers hold ${hiTierShare}% of lifetime value.`,
  ] : [];

  // Generalized CSV export shared by every table.
  function downloadCSV(filename, header, rows) {
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${moment().format("YYYY-MM-DD")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exported " + filename);
  }

  // The top "Export CSV" button downloads the full bookings ledger.
  const exportBookings = () =>
    downloadCSV(
      "mora-bookings",
      ["title", "type", "provider", "status", "date", "price"],
      bookings.map((b) => [
        b.title,
        b.type,
        b.provider,
        b.status,
        moment(b.check_in || b.created_date).format("YYYY-MM-DD"),
        Number(b.price) || 0,
      ])
    );

  const kpis = data
    ? [
        { icon: Wallet, value: formatIDR(cur.revenue), label: "Confirmed revenue", to: "/dashboard/bookings", delta: d(cur.revenue, cmp?.revenue), deltaLabel: cmpLabel },
        { icon: CalendarCheck, value: cur.bookingCount, label: "Bookings", to: "/dashboard/bookings", delta: d(cur.bookingCount, cmp?.bookingCount), deltaLabel: cmpLabel },
        { icon: UserPlus, value: cur.newCustomers, label: period === "all" ? "Customers" : "New customers", to: "/dashboard/customers", delta: d(cur.newCustomers, cmp?.newCustomers), deltaLabel: cmpLabel },
        { icon: TrendingUp, value: formatIDR(cur.avgBooking), label: "Avg booking value", to: "/dashboard/bookings", delta: d(Math.round(cur.avgBooking), Math.round(cmp?.avgBooking || 0)), deltaLabel: cmpLabel },
        { icon: MapIcon, value: cur.tripCount, label: "Trips", to: "/dashboard/bookings?tab=trips", delta: d(cur.tripCount, cmp?.tripCount), deltaLabel: cmpLabel },
      ]
    : [];

  // Second KPI row — financial & funnel metrics built on the newer entity fields.
  const metrics2 = data
    ? [
        { icon: Coins, value: formatIDR(cur.grossProfit), label: "Gross profit", delta: d(cur.grossProfit, cmp?.grossProfit), deltaLabel: cmpLabel },
        { icon: Percent, value: formatIDR(cur.commission), label: "Commission earned", delta: d(cur.commission, cmp?.commission), deltaLabel: cmpLabel },
        { icon: Receipt, value: formatIDR(cur.outstanding), label: "Outstanding payments", delta: d(cur.outstanding, cmp?.outstanding), deltaLabel: cmpLabel, higherIsBetter: false },
        { icon: Target, value: `${cur.conversion}%`, label: "Lead conversion", to: "/dashboard/leads", delta: d(cur.conversion, cmp?.conversion), deltaLabel: cmpLabel },
      ]
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Reports</h1>
          <p className="text-sm text-mora-neutral mt-0.5">
            Revenue, bookings and customer analytics across the MORA platform.
          </p>
        </div>
        <button
          onClick={exportBookings}
          disabled={!data}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium btn-primary text-white disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </header>

      {!data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
          <Skeleton className="h-[260px] w-full rounded-2xl mb-4" />
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-[260px] w-full rounded-2xl" />
            <Skeleton className="h-[260px] w-full rounded-2xl" />
          </div>
        </>
      ) : (
        <>
          {/* Period + comparison controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <PeriodControls period={period} onPeriod={setPeriod} comparison={comparison} onComparison={setComparison} />
            <p className="text-xs text-mora-neutral">
              {cmp
                ? <>Comparing against the {comparison === "year" ? "same period last year" : "previous period"}.</>
                : period === "all"
                  ? <>Showing all-time figures. Pick a period to compare.</>
                  : <>Turn on a comparison to see period-over-period change.</>}
            </p>
          </div>

          {/* KPI cards — click to drill into the underlying records */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger">
            {kpis.map((k) => (
              <KpiCard key={k.label} icon={k.icon} value={k.value} label={k.label} to={k.to} delta={k.delta} deltaLabel={k.deltaLabel} />
            ))}
          </div>

          {/* Financial & funnel metrics (newer fields) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger">
            {metrics2.map((k) => (
              <KpiCard key={k.label} icon={k.icon} value={k.value} label={k.label} to={k.to} delta={k.delta} deltaLabel={k.deltaLabel} higherIsBetter={k.higherIsBetter} />
            ))}
          </div>

          {/* Key ratios */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {ratios.map((r) => (
              <div key={r.label} className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
                <p className="text-xs text-mora-neutral uppercase tracking-wider">{r.label}</p>
                <p className="stat-value text-xl font-display font-bold text-mora-primary mt-1">{r.value}</p>
                <p className="text-[11px] text-mora-neutral/60 mt-0.5 truncate">{r.hint}</p>
              </div>
            ))}
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "analytics", label: "Analytics" },
              { key: "tables", label: "Tables" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-mora-gold/10 text-gold"
                    : "text-mora-neutral hover:bg-mora-primary/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "analytics" && (
          <>
          {/* Revenue by month */}
          <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mb-4">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-mora-primary">Revenue by month</h2>
              <p className="text-xs text-mora-neutral mt-0.5">
                Confirmed booking revenue grouped by month.
              </p>
            </div>
            {revenueByMonth.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#AD1F23" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#AD1F23" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,27,59,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={AXIS}
                    stroke={AXIS.stroke}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tickFormatter={(v) => formatIDR(v, { symbol: false })}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [formatIDR(v), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#AD1F23"
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-mora-neutral/60">
                No data yet
              </div>
            )}
          </div>

          {/* Profitability & auto-insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <ChartCard title="Profit by booking type" subtitle="Revenue minus supplier cost." hasData={profitByType.length > 0}>
              <CategoryBars data={profitByType} />
            </ChartCard>
            <ChartCard title="Top customers by value" subtitle="Lifetime spend." hasData={topCustomers.length > 0}>
              <CategoryBars data={topCustomers} />
            </ChartCard>
            <div className="bg-white rounded-2xl border border-mora-primary/10 p-5">
              <div className="mb-3"><h2 className="font-display font-semibold text-mora-primary">Insights</h2><p className="text-xs text-mora-neutral mt-0.5">Auto-generated observations.</p></div>
              <ul className="space-y-2.5">
                {insights.map((t, i) => <li key={i} className="flex gap-2.5 text-sm text-mora-primary"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" /><span>{t}</span></li>)}
              </ul>
            </div>
          </div>

          {/* Two-column chart grid */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Bookings by type */}
            <ChartCard
              title="Bookings by type"
              subtitle="Distribution of bookings across categories."
              hasData={bookingsByType.length > 0}
            >
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={bookingsByType}
                    dataKey="value"
                    nameKey="name"
                    className="cursor-pointer"
                    onClick={(d) => { const n = d?.name ?? d?.payload?.name; if (n) drill(`/dashboard/bookings?q=${encodeURIComponent(n)}`); }}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    paddingAngle={2}
                    label={(d) => `${d.name} (${d.value})`}
                    labelLine={false}
                  >
                    {bookingsByType.map((entry, i) => (
                      <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Trips by status */}
            <ChartCard
              title="Trips by status"
              subtitle="How many trips sit in each stage."
              hasData={tripsByStatus.length > 0}
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tripsByStatus} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,27,59,0.06)" vertical={false} />
                  <XAxis dataKey="status" tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} />
                  <YAxis tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(11,27,59,0.04)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} className="cursor-pointer" onClick={(d) => { const st = d?.status ?? d?.payload?.status; if (st) drill(`/dashboard/bookings?tab=trips&status=${encodeURIComponent(st)}`); }}>
                    {tripsByStatus.map((entry, i) => (
                      <Cell key={entry.status} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Customers by tier */}
            <ChartCard
              title="Customers by tier"
              subtitle="Loyalty tier breakdown of the customer base."
              hasData={customersByTier.length > 0}
            >
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={customersByTier}
                    dataKey="value"
                    nameKey="name"
                    className="cursor-pointer"
                    onClick={(d) => { const n = d?.name ?? d?.payload?.name; if (n) drill(`/dashboard/customers?tier=${encodeURIComponent(n)}`); }}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    paddingAngle={2}
                    label={(d) => `${d.name} (${d.value})`}
                    labelLine={false}
                  >
                    {customersByTier.map((entry, i) => (
                      <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Top destinations */}
            <ChartCard
              title="Top destinations"
              subtitle="Most-planned destinations by trip count."
              hasData={topDestinations.length > 0}
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={topDestinations}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,27,59,0.06)" horizontal={false} />
                  <XAxis type="number" tick={AXIS} stroke={AXIS.stroke} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={AXIS}
                    stroke={AXIS.stroke}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(11,27,59,0.04)" }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {topDestinations.map((entry, i) => (
                      <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          </>
          )}

          {tab === "tables" && (
          <div className="space-y-4">
            {/* Revenue by month */}
            <ReportTable
              title="Revenue by month"
              subtitle="Confirmed booking revenue grouped by month."
              columns={[
                { key: "month", label: "Month" },
                { key: "count", label: "Confirmed bookings", align: "right" },
                {
                  key: "revenue",
                  label: "Revenue",
                  align: "right",
                  render: (r) => formatIDR(r.revenue),
                },
              ]}
              rows={revenueByMonth.map((r) => ({
                month: r.month,
                count: confirmedCountByMonth[r.month] || 0,
                revenue: r.revenue,
              }))}
              onExport={() =>
                downloadCSV(
                  "mora-revenue-by-month",
                  ["Month", "Confirmed bookings", "Revenue"],
                  revenueByMonth.map((r) => [
                    r.month,
                    confirmedCountByMonth[r.month] || 0,
                    r.revenue,
                  ])
                )
              }
            />

            {/* Bookings by type */}
            <ReportTable
              title="Bookings by type"
              subtitle="Volume and value of bookings across categories."
              columns={[
                { key: "name", label: "Type", render: (r) => cap(r.name) },
                { key: "value", label: "Count", align: "right" },
                {
                  key: "total",
                  label: "Total value",
                  align: "right",
                  render: (r) => formatIDR(valueByType[r.name] || 0),
                },
                {
                  key: "share",
                  label: "Share",
                  align: "right",
                  render: (r) =>
                    `${bookings.length ? Math.round((r.value / bookings.length) * 100) : 0}%`,
                },
              ]}
              rows={bookingsByType}
              onExport={() =>
                downloadCSV(
                  "mora-bookings-by-type",
                  ["Type", "Count", "Total value", "Share"],
                  bookingsByType.map((r) => [
                    cap(r.name),
                    r.value,
                    valueByType[r.name] || 0,
                    `${bookings.length ? Math.round((r.value / bookings.length) * 100) : 0}%`,
                  ])
                )
              }
            />

            {/* Trips by status */}
            <ReportTable
              title="Trips by status"
              subtitle="How many trips sit in each stage."
              columns={[
                { key: "status", label: "Status", render: (r) => cap(r.status) },
                { key: "count", label: "Count", align: "right" },
                {
                  key: "share",
                  label: "Share",
                  align: "right",
                  render: (r) =>
                    `${trips.length ? Math.round((r.count / trips.length) * 100) : 0}%`,
                },
              ]}
              rows={tripsByStatus}
              onExport={() =>
                downloadCSV(
                  "mora-trips-by-status",
                  ["Status", "Count", "Share"],
                  tripsByStatus.map((r) => [
                    cap(r.status),
                    r.count,
                    `${trips.length ? Math.round((r.count / trips.length) * 100) : 0}%`,
                  ])
                )
              }
            />

            {/* Customers by tier */}
            <ReportTable
              title="Customers by tier"
              subtitle="Loyalty tier breakdown and lifetime value."
              columns={[
                { key: "name", label: "Tier", render: (r) => cap(r.name) },
                { key: "value", label: "Customers", align: "right" },
                {
                  key: "ltv",
                  label: "Lifetime value",
                  align: "right",
                  render: (r) => formatIDR((tierStats[r.name] || {}).spend || 0),
                },
                {
                  key: "avg",
                  label: "Avg / customer",
                  align: "right",
                  render: (r) => {
                    const s = tierStats[r.name] || { count: 0, spend: 0 };
                    return formatIDR(s.count ? s.spend / s.count : 0);
                  },
                },
              ]}
              rows={customersByTier}
              onExport={() =>
                downloadCSV(
                  "mora-customers-by-tier",
                  ["Tier", "Customers", "Lifetime value", "Avg / customer"],
                  customersByTier.map((r) => {
                    const s = tierStats[r.name] || { count: 0, spend: 0 };
                    return [
                      cap(r.name),
                      r.value,
                      s.spend,
                      s.count ? Math.round(s.spend / s.count) : 0,
                    ];
                  })
                )
              }
            />

            {/* Top destinations */}
            <ReportTable
              title="Top destinations"
              subtitle="Most-planned destinations by trip count."
              columns={[
                { key: "name", label: "Destination" },
                { key: "count", label: "Trips", align: "right" },
              ]}
              rows={topDestinations}
              onExport={() =>
                downloadCSV(
                  "mora-top-destinations",
                  ["Destination", "Trips"],
                  topDestinations.map((r) => [r.name, r.count])
                )
              }
            />

            {/* Bookings ledger */}
            <ReportTable
              title="Bookings ledger"
              subtitle="Every booking in the selected period."
              columns={[
                { key: "title", label: "Title" },
                { key: "type", label: "Type", render: (r) => cap(r.type) },
                { key: "provider", label: "Provider" },
                { key: "status", label: "Status", render: (r) => cap(r.status) },
                {
                  key: "date",
                  label: "Date",
                  render: (r) => moment(r.check_in || r.created_date).format("MMM D, YYYY"),
                },
                {
                  key: "price",
                  label: "Price",
                  align: "right",
                  render: (r) => formatIDR(Number(r.price) || 0),
                },
              ]}
              rows={bookings}
              onExport={exportBookings}
            />
          </div>
          )}
        </>
      )}
    </div>
  );
}
