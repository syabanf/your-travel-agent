import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import moment from "moment";

export default function ActiveTrip({ trip }) {
  if (!trip) return null;

  const daysUntil = moment(trip.start_date).diff(moment(), "days");
  const isActive = trip.status === "active";

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="eyebrow text-sm font-semibold text-ich-primary tracking-wide uppercase">
          {isActive ? "Active Trip" : "Upcoming Trip"}
        </h2>
        <Link to="/itinerary" className="text-xs text-gold flex items-center gap-1 press-spring">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <Link to={`/itinerary/${trip.id}`} className="block press-spring group">
        <div className="relative h-44 rounded-3xl overflow-hidden shadow-lift">
          <img
            src={trip.cover_image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"}
            alt={trip.title}
            className="w-full h-full object-cover img-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ich-primary via-ich-primary/35 to-transparent" />
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />

          {daysUntil > 0 && !isActive && (
            <div className="absolute top-3 right-3 chip-glass">In {daysUntil} days</div>
          )}
          {isActive && (
            <div className="absolute top-3 right-3 chip-glass !bg-emerald-400/20 !border-emerald-300/40 text-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> Active now
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-xl font-display font-semibold text-white mb-1.5 text-shadow-soft">
                {trip.title}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-white">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs">{trip.destination}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs">
                    {moment(trip.start_date).format("MMM D")} - {moment(trip.end_date).format("MMM D")}
                  </span>
                </div>
                {trip.travelers > 1 && (
                  <div className="flex items-center gap-1.5 text-white">
                    <Users className="w-3.5 h-3.5 text-gold" />
                    <span className="text-xs">{trip.travelers}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
      </Link>
    </div>
  );
}