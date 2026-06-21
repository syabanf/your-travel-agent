import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
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
  Users,
  TrendingUp,
  Map as MapIcon,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

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

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
    </div>
  );
}

function KpiCard({ icon: Icon, value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 p-5">
      <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-gold" />
      </div>
      <p className="text-2xl lg:text-3xl font-display font-bold text-mora-primary">{value}</p>
      <p className="text-xs text-mora-neutral mt-0.5">{label}</p>
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

export default function DashboardReports() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState("all"); // "all" | "year"

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookings, trips, customers, destinations, promotions] = await Promise.all([
          base44.entities.Booking.list("-created_date", 500),
          base44.entities.Trip.list("-created_date", 500),
          base44.entities.Customer.list("-created_date", 500),
          base44.entities.Destination.list("-created_date", 500),
          base44.entities.Promotion.list("-created_date", 500),
        ]);
        if (!cancelled) setData({ bookings, trips, customers, destinations, promotions });
      } catch (err) {
        console.error("Failed to load report data", err);
        if (!cancelled) {
          toast.error("Couldn't load report data");
          setData({ bookings: [], trips: [], customers: [], destinations: [], promotions: [] });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const thisYear = moment().year();

  // Period-filtered bookings & trips (customers/destinations/promos shown in full).
  const bookings = useMemo(() => {
    if (!data) return [];
    if (period === "all") return data.bookings;
    return data.bookings.filter((b) => moment(b.created_date).year() === thisYear);
  }, [data, period, thisYear]);

  const trips = useMemo(() => {
    if (!data) return [];
    if (period === "all") return data.trips;
    return data.trips.filter((t) => moment(t.created_date).year() === thisYear);
  }, [data, period, thisYear]);

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

  // CSV export — built from the period-filtered bookings.
  const exportCSV = () => {
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["title", "type", "provider", "status", "price", "date"];
    const rows = bookings.map((b) => [
      b.title,
      b.type,
      b.provider,
      b.status,
      Number(b.price) || 0,
      b.check_in ? moment(b.check_in).format("YYYY-MM-DD") : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mora-bookings-${moment().format("YYYY-MM-DD")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const kpis = data
    ? [
        { icon: Wallet, value: formatIDR(revenue), label: "Total revenue" },
        { icon: CalendarCheck, value: bookings.length, label: "Total bookings" },
        { icon: Users, value: data.customers.length, label: "Customers" },
        { icon: TrendingUp, value: formatIDR(avgBooking), label: "Avg booking value" },
        { icon: MapIcon, value: trips.length, label: "Trips" },
      ]
    : [];

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Reports</h1>
          <p className="text-sm text-mora-neutral mt-0.5">
            Revenue, bookings and customer analytics across the MORA platform.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!data}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium btn-primary text-white disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </header>

      {!data ? (
        <Spinner />
      ) : (
        <>
          {/* Period toggle */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "all", label: "All time" },
              { key: "year", label: "This year" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  period === p.key
                    ? "bg-mora-gold/10 text-gold"
                    : "text-mora-neutral hover:bg-mora-primary/5"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {kpis.map((k) => (
              <KpiCard key={k.label} icon={k.icon} value={k.value} label={k.label} />
            ))}
          </div>

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
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
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
    </div>
  );
}
