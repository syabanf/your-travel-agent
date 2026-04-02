import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import GlassCard from "../GlassCard";
import moment from "moment";

export default function ActiveTrip({ trip }) {
  if (!trip) return null;

  const daysUntil = moment(trip.start_date).diff(moment(), "days");
  const isActive = trip.status === "active";

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-mora-white/90 tracking-wide uppercase">
          {isActive ? "Active Trip" : "Upcoming Trip"}
        </h2>
        <Link to="/itinerary" className="text-xs text-gold flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      
      <Link to={`/itinerary/${trip.id}`}>
        <GlassCard className="overflow-hidden">
          <div className="relative h-36">
            <img 
              src={trip.cover_image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"} 
              alt={trip.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22]/90 via-[#1a2e22]/40 to-transparent" />
            
            {daysUntil > 0 && !isActive && (
              <div className="absolute top-3 right-3 glass-gold px-3 py-1 rounded-full">
                <span className="text-[11px] font-semibold text-mora-white">
                  In {daysUntil} days
                </span>
              </div>
            )}
            {isActive && (
              <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full">
                <span className="text-[11px] font-semibold text-emerald-300">Active Now</span>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-display font-semibold text-mora-white mb-1.5">
                {trip.title}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-mora-neutral/80">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs">{trip.destination}</span>
                </div>
                <div className="flex items-center gap-1.5 text-mora-neutral/80">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  <span className="text-xs">
                    {moment(trip.start_date).format("MMM D")} - {moment(trip.end_date).format("MMM D")}
                  </span>
                </div>
                {trip.travelers > 1 && (
                  <div className="flex items-center gap-1.5 text-mora-neutral/80">
                    <Users className="w-3.5 h-3.5 text-gold" />
                    <span className="text-xs">{trip.travelers}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </Link>
    </div>
  );
}