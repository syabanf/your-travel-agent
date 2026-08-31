import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { backend } from "@/api/backend";
import { MapPin, Map as MapIcon, CalendarCheck, Users, Wallet, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react";
import { formatIDR } from "@/lib/currency";
import Skeleton, { SkeletonStat } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, MixDonut, TrendArea, Delta } from "@/dashboard/charts";
import PeriodControls from "@/dashboard/PeriodControls";
import { periodRange, comparisonRange, inSpan, pctDelta, comparisonLabel } from "@/dashboard/periodCompare";
import moment from "moment";

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-ich-gold/10 text-gold",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
};
const tierPill = {
  platinum: "bg-indigo-500/15 text-indigo-600",
  gold: "bg-amber-500/15 text-amber-600",
  silver: "bg-slate-400/20 text-slate-600",
  bronze: "bg-orange-500/15 text-orange-600",
};

export default function DashboardOverview() {
  const [s, setS] = useState(null);
  const [period, setPeriod] = useState("all"); // periodCompare keys
  const [comparison, setComparison] = useState("prev"); // none | prev | year

  useEffect(() => {
    (async () => {
      const [dest, promo, trips, bookings, customers] = await Promise.all([
        backend.entities.Destination.list("-created_at", 500),
        backend.entities.Promotion.list("-created_at", 500),
        backend.entities.Trip.list("-created_at", 500),
        backend.entities.Booking.list("-created_at", 500),
        backend.entities.Customer.list("-created_at", 500),
      ]);
      setS({ dest, promo, trips, bookings, customers });
    })();
  }, []);

  // Current + comparison windows; "scoped" means a bounded period is selected.
  const curRange = periodRange(period);
  const cmpRange = comparisonRange(period, comparison);
  const cmpLabel = comparisonLabel(comparison);
  const scoped = period !== "all";

  // Period-filtered bookings & trips power the cards, charts and trend.
  const periodBookings = s ? s.bookings.filter((b) => inSpan(b.created_at, curRange)) : [];
  const periodTrips = s ? s.trips.filter((t) => inSpan(t.created_at, curRange)) : [];

  const metricsFor = (span) => {
    if (!s) return null;
    const conf = s.bookings.filter((b) => b.status === "confirmed" && inSpan(b.created_at, span));
    return {
      customers: s.customers.filter((c) => inSpan(c.joined_date || c.created_at, span)).length,
      trips: s.trips.filter((t) => inSpan(t.created_at, span)).length,
      bookings: s.bookings.filter((b) => inSpan(b.created_at, span)).length,
      revenue: conf.reduce((sum, b) => sum + (Number(b.price) || 0), 0),
      confirmed: conf.length,
    };
  };
  const cur = metricsFor(curRange);
  const cmp = cmpRange ? metricsFor(cmpRange) : null;
  const dlt = (a, b) => (cmp ? pctDelta(a, b) : undefined);

  const stats = s ? [
    { label: scoped ? "New customers" : "Customers", value: scoped ? cur.customers : s.customers.length, icon: Users, to: "/dashboard/customers", delta: dlt(cur.customers, cmp?.customers) },
    { label: scoped ? "New trips" : "Trips", value: scoped ? cur.trips : s.trips.length, icon: MapIcon, to: "/dashboard/bookings", delta: dlt(cur.trips, cmp?.trips) },
    { label: scoped ? "New bookings" : "Bookings", value: scoped ? cur.bookings : s.bookings.length, icon: CalendarCheck, to: "/dashboard/bookings", delta: dlt(cur.bookings, cmp?.bookings) },
    { label: "Destinations", value: s.dest.length, icon: MapPin, to: "/dashboard/destinations" },
  ] : [];

  const revenue = cur ? cur.revenue : 0;
  const avgValue = cur && cur.confirmed ? Math.round(cur.revenue / cur.confirmed) : 0;
  const revDelta = dlt(cur?.revenue || 0, cmp?.revenue || 0);
  const pending = s ? s.bookings.filter((b) => b.status === "pending").length : 0;

  // Top destination by trip count (within the selected period)
  let topDest = null;
  if (s) {
    const counts = {};
    periodTrips.forEach((t) => { if (t.destination) counts[t.destination] = (counts[t.destination] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) topDest = { name: top[0], count: top[1] };
  }

  // Insight aggregations
  const cap1 = (str) => (str ? str[0].toUpperCase() + str.slice(1) : str);
  const BOOKING_STATUS_COLOR = { pending: "#C99A3F", confirmed: "#10B981", completed: "#0EA5E9", cancelled: "#EF4444" };
  const TRIP_STATUS_COLOR = { draft: "#94A3B8", planned: "#3B82F6", active: "#10B981", completed: "#0EA5E9", cancelled: "#EF4444" };
  const TIER_COLOR = { bronze: "#C99A3F", silver: "#94A3B8", gold: "#AD1F23", platinum: "#6366F1" };
  const bookingStatusCount = {}, tripStatusCount = {}, tierCount = {};
  if (s) {
    periodBookings.forEach((b) => { const st = b.status || "pending"; bookingStatusCount[st] = (bookingStatusCount[st] || 0) + 1; });
    periodTrips.forEach((t) => { const st = t.status || "draft"; tripStatusCount[st] = (tripStatusCount[st] || 0) + 1; });
    s.customers.forEach((c) => { const tr = c.tier || "bronze"; tierCount[tr] = (tierCount[tr] || 0) + 1; });
  }
  const bookingsByStatus = Object.entries(bookingStatusCount).map(([k, value]) => ({ name: cap1(k), value, color: BOOKING_STATUS_COLOR[k] }));
  const tripsByStatus = Object.entries(tripStatusCount).map(([k, value]) => ({ name: cap1(k), value, color: TRIP_STATUS_COLOR[k] }));
  const customersByTier = Object.entries(tierCount).map(([k, value]) => ({ name: cap1(k), value, color: TIER_COLOR[k] }));
  const revByMonth = (() => {
    if (!s) return [];
    const acc = {};
    periodBookings.filter((b) => b.status === "confirmed").forEach((b) => { const m = moment(b.check_in || b.created_at); const k = m.format("YYYY-MM"); if (!acc[k]) acc[k] = { label: m.format("MMM"), value: 0, k }; acc[k].value += Number(b.price) || 0; });
    return Object.values(acc).sort((a, b) => a.k.localeCompare(b.k));
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1">Insight Center</p>
          <h1 className="text-2xl font-display font-bold text-ich-primary">Overview</h1>
          <p className="text-sm text-ich-neutral mt-0.5">Your data & trends across the Icon Holiday platform at a glance.</p>
        </div>
        <DashboardAiStub resource="overview" data={s ? s.bookings : []} />
      </header>

      {!s ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonStat key={i} />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <Skeleton className="lg:col-span-2 h-[260px] w-full rounded-2xl" />
            <Skeleton className="h-[260px] w-full rounded-2xl" />
          </div>
        </>
      ) : (
        <>
          {/* Period + comparison controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
            <PeriodControls period={period} onPeriod={setPeriod} comparison={comparison} onComparison={setComparison} />
            <p className="text-xs text-ich-neutral">
              {cmp
                ? <>Deltas compare to the {comparison === "year" ? "same period last year" : "previous period"}.</>
                : scoped
                  ? <>Turn on a comparison to see change vs another period.</>
                  : <>Showing all-time figures. Pick a period to compare.</>}
            </p>
          </div>

          {/* Count cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger">
            {stats.map((c) => (
              <Link key={c.label} to={c.to} className="press bg-white rounded-2xl border border-ich-primary/10 p-5 hover:shadow-md transition-shadow group min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-ich-gold/10 flex items-center justify-center"><c.icon className="w-5 h-5 text-gold" /></div>
                  {c.delta !== undefined
                    ? <Delta pct={c.delta} label={cmpLabel} />
                    : <ArrowUpRight className="w-4 h-4 text-ich-neutral/40 group-hover:text-gold transition-colors" />}
                </div>
                <p className="stat-value text-lg lg:text-xl font-display font-bold text-ich-primary">{c.value}</p>
                <p className="text-xs text-ich-neutral mt-1">{c.label}</p>
              </Link>
            ))}
          </div>

          {/* Insight cards */}
          <div className="grid lg:grid-cols-3 gap-4 mb-6 stagger">
            <div className="bg-white rounded-2xl border border-ich-primary/10 p-5 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-ich-neutral"><Wallet className="w-4 h-4 text-gold" /><span className="text-xs uppercase tracking-wider">Confirmed revenue</span></div>
                {revDelta !== undefined && <Delta pct={revDelta} label={cmpLabel} />}
              </div>
              <p className="stat-value text-xl lg:text-2xl font-display font-bold text-ich-primary">{formatIDR(revenue)}</p>
              <p className="text-xs text-ich-neutral/70 mt-1">Avg {formatIDR(avgValue)} / booking</p>
            </div>
            <div className="bg-white rounded-2xl border border-ich-primary/10 p-5 min-w-0">
              <div className="flex items-center gap-2 text-ich-neutral mb-2"><TrendingUp className="w-4 h-4 text-gold" /><span className="text-xs uppercase tracking-wider">Top destination</span></div>
              <p className="stat-value text-xl lg:text-2xl font-display font-bold text-ich-primary truncate">{topDest ? topDest.name : "—"}</p>
              <p className="text-xs text-ich-neutral/70 mt-1">{topDest ? `${topDest.count} trip${topDest.count > 1 ? "s" : ""} planned` : "No trips yet"}</p>
            </div>
            <Link to="/dashboard/bookings" className="press bg-white rounded-2xl border border-ich-primary/10 p-5 hover:shadow-md transition-shadow min-w-0">
              <div className="flex items-center gap-2 text-ich-neutral mb-2"><AlertCircle className="w-4 h-4 text-gold" /><span className="text-xs uppercase tracking-wider">Pending bookings</span></div>
              <p className="stat-value text-xl lg:text-2xl font-display font-bold text-ich-primary">{pending}</p>
              <p className="text-xs text-gold mt-1">{pending ? "Need attention →" : "All clear"}</p>
            </Link>
          </div>

          {/* Insight charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <ChartCard title="Bookings by status" subtitle="Pipeline health."><MixDonut data={bookingsByStatus} /></ChartCard>
            <ChartCard title="Customers by tier" subtitle="Loyalty mix."><MixDonut data={customersByTier} /></ChartCard>
            <ChartCard title="Trips by status" subtitle="Where trips stand."><MixDonut data={tripsByStatus} /></ChartCard>
          </div>

          {/* Revenue trend */}
          <div className="mb-6">
            <ChartCard title="Revenue trend" subtitle="Confirmed booking revenue by month."><TrendArea data={revByMonth} /></ChartCard>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Recent bookings */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-ich-primary/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-ich-primary/10 flex items-center justify-between">
                <h2 className="font-display font-semibold text-ich-primary">Recent bookings</h2>
                <Link to="/dashboard/bookings" className="text-xs text-gold font-medium">View all</Link>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <tbody>
                  {s.bookings.slice(0, 6).map((b) => (
                    <tr key={b.id} className="border-b border-ich-primary/5 last:border-0 hover:bg-ich-primary/[0.02]">
                      <td className="px-5 py-3">
                        <Link to={`/dashboard/bookings/${b.id}`} className="font-medium text-ich-primary hover:text-gold transition-colors truncate block max-w-[220px]">{b.title}</Link>
                        <span className="text-xs text-ich-neutral">{b.provider || "—"}</span>
                      </td>
                      <td className="px-5 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[b.status] || statusPill.pending}`}>{b.status}</span></td>
                      <td className="px-5 py-3 text-right font-semibold text-gold whitespace-nowrap">{b.price ? formatIDR(b.price) : "—"}</td>
                    </tr>
                  ))}
                  {s.bookings.length === 0 && <tr><td colSpan={3}><EmptyState icon={CalendarCheck} title="No bookings yet" hint="Bookings will appear here once they're created." className="py-8" /></td></tr>}
                </tbody>
              </table>
              </div>
            </div>

            {/* Recent customers */}
            <div className="bg-white rounded-2xl border border-ich-primary/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-ich-primary/10 flex items-center justify-between">
                <h2 className="font-display font-semibold text-ich-primary">New customers</h2>
                <Link to="/dashboard/customers" className="text-xs text-gold font-medium">View all</Link>
              </div>
              <div className="p-3 space-y-1">
                {s.customers.slice(0, 5).map((c) => (
                  <Link key={c.id} to={`/dashboard/customers/${c.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-ich-primary/5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-ich-gold/10 flex items-center justify-center text-gold font-display font-semibold flex-shrink-0">{c.name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ich-primary truncate">{c.name}</p>
                      <p className="text-[11px] text-ich-neutral truncate">{c.city}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${tierPill[c.tier] || tierPill.bronze}`}>{c.tier}</span>
                  </Link>
                ))}
                {s.customers.length === 0 && <EmptyState icon={Users} title="No customers yet" hint="New customers will show up here." className="py-8" />}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
