import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MapPin, Megaphone, Map as MapIcon, CalendarCheck, Wallet, ArrowUpRight } from "lucide-react";
import { formatIDR } from "@/lib/currency";
import moment from "moment";

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-mora-gold/10 text-gold",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
};

export default function DashboardOverview() {
  const [s, setS] = useState(null);

  useEffect(() => {
    (async () => {
      const [dest, promo, trips, bookings] = await Promise.all([
        base44.entities.Destination.list("-created_date", 500),
        base44.entities.Promotion.list("-created_date", 500),
        base44.entities.Trip.list("-created_date", 500),
        base44.entities.Booking.list("-created_date", 500),
      ]);
      const revenue = bookings.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + (b.price || 0), 0);
      setS({ dest, promo, trips, bookings, revenue });
    })();
  }, []);

  const cards = s ? [
    { label: "Destinations", value: s.dest.length, icon: MapPin, to: "/dashboard/destinations" },
    { label: "Promotions & Events", value: s.promo.length, icon: Megaphone, to: "/dashboard/promotions" },
    { label: "Trips", value: s.trips.length, icon: MapIcon, to: "/dashboard/bookings" },
    { label: "Bookings", value: s.bookings.length, icon: CalendarCheck, to: "/dashboard/bookings" },
  ] : [];

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-mora-primary">Overview</h1>
        <p className="text-sm text-mora-neutral mt-0.5">Manage everything that powers the MORA mobile app.</p>
      </header>

      {!s ? (
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className="bg-white rounded-2xl border border-mora-primary/10 p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center">
                    <c.icon className="w-5 h-5 text-gold" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-mora-neutral/40 group-hover:text-gold transition-colors" />
                </div>
                <p className="text-3xl font-display font-bold text-mora-primary">{c.value}</p>
                <p className="text-xs text-mora-neutral mt-0.5">{c.label}</p>
              </Link>
            ))}
          </div>

          {/* Revenue banner */}
          <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl btn-primary flex items-center justify-center"><Wallet className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-xs text-mora-neutral uppercase tracking-widest">Confirmed revenue</p>
              <p className="text-2xl font-display font-bold text-mora-primary">{formatIDR(s.revenue)}</p>
            </div>
          </div>

          {/* Recent bookings */}
          <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-mora-primary/10 flex items-center justify-between">
              <h2 className="font-display font-semibold text-mora-primary">Recent bookings</h2>
              <Link to="/dashboard/bookings" className="text-xs text-gold font-medium">View all</Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
                  <th className="px-5 py-2.5 font-medium">Booking</th>
                  <th className="px-5 py-2.5 font-medium">Provider</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {s.bookings.slice(0, 6).map((b) => (
                  <tr key={b.id} className="border-b border-mora-primary/5 last:border-0">
                    <td className="px-5 py-3 font-medium text-mora-primary truncate max-w-[220px]">{b.title}</td>
                    <td className="px-5 py-3 text-mora-neutral">{b.provider || "—"}</td>
                    <td className="px-5 py-3 text-mora-neutral">{b.check_in ? moment(b.check_in).format("MMM D, YYYY") : "—"}</td>
                    <td className="px-5 py-3"><span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[b.status] || statusPill.pending}`}>{b.status}</span></td>
                    <td className="px-5 py-3 text-right font-semibold text-gold">{b.price ? formatIDR(b.price) : "—"}</td>
                  </tr>
                ))}
                {s.bookings.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-mora-neutral/60">No bookings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
