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
        <h2 className="eyebrow text-sm font-semibold text-foreground tracking-wide uppercase">
          Recent Bookings
        </h2>
        <Link to="/booking" className="text-xs text-accent-strong flex items-center gap-1 press-spring">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {bookings.slice(0, 3).map((booking) => {
          const Icon = typeIcons[booking.type] || Plane;
          return (
            <Link key={booking.id} to={`/booking/${booking.id}`} className="block press-spring">
              <div className="bg-card shadow-card rounded-2xl p-3.5 flex items-center gap-3.5 hover:shadow-float transition-shadow lift">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-accent/15 to-accent/[0.04] ring-1 ring-accent/10">
                  <Icon className="w-[18px] h-[18px] text-accent-strong" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{booking.title}</h4>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {booking.location} · {moment(booking.check_in).format("MMM D")}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                  booking.status === "confirmed"
                    ? "bg-success-soft text-success border border-emerald-500/20"
                    : "bg-accent/10 text-accent-strong border border-accent/20"
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