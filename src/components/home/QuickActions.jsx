import { Link } from "react-router-dom";
import { MapPin, Sparkles, CalendarSearch, MessageCircle } from "lucide-react";

const actions = [
  { icon: MapPin, label: "Plan\nTrip", path: "/itinerary/wizard", from: "#C42A2E", to: "#8E181B" },
  { icon: Sparkles, label: "AI\nAssistant", path: "/assistant/ai", from: "#D4A24C", to: "#B9842C" },
  { icon: CalendarSearch, label: "Book\nTravel", path: "/ota", from: "#1B2D52", to: "#0B1B3B" },
  { icon: MessageCircle, label: "Personal\nAssistant", path: "/assistant", from: "#0A4FB0", to: "#05308C" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3 px-6">
      {actions.map(({ icon: Icon, label, path, from, to }) => (
        <Link key={path} to={path} className="press-spring">
          <div className="card-modern rounded-2xl p-2.5 flex flex-col items-center gap-2 hover:shadow-lift transition-shadow">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-soft"
              style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              <Icon className="w-[22px] h-[22px] text-white" strokeWidth={2} />
            </div>
            <span className="text-[11px] text-mora-primary text-center leading-tight whitespace-pre-line font-medium">
              {label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
