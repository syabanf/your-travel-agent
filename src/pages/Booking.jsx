import { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plane, Building2, Train, Bus, Ship, Car, Ticket, MessageCircle, CalendarSearch, ChevronRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { formatIDR } from "@/lib/currency";
import moment from "moment";

const statusColors = {
  pending: "bg-mora-gold/10 text-gold border-mora-gold/20",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const typeIcons = { package: Package, flight: Plane, hotel: Building2, train: Train, bus: Bus, ship: Ship, car_rental: Car, attraction: Ticket, villa: Building2, consultation: MessageCircle };

// Status filter chips are derived from the bookings actually loaded, in this order.
const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Booking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [status, setStatus] = useState("all");

  const loadBookings = useCallback(async () => {
    setError(false);
    try {
      const data = await base44.entities.Booking.list("-created_date", 50);
      setBookings(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  // Only offer chips for statuses that actually appear in the data.
  const chips = useMemo(() => {
    const present = new Set((bookings || []).map((b) => b.status));
    return [
      { value: "all", label: `All (${(bookings || []).length})` },
      ...STATUS_FILTERS.filter((s) => present.has(s.value) || s.value === status),
    ];
  }, [bookings, status]);

  const shown = useMemo(
    () => (bookings || []).filter((b) => status === "all" || b.status === status),
    [bookings, status]
  );
  const statusLabel = STATUS_FILTERS.find((s) => s.value === status)?.label.toLowerCase();

  const handleTouchStart = (e) => {
    if (e.currentTarget.scrollTop === 0) setStartY(e.touches[0].clientY);
  };
  const handleTouchEnd = async (e) => {
    if (startY === null) return;
    const delta = e.changedTouches[0].clientY - startY;
    setStartY(null);
    if (delta > 70 && !refreshing) {
      setRefreshing(true);
      await loadBookings();
      setRefreshing(false);
    }
  };

  return (
    <div className="animate-fade-in pb-28" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {refreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        </div>
      )}
      <PageHeader title="My Bookings" subtitle="Your reservations" />

      {/* Ways to book: ready-made packages, or search the marketplace */}
      <div className="px-6 mb-6 space-y-3">
        <Link to="/packages" className="block press-spring">
          <div className="card-modern rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-lift transition-shadow">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-soft" style={{ backgroundImage: "linear-gradient(135deg, #C42A2E, #8E181B)" }}>
              <Package className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-mora-primary">Holiday packages</p>
              <p className="text-xs text-mora-neutral/70 mt-0.5">Ready-made trips, everything included</p>
            </div>
            <ChevronRight className="w-5 h-5 text-mora-neutral/40 flex-shrink-0" />
          </div>
        </Link>

        <Link to="/ota" className="block press-spring">
          <div className="card-modern rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-lift transition-shadow">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-soft" style={{ backgroundImage: "linear-gradient(135deg, #1B2D52, #0B1B3B)" }}>
              <CalendarSearch className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-mora-primary">Book flights, hotels &amp; more</p>
              <p className="text-xs text-mora-neutral/70 mt-0.5">Search the travel marketplace</p>
            </div>
            <ChevronRight className="w-5 h-5 text-mora-neutral/40 flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-mora-white/90 tracking-wide uppercase">
            My Bookings
          </h2>
        </div>

        {/* Status filter chips — hidden when there is nothing meaningful to filter by */}
        {!loading && !error && chips.length > 2 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-4">
            {chips.map((c) => (
              <button
                key={c.value}
                onClick={() => setStatus(c.value)}
                aria-pressed={status === c.value}
                className={`px-4 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 press-spring transition-colors ${
                  status === c.value ? "btn-primary text-white" : "glass-light text-mora-neutral"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <SkeletonRows rows={4} />
        ) : error ? (
          <ErrorState
            title="Couldn't load bookings"
            hint="Please check your connection and try again."
            onRetry={loadBookings}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No bookings yet"
            hint="Start exploring destinations and book your next trip"
            action={
              <Link
                to="/ota"
                className="press inline-flex items-center gap-2 px-5 py-2.5 glass-gold rounded-xl text-xs text-gold font-medium hover:glow-gold transition-all"
              >
                <CalendarSearch className="w-4 h-4" /> Book travel
              </Link>
            }
          />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={statusLabel ? `No ${statusLabel} bookings` : "No bookings found"}
            hint="Try another filter to see the rest of your reservations."
          />
        ) : (
          <div className="space-y-3 stagger">
            {shown.map((booking) => {
              const Icon = typeIcons[booking.type] || Ticket;
              return (
                <Link key={booking.id} to={`/booking/${booking.id}`} className="block press">
                  <GlassCard className="p-4 hover:bg-white/10 transition-all">
                    <div className="flex items-start gap-3.5">
                      {booking.image_url ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={booking.image_url} alt={booking.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-mora-gold/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-gold" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium text-mora-white truncate">{booking.title}</h3>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${statusColors[booking.status] || statusColors.pending}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-mora-neutral/60 mt-0.5">{booking.provider}</p>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <span className="text-xs text-mora-neutral/70 truncate min-w-0">
                            {booking.check_in && moment(booking.check_in).format("MMM D, YYYY")}
                          </span>
                          {booking.price > 0 && (
                            <span className="stat-value text-sm font-display font-semibold text-gold shrink-0">
                              {formatIDR(booking.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}