import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Map as MapIcon, CalendarCheck, Users, Wallet, TrendingUp, AlertCircle, ArrowUpRight, ChevronRight } from "lucide-react";
import { formatIDR } from "@/lib/currency";
import Skeleton, { SkeletonStat } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import moment from "moment";

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-mora-gold/10 text-gold",
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

  useEffect(() => {
    (async () => {
      const [dest, promo, trips, bookings, customers] = await Promise.all([
        base44.entities.Destination.list("-created_date", 500),
        base44.entities.Promotion.list("-created_date", 500),
        base44.entities.Trip.list("-created_date", 500),
        base44.entities.Booking.list("-created_date", 500),
        base44.entities.Customer.list("-created_date", 500),
      ]);
      setS({ dest, promo, trips, bookings, customers });
    })();
  }, []);

  const stats = s ? [
    { label: "Customers", value: s.customers.length, icon: Users, to: "/dashboard/customers" },
    { label: "Trips", value: s.trips.length, icon: MapIcon, to: "/dashboard/bookings" },
    { label: "Bookings", value: s.bookings.length, icon: CalendarCheck, to: "/dashboard/bookings" },
    { label: "Destinations", value: s.dest.length, icon: MapPin, to: "/dashboard/destinations" },
  ] : [];

  const revenue = s ? s.bookings.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + (b.price || 0), 0) : 0;
  const confirmedCount = s ? s.bookings.filter((b) => b.status === "confirmed").length : 0;
  const avgValue = confirmedCount ? Math.round(revenue / confirmedCount) : 0;
  const pending = s ? s.bookings.filter((b) => b.status === "pending").length : 0;

  // Top destination by trip count
  let topDest = null;
  if (s) {
    const counts = {};
    s.trips.forEach((t) => { if (t.destination) counts[t.destination] = (counts[t.destination] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) topDest = { name: top[0], count: top[1] };
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1">Insight Center</p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Overview</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Your data & trends across the MORA platform at a glance.</p>
        </div>
        <DashboardAiStub resource="overview" />
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
          {/* Count cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger">
            {stats.map((c) => (
              <Link key={c.label} to={c.to} className="press bg-white rounded-2xl border border-mora-primary/10 p-5 hover:shadow-md transition-shadow group min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center"><c.icon className="w-5 h-5 text-gold" /></div>
                  <ArrowUpRight className="w-4 h-4 text-mora-neutral/40 group-hover:text-gold transition-colors" />
                </div>
                <p className="stat-value text-lg lg:text-xl font-display font-bold text-mora-primary">{c.value}</p>
                <p className="text-xs text-mora-neutral mt-1">{c.label}</p>
              </Link>
            ))}
          </div>

          {/* Insight cards */}
          <div className="grid lg:grid-cols-3 gap-4 mb-6 stagger">
            <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
              <div className="flex items-center gap-2 text-mora-neutral mb-2"><Wallet className="w-4 h-4 text-gold" /><span className="text-xs uppercase tracking-wider">Confirmed revenue</span></div>
              <p className="stat-value text-xl lg:text-2xl font-display font-bold text-mora-primary">{formatIDR(revenue)}</p>
              <p className="text-xs text-mora-neutral/70 mt-1">Avg {formatIDR(avgValue)} / booking</p>
            </div>
            <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
              <div className="flex items-center gap-2 text-mora-neutral mb-2"><TrendingUp className="w-4 h-4 text-gold" /><span className="text-xs uppercase tracking-wider">Top destination</span></div>
              <p className="stat-value text-xl lg:text-2xl font-display font-bold text-mora-primary truncate">{topDest ? topDest.name : "—"}</p>
              <p className="text-xs text-mora-neutral/70 mt-1">{topDest ? `${topDest.count} trip${topDest.count > 1 ? "s" : ""} planned` : "No trips yet"}</p>
            </div>
            <Link to="/dashboard/bookings" className="press bg-white rounded-2xl border border-mora-primary/10 p-5 hover:shadow-md transition-shadow min-w-0">
              <div className="flex items-center gap-2 text-mora-neutral mb-2"><AlertCircle className="w-4 h-4 text-gold" /><span className="text-xs uppercase tracking-wider">Pending bookings</span></div>
              <p className="stat-value text-xl lg:text-2xl font-display font-bold text-mora-primary">{pending}</p>
              <p className="text-xs text-gold mt-1">{pending ? "Need attention →" : "All clear"}</p>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Recent bookings */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-mora-primary/10 flex items-center justify-between">
                <h2 className="font-display font-semibold text-mora-primary">Recent bookings</h2>
                <Link to="/dashboard/bookings" className="text-xs text-gold font-medium">View all</Link>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <tbody>
                  {s.bookings.slice(0, 6).map((b) => (
                    <tr key={b.id} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]">
                      <td className="px-5 py-3">
                        <Link to={`/dashboard/bookings/${b.id}`} className="font-medium text-mora-primary hover:text-gold transition-colors truncate block max-w-[220px]">{b.title}</Link>
                        <span className="text-xs text-mora-neutral">{b.provider || "—"}</span>
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
            <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-mora-primary/10 flex items-center justify-between">
                <h2 className="font-display font-semibold text-mora-primary">New customers</h2>
                <Link to="/dashboard/customers" className="text-xs text-gold font-medium">View all</Link>
              </div>
              <div className="p-3 space-y-1">
                {s.customers.slice(0, 5).map((c) => (
                  <Link key={c.id} to={`/dashboard/customers/${c.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-mora-primary/5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-mora-gold/10 flex items-center justify-center text-gold font-display font-semibold flex-shrink-0">{c.name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-mora-primary truncate">{c.name}</p>
                      <p className="text-[11px] text-mora-neutral truncate">{c.city}</p>
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
