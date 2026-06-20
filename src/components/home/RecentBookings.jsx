import { Plane, Building2, Train, ChevronRight } from "lucide-react";
import GlassCard from "../GlassCard";
import { Link } from "react-router-dom";
import moment from "moment";

const typeIcons = {
  flight: Plane,
  hotel: Building2,
  train: Train,
  villa: Building2,
};

export default function RecentBookings({ bookings = [] }) {
  if (bookings.length === 0) return null;

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-mora-primary tracking-wide uppercase">
          Recent Bookings
        </h2>
        <Link to="/booking" className="text-xs text-gold flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {bookings.slice(0, 3).map((booking) => {
          const Icon = typeIcons[booking.type] || Plane;
          return (
            <GlassCard key={booking.id} className="p-3.5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#A5997E]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-gold" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-mora-white truncate">{booking.title}</h4>
                <p className="text-xs text-mora-neutral/60 mt-0.5">
                  {booking.location} · {moment(booking.check_in).format("MMM D")}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  booking.status === "confirmed" 
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                    : "bg-[#A5997E]/15 text-gold border border-[#A5997E]/20"
                }`}>
                  {booking.status}
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}