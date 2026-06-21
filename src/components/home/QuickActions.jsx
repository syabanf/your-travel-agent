import { Link } from "react-router-dom";
import { MapPin, Sparkles, CalendarSearch, MessageCircle } from "lucide-react";
import GlassCard from "../GlassCard";

const actions = [
  { icon: MapPin, label: "Plan\nTrip", path: "/itinerary/wizard", color: "#0B1B3B" },
  { icon: Sparkles, label: "AI\nAssistant", path: "/assistant/ai", color: "#AD1F23" },
  { icon: CalendarSearch, label: "Book\nTravel", path: "/ota", color: "#AD1F23" },
  { icon: MessageCircle, label: "Personal\nAssistant", path: "/assistant", color: "#0B1B3B" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3 px-6">
      {actions.map(({ icon: Icon, label, path, color }) => (
        <Link key={path} to={path}>
          <GlassCard className="p-3 flex flex-col items-center gap-2.5 hover:glow-gold">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
            </div>
            <span className="text-[11px] text-mora-primary text-center leading-tight whitespace-pre-line font-medium">
              {label}
            </span>
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}