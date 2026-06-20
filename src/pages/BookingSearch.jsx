import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plane, Hotel, Train, Car, Ship, Ticket, Home } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Link } from "react-router-dom";
import { formatIDR } from "@/lib/currency";
import moment from "moment";

const typeIcons = { flight: Plane, hotel: Hotel, train: Train, car_rental: Car, ship: Ship, attraction: Ticket, villa: Home, bus: Train };

const statusColors = {
  pending: "bg-[#A5997E]/15 text-gold",
  confirmed: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
  completed: "bg-blue-500/15 text-blue-400",
};

export default function BookingSearch() {
  const urlParams = new URLSearchParams(window.location.search);
  const typeFilter = urlParams.get("type") || "";
  const label = typeFilter ? typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1).replace("_", " ") : "All";

  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = typeFilter
        ? await base44.entities.Booking.filter({ type: typeFilter })
        : await base44.entities.Booking.list("-created_date", 50);
      setBookings(data);
      setLoading(false);
    };
    load();
  }, [typeFilter]);

  const filtered = bookings.filter(b =>
    !query || b.title?.toLowerCase().includes(query.toLowerCase()) ||
    b.provider?.toLowerCase().includes(query.toLowerCase()) ||
    b.location?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title={`${label} Bookings`} subtitle="All your reservations" showBack />

      <div className="px-6 mb-5">
        <GlassCard className="p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-mora-neutral/40 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search bookings..."
            className="flex-1 bg-transparent text-sm text-mora-white placeholder:text-mora-neutral/40 outline-none"
          />
        </GlassCard>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="px-6">
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-mora-neutral/50">No bookings found</p>
          </GlassCard>
        </div>
      ) : (
        <div className="px-6 space-y-3">
          {filtered.map(booking => {
            const Icon = typeIcons[booking.type] || Ticket;
            return (
              <Link key={booking.id} to={`/booking/${booking.id}`}>
                <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                  {booking.image_url ? (
                    <img src={booking.image_url} alt={booking.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl glass-light flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-mora-white truncate">{booking.title}</h3>
                    {booking.provider && <p className="text-xs text-mora-neutral/50 mt-0.5">{booking.provider}</p>}
                    {booking.check_in && (
                      <p className="text-[10px] text-gold mt-1">{moment(booking.check_in).format("MMM D, YYYY")}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {booking.status && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${statusColors[booking.status] || ""}`}>
                        {booking.status}
                      </span>
                    )}
                    {booking.price > 0 && (
                      <p className="text-xs font-display text-gold mt-1">{formatIDR(booking.price)}</p>
                    )}
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}