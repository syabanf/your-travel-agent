import { Link } from "react-router-dom";
import { MapPin, Calendar, Users } from "lucide-react";
import GlassCard from "../GlassCard";
import moment from "moment";

const statusColors = {
  draft: "bg-mora-neutral/15 text-mora-neutral border-mora-neutral/20",
  planned: "bg-[#A5997E]/15 text-gold border-[#A5997E]/20",
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function TripCard({ trip }) {
  return (
    <Link to={`/itinerary/${trip.id}`}>
      <GlassCard className="overflow-hidden hover:glow-gold transition-all duration-300">
        <div className="flex">
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={trip.cover_image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=80"} 
              alt={trip.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-3.5 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-display font-semibold text-mora-white truncate">
                {trip.title}
              </h3>
              <span className={`text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${statusColors[trip.status] || statusColors.draft}`}>
                {trip.status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-mora-neutral/60 mb-1.5">
              <MapPin className="w-3 h-3 text-gold" />
              <span className="text-xs truncate">{trip.destination}</span>
            </div>
            <div className="flex items-center gap-3">
              {trip.start_date && (
                <div className="flex items-center gap-1 text-mora-neutral/50">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px]">
                    {moment(trip.start_date).format("MMM D")}
                    {trip.end_date && ` - ${moment(trip.end_date).format("MMM D")}`}
                  </span>
                </div>
              )}
              {trip.travelers > 1 && (
                <div className="flex items-center gap-1 text-mora-neutral/50">
                  <Users className="w-3 h-3" />
                  <span className="text-[10px]">{trip.travelers}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}