import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  Target,
  Percent,
  Building2,
  Users,
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

/* ---------------------------- small building blocks ---------------------------- */

function KpiCard({ icon: Icon, value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <p className="stat-value text-lg lg:text-xl font-display font-bold text-mora-primary">{value}</p>
      <p className="text-xs text-mora-neutral mt-1">{label}</p>
    </div>
  );
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

/* ---------------------------------- page ---------------------------------- */

export default function DashboardBusiness() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookings, trips, customers, leads, suppliers] = await Promise.all([
          base44.entities.Booking.list("-created_date", 500),
          base44.entities.Trip.list("-created_date", 500),
          base44.entities.Customer.list("-created_date", 500),
          base44.entities.Lead.list("-created_date", 500),
          base44.entities.Supplier.list("-created_date", 500),
        ]);
        if (!cancelled) setData({ bookings, trips, customers, leads, suppliers });
      } catch (err) {
        console.error("Failed to load business data", err);
        if (!cancelled) {
          toast.error("Couldn't load business data");
          setData({ bookings: [], trips: [], customers: [], leads: [], suppliers: [] });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Supplier id -> commission rate (%) and id -> name lookups.
  const supplierRate = useMemo(() => {
    const acc = {};
    if (data) for (const s of data.suppliers) acc[s.id] = Number(s.commission_rate) || 0;
    return acc;
  }, [data]);

  const supplierName = useMemo(() => {
    const acc = {};
    if (data) for (const s of data.suppliers) acc[s.id] = s.name || "Unknown";
    return acc;
  }, [data]);

  const bookings = data ? data.bookings : [];
  const leads = data ? data.leads : [];

  // Confirmed = confirmed OR completed bookings.
  const confirmed = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" || b.status === "completed"),
    [bookings]
  );

  // Margin & sales figures.
  const sales = useMemo(
    () => confirmed.reduce((sum, b) => sum + (Number(b.price) || 0), 0),
    [confirmed]
  );
  const cost = useMemo(
    () => confirmed.reduce((sum, b) => sum + (Number(b.cost_price) || 0), 0),
    [confirmed]
  );
  const margin = sales - cost;
  const marginPct = sales ? Math.round((margin / sales) * 100) : 0;

  // Lead conversion.
  const totalLeads = leads.length;
  const wonLeads = useMemo(() => leads.filter((l) => l.status === "won").length, [leads]);
  const conversionPct = totalLeads ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Estimated commission payable across all bookings.
  const commissionPayable = useMemo(
    () =>
      bookings.reduce(
        (sum, b) => sum + ((Number(b.price) || 0) * (supplierRate[b.supplier_id] || 0)) / 100,
        0
      ),
    [bookings, supplierRate]
  );

  // Sales funnel stages.
  const funnel = useMemo(() => {
    const engaged = leads.filter((l) =>
      ["contacted", "quoted", "won"].includes(l.status)
    ).length;
    const quoted = leads.filter((l) => ["quoted", "won"].includes(l.status)).length;
    const confirmedCount = confirmed.length;
    return [
      { label: "Leads", count: totalLeads },
      { label: "Engaged", count: engaged },
      { label: "Quoted", count: quoted },
      { label: "Won", count: wonLeads },
      { label: "Bookings", count: confirmedCount },
    ];
  }, [leads, totalLeads, wonLeads, confirmed]);

  const funnelMax = useMemo(
    () => Math.max(1, ...funnel.map((s) => s.count)),
    [funnel]
  );

  // Margin by month (confirmed bookings).
  const marginByMonth = useMemo(() => {
    const acc = {};
    for (const b of confirmed) {
      const label = moment(b.check_in || b.created_date).format("MMM");
      if (!acc[label]) acc[label] = { sales: 0, margin: 0 };
      const price = Number(b.price) || 0;
      const cp = Number(b.cost_price) || 0;
      acc[label].sales += price;
      acc[label].margin += price - cp;
    }
    return MONTH_ORDER.filter((m) => acc[m] != null).map((m) => ({
      month: m,
      sales: acc[m].sales,
      margin: acc[m].margin,
    }));
  }, [confirmed]);

  // Supplier performance (suppliers with bookings).
  const supplierPerf = useMemo(() => {
    const acc = {};
    for (const b of bookings) {
      const id = b.supplier_id;
      if (id == null) continue;
      if (!acc[id]) acc[id] = { id, count: 0, sales: 0, commission: 0 };
      const price = Number(b.price) || 0;
      acc[id].count += 1;
      acc[id].sales += price;
      acc[id].commission += (price * (supplierRate[id] || 0)) / 100;
    }
    return Object.values(acc)
      .map((r) => ({ ...r, name: supplierName[r.id] || "Unknown" }))
      .sort((a, b) => b.sales - a.sales);
  }, [bookings, supplierRate, supplierName]);

  // Agent performance (leads grouped by assigned_to).
  const agentPerf = useMemo(() => {
    const acc = {};
    for (const l of leads) {
      const agent = l.assigned_to || "Unassigned";
      if (!acc[agent]) acc[agent] = { agent, total: 0, won: 0, pipeline: 0 };
      acc[agent].total += 1;
      if (l.status === "won") acc[agent].won += 1;
      if (["new", "contacted", "quoted"].includes(l.status)) {
        acc[agent].pipeline += Number(l.budget) || 0;
      }
    }
    return Object.values(acc)
      .map((r) => ({
        ...r,
        conversion: r.total ? Math.round((r.won / r.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [leads]);

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

  const exportSuppliers = () =>
    downloadCSV(
      "mora-supplier-performance",
      ["Supplier", "Bookings", "Sales", "Est. commission"],
      supplierPerf.map((r) => [r.name, r.count, Math.round(r.sales), Math.round(r.commission)])
    );

  const exportAgents = () =>
    downloadCSV(
      "mora-agent-performance",
      ["Agent", "Leads", "Won", "Conversion", "Pipeline"],
      agentPerf.map((r) => [
        r.agent,
        r.total,
        r.won,
        `${r.conversion}%`,
        Math.round(r.pipeline),
      ])
    );

  const kpis = data
    ? [
        { icon: Wallet, value: formatIDR(margin), label: "Gross margin" },
        { icon: Percent, value: `${marginPct}%`, label: "Margin %" },
        { icon: Target, value: `${conversionPct}%`, label: "Lead conversion" },
        { icon: TrendingUp, value: formatIDR(commissionPayable), label: "Est. commission payable" },
      ]
    : [];

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-mora-primary">Business</h1>
        <p className="text-sm text-mora-neutral mt-0.5">
          Funnel, margins and partner performance.
        </p>
      </header>

      {!data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
          <Skeleton className="h-[260px] w-full rounded-2xl mb-4" />
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        </>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger">
            {kpis.map((k) => (
              <KpiCard key={k.label} icon={k.icon} value={k.value} label={k.label} />
            ))}
          </div>

          {/* Sales funnel */}
          <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mb-4">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-mora-primary">Sales funnel</h2>
              <p className="text-xs text-mora-neutral mt-0.5">
                From first lead through to confirmed bookings.
              </p>
            </div>
            <div className="space-y-3">
              {funnel.map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-sm text-mora-neutral">{stage.label}</div>
                  <div className="flex-1 h-7 rounded-lg bg-mora-primary/5 overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{
                        width: `${Math.max(2, (stage.count / funnelMax) * 100)}%`,
                        backgroundColor: PALETTE[i % PALETTE.length],
                      }}
                    />
                  </div>
                  <div className="w-12 shrink-0 text-right text-sm font-semibold text-mora-primary">
                    {stage.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Margin by month */}
          <ChartCard
            title="Margin by month"
            subtitle="Confirmed booking sales and gross margin grouped by month."
            hasData={marginByMonth.length > 0}
          >
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={marginByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B1B3B" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0B1B3B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="marginFill" x1="0" y1="0" x2="0" y2="1">
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
                  formatter={(v, name) => [formatIDR(v), name === "sales" ? "Sales" : "Margin"]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0B1B3B"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
                <Area
                  type="monotone"
                  dataKey="margin"
                  stroke="#AD1F23"
                  strokeWidth={2}
                  fill="url(#marginFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Supplier performance */}
          <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden mt-4">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <h2 className="font-display font-semibold text-mora-primary flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gold" />
                  Supplier performance
                </h2>
                <p className="text-xs text-mora-neutral mt-0.5">
                  Bookings, sales and estimated commission per supplier.
                </p>
              </div>
              <button
                onClick={exportSuppliers}
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
                    <th className="px-5 py-3 font-medium">Supplier</th>
                    <th className="px-5 py-3 font-medium text-right">Bookings</th>
                    <th className="px-5 py-3 font-medium text-right">Sales</th>
                    <th className="px-5 py-3 font-medium text-right">Est. commission</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierPerf.length ? (
                    supplierPerf.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]"
                      >
                        <td className="px-5 py-3">{r.name}</td>
                        <td className="px-5 py-3 text-right">{r.count}</td>
                        <td className="px-5 py-3 text-right">{formatIDR(r.sales)}</td>
                        <td className="px-5 py-3 text-right">{formatIDR(r.commission)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-mora-neutral/60">
                        No data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent performance */}
          <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden mt-4">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <h2 className="font-display font-semibold text-mora-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold" />
                  Agent performance
                </h2>
                <p className="text-xs text-mora-neutral mt-0.5">
                  Lead volume, wins and open pipeline per agent.
                </p>
              </div>
              <button
                onClick={exportAgents}
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
                    <th className="px-5 py-3 font-medium">Agent</th>
                    <th className="px-5 py-3 font-medium text-right">Leads</th>
                    <th className="px-5 py-3 font-medium text-right">Won</th>
                    <th className="px-5 py-3 font-medium text-right">Conversion</th>
                    <th className="px-5 py-3 font-medium text-right">Pipeline</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerf.length ? (
                    agentPerf.map((r) => (
                      <tr
                        key={r.agent}
                        className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]"
                      >
                        <td className="px-5 py-3">{r.agent}</td>
                        <td className="px-5 py-3 text-right">{r.total}</td>
                        <td className="px-5 py-3 text-right">{r.won}</td>
                        <td className="px-5 py-3 text-right">{r.conversion}%</td>
                        <td className="px-5 py-3 text-right">{formatIDR(r.pipeline)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-mora-neutral/60">
                        No data yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
