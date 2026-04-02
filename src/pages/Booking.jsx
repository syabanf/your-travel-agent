import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plane, Building2, Train, Bus, Ship, Car, Ticket, Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Booking.list("-created_date", 50);
      setBookings(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title="Booking" subtitle="Find & manage reservations" showNotification />

      {/* Search */}
      <div className="px-6 mb-6">
        <GlassCard className="p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-mora-neutral/40" />
          <input 
            placeholder="Search destinations, hotels, flights..."
            className="flex-1 bg-transparent text-sm text-mora-white placeholder:text-mora-neutral/40 outline-none"
          />
        </GlassCard>
      </div>

      {/* Categories */}
      <div className="px-6 mb-8">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-2">
          {bookingCategories.map(({ icon: Icon, label, type }) => (
            <Link key={type} to={`/booking/search?type=${type}`}>
              <GlassCard className="flex flex-col items-center gap-2 p-4 min-w-[76px]">
                <div className="w-10 h-10 rounded-xl bg-[#A5997E]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] text-mora-white/70 font-medium">{label}</span>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

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
          <div className="space-y-4">
            {bookings.map((booking) => {
              const Icon = typeIcons[booking.type] || Ticket;
              return (
                <Link key={booking.id} to={`/booking/${booking.id}`}>
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