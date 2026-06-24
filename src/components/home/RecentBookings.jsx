import { Plane, Building2, Train, ChevronRight } from "lucide-react";
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
        <h2 className="eyebrow text-sm font-semibold text-mora-primary tracking-wide uppercase">
          Recent Bookings
        </h2>
        <Link to="/booking" className="text-xs text-gold flex items-center gap-1 press-spring">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {bookings.slice(0, 3).map((booking) => {
          const Icon = typeIcons[booking.type] || Plane;
          return (
            <Link key={booking.id} to={`/booking/${booking.id}`} className="block press-spring">
              <div className="card-modern rounded-2xl p-3.5 flex items-center gap-3.5 hover:shadow-lift transition-shadow">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-mora-gold/15 to-mora-gold/[0.04] ring-1 ring-mora-gold/10">
                  <Icon className="w-[18px] h-[18px] text-gold" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-mora-primary truncate">{booking.title}</h4>
                  <p className="text-xs text-mora-neutral/70 mt-0.5 truncate">
                    {booking.location} · {moment(booking.check_in).format("MMM D")}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                  booking.status === "confirmed"
                    ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                    : "bg-mora-gold/10 text-gold border border-mora-gold/20"
                }`}>
                  {booking.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}