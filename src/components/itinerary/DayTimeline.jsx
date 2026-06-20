import { useState, useEffect } from "react";
import { Clock, MapPin, CheckCircle, Circle, Plus, Navigation, Map } from "lucide-react";
import GlassCard from "../GlassCard";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import moment from "moment";

const categoryColors = {
  transport: "#60A5FA",
  accommodation: "#A78BFA",
  dining: "#FB923C",
  attraction: "#34D399",
  activity: "#F472B6",
  shopping: "#FBBF24",
  rest: "#94A3B8",
  other: "#94A3B8",
};

export default function DayTimeline({ dayNumber, date, items: initialItems, tripId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialItems);

  // Sync if parent items change
  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const handleToggleComplete = async (item) => {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: !i.is_completed } : i));
    try {
      await base44.entities.ItineraryItem.update(item.id, { is_completed: !item.is_completed });
    } catch {
      // Revert on error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: item.is_completed } : i));
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center">
            <span className="text-sm font-display font-bold text-gold">{dayNumber}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-mora-white">Day {dayNumber}</h3>
            {date && (
              <p className="text-[10px] text-mora-neutral/60">{moment(date).format("dddd, MMM D")}</p>
            )}
          </div>
        </div>
        <Link 
          to={`/itinerary/${tripId}/add?day=${dayNumber}`}
          className="w-9 h-9 glass-light rounded-lg flex items-center justify-center text-mora-neutral/50 hover:text-gold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-mora-neutral/40">No activities planned</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {items.map((item, idx) => (
            <div key={item.id} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ backgroundColor: categoryColors[item.category] || categoryColors.other }}
                />
                {idx < items.length - 1 && (
                  <div className="w-px flex-1 bg-white/10 my-1" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {item.time && (
                        <span className="text-[10px] text-gold font-medium">{item.time}</span>
                      )}
                      {item.duration_minutes && (
                        <span className="text-[10px] text-mora-neutral/40 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {item.duration_minutes}min
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm font-medium ${item.is_completed ? "text-mora-neutral/50 line-through" : "text-mora-white"}`}>
                      {item.activity_name}
                    </h4>
                    {item.location && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => navigate(`/itinerary/map?location=${encodeURIComponent(item.location)}`)}
                          className="text-[10px] text-mora-neutral/50 flex items-center gap-1 hover:text-gold transition-colors"
                        >
                          <MapPin className="w-3 h-3" /> {item.location}
                        </button>
                        <button
                          onClick={() => navigate(`/itinerary/map?location=${encodeURIComponent(item.location)}`)}
                          className="w-5 h-5 flex items-center justify-center text-mora-neutral/50 hover:text-gold transition-colors"
                          title="View on map"
                          aria-label="View on map"
                        >
                          <Map className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {item.budget > 0 && (
                      <span className="text-[10px] text-gold/70 mt-0.5 inline-block">{formatIDR(item.budget)}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleToggleComplete(item)}
                    className="flex-shrink-0 mt-1 w-11 h-11 flex items-center justify-center -mr-2"
                  >
                    {item.is_completed ? (
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-mora-neutral/30" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}