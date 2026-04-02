import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plane, Building2, Train, Bus, Ship, Car, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import OTASearch from "../components/booking/OTASearch";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import moment from "moment";

const bookingCategories = [
  { icon: Plane, label: "Flights", type: "flight" },
  { icon: Building2, label: "Hotels", type: "hotel" },
  { icon: Train, label: "Trains", type: "train" },
  { icon: Bus, label: "Buses", type: "bus" },
  { icon: Ship, label: "Ships", type: "ship" },
  { icon: Car, label: "Rentals", type: "car_rental" },
  { icon: Ticket, label: "Attractions", type: "attraction" },
];

const statusColors = {
  pending: "bg-[#A5997E]/15 text-gold border-[#A5997E]/20",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const typeIcons = { flight: Plane, hotel: Building2, train: Train, bus: Bus, ship: Ship, car_rental: Car, attraction: Ticket, villa: Building2 };

export default function Booking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);

  const loadBookings = useCallback(async () => {
    const data = await base44.entities.Booking.list("-created_date", 50);
    setBookings(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

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
      <PageHeader title="Booking" subtitle="Find & manage reservations" showNotification />

      {/* OTA Search */}
      <OTASearch onSaveBooking={() => base44.entities.Booking.list("-created_date", 50).then(setBookings)} />

      {/* Recent Bookings */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-mora-white/90 tracking-wide uppercase">
            My Bookings
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Ticket className="w-10 h-10 text-mora-neutral/30 mx-auto mb-3" />
            <p className="text-sm text-mora-neutral/60 mb-1">No bookings yet</p>
            <p className="text-xs text-mora-neutral/40">Start exploring destinations</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const Icon = typeIcons[booking.type] || Ticket;
              return (
                <Link key={booking.id} to={`/booking/${booking.id}`} className="block">
                  <GlassCard className="p-5 hover:bg-white/10 transition-all">
                    <div className="flex items-start gap-3.5">
                      {booking.image_url ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={booking.image_url} alt={booking.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-[#A5997E]/10 flex items-center justify-center flex-shrink-0">
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
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-mora-neutral/50">
                            {booking.check_in && moment(booking.check_in).format("MMM D, YYYY")}
                          </span>
                          {booking.price > 0 && (
                            <span className="text-sm font-display font-semibold text-gold">
                              ${booking.price}
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