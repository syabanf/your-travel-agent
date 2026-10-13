import { useState, useEffect } from "react";
import { Clock, MapPin, CheckCircle, Circle, Plus, Map, Flag, BookOpen, ChevronDown } from "lucide-react";
import GlassCard from "../GlassCard";
import { Link, useNavigate } from "react-router-dom";
import { backend } from "@/api/backend";
import { formatIDR } from "@/lib/currency";
import moment from "moment";
import { BRAND } from "@/lib/brand";

const categoryColors = {
  transport: BRAND.info,
  accommodation: BRAND.ink,
  dining: BRAND.warning,
  attraction: BRAND.success,
  activity: BRAND.accent,
  shopping: BRAND.warning,
  rest: BRAND.chartMuted,
  other: BRAND.chartMuted,
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
      await backend.entities.ItineraryItem.update(item.id, { is_completed: !item.is_completed });
    } catch {
      // Revert on error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_completed: item.is_completed } : i));
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <span className="text-sm font-display font-bold text-accent-strong">{dayNumber}</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Day {dayNumber}</h3>
            {date && (
              <p className="text-[10px] text-muted">{moment(date).format("dddd, MMM D")}</p>
            )}
          </div>
        </div>
        <Link 
          to={`/itinerary/${tripId}/add?day=${dayNumber}`}
          className="w-9 h-9 bg-card shadow-card rounded-lg flex items-center justify-center text-muted hover:text-accent-strong transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-muted">No activities planned</p>
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
                  <div className="w-px flex-1 bg-surface my-1" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {item.time && (
                        <span className="text-[10px] text-accent-strong font-medium">{item.time}</span>
                      )}
                      {item.duration_minutes && (
                        <span className="text-[10px] text-muted flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {item.duration_minutes}min
                        </span>
                      )}
                    </div>
                    <h4 className={`text-sm font-medium ${item.is_completed ? "text-muted line-through" : "text-foreground"}`}>
                      {item.activity_name}
                      {item.changed && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-warning-soft px-1.5 py-0.5 align-middle text-[10px] font-semibold text-warning">
                          Updated
                        </span>
                      )}
                    </h4>
                    {item.changed && item.change_note && <p className="mt-0.5 text-[11px] text-warning">{item.change_note}</p>}
                    {item.meeting_point && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-body">
                        <Flag className="size-3 text-accent-strong" aria-hidden="true" /> Meet: {item.meeting_point}
                      </p>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => navigate(`/itinerary/map?location=${encodeURIComponent(item.location)}`)}
                          className="text-[10px] text-muted flex items-center gap-1 hover:text-accent-strong transition-colors"
                        >
                          <MapPin className="w-3 h-3" /> {item.location}
                        </button>
                        <button
                          onClick={() => navigate(`/itinerary/map?location=${encodeURIComponent(item.location)}`)}
                          className="w-5 h-5 flex items-center justify-center text-muted hover:text-accent-strong transition-colors"
                          title="View on map"
                          aria-label="View on map"
                        >
                          <Map className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {item.budget > 0 && (
                      <span className="text-[10px] text-accent-strong mt-0.5 inline-block">{formatIDR(item.budget)}</span>
                    )}
                    {item.place_info && (
                      <details className="group/info mt-2 rounded-xl bg-surface-2 px-3 py-2">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-semibold text-foreground">
                          <BookOpen className="size-3.5 text-accent-strong" aria-hidden="true" /> About this place
                          <ChevronDown className="ml-auto size-3.5 text-muted transition-transform group-open/info:rotate-180" aria-hidden="true" />
                        </summary>
                        <p className="mt-1.5 text-xs leading-relaxed text-body">{item.place_info}</p>
                      </details>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleComplete(item)}
                    aria-pressed={item.is_completed}
                    aria-label={item.is_completed ? "Mark activity as not done" : "Mark activity as done"}
                    className="flex-shrink-0 mt-1 w-11 h-11 flex items-center justify-center -mr-2"
                  >
                    {item.is_completed ? (
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-muted" />
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