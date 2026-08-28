import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, Sparkles } from "lucide-react";
import GlassCard from "../GlassCard";
import moment from "moment";
import { isPlan } from "@/data/tripKinds";

const statusColors = {
  draft: "bg-ich-neutral/15 text-ich-neutral border-ich-neutral/20",
  planned: "bg-ich-gold/10 text-gold border-ich-gold/20",
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/15 text-red-600 border-red-500/20",
};

export default function TripCard({ trip }) {
  return (
    <Link to={`/itinerary/${trip.id}`} className="block">
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
            <h3 className="text-sm font-display font-semibold text-ich-primary truncate">
              {trip.title}
            </h3>
            {isPlan(trip) ? (
              // A proposal, not a booked trip — label it as one.
              <span className="text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 inline-flex items-center gap-1 bg-gold/15 text-gold border-gold/25">
                <Sparkles className="w-2.5 h-2.5" /> Plan
              </span>
            ) : (
              <span className={`text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${statusColors[trip.status]?.replace('text-ich-neutral', 'text-ich-primary').replace('bg-ich-neutral', 'bg-ich-primary') || statusColors.draft}`}>
                {trip.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-ich-neutral mb-1.5">
              <MapPin className="w-3 h-3 text-gold" />
              <span className="text-xs truncate">{trip.destination}</span>
            </div>
            <div className="flex items-center gap-3">
              {trip.start_date && (
                <div className="flex items-center gap-1 text-ich-neutral">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px]">
                    {moment(trip.start_date).format("MMM D")}
                    {trip.end_date && ` - ${moment(trip.end_date).format("MMM D")}`}
                  </span>
                </div>
              )}
              {trip.travelers > 1 && (
                <div className="flex items-center gap-1 text-ich-neutral">
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