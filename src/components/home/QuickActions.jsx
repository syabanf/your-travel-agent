import { Link } from "react-router-dom";
import { MapPin, Sparkles, CalendarSearch, MessageCircle, Package, Stamp, Tag, Luggage } from "lucide-react";

// Soft-tint icon tiles on white cards. The first row is the membership quick
// menu (Paket Tour, Info Visa, Promo, Tour Anda); the second keeps the
// planning tools. Only the first tile carries a solid accent.
const actions = [
  { icon: Package, label: "Tour\npackages", path: "/packages", tile: "bg-accent-strong text-white" },
  { icon: Stamp, label: "Visa\ninfo", path: "/visa", tile: "bg-info-soft text-info" },
  { icon: Tag, label: "Promo", path: "/promotions", tile: "bg-accent-soft text-accent-strong" },
  { icon: Luggage, label: "My\ntrips", path: "/itinerary", tile: "bg-highlight-soft text-ink" },
  { icon: MapPin, label: "Plan\ntrip", path: "/itinerary/wizard", tile: "bg-surface text-foreground" },
  { icon: Sparkles, label: "AI\nassistant", path: "/assistant/ai", tile: "bg-surface text-foreground" },
  { icon: CalendarSearch, label: "Book\ntravel", path: "/ota", tile: "bg-surface text-foreground" },
  { icon: MessageCircle, label: "Personal\nassistant", path: "/assistant", tile: "bg-surface text-foreground" },
];

export default function QuickActions() {
  return (
    <div className="stagger grid grid-cols-4 gap-3 px-6">
      {actions.map(({ icon: Icon, label, path, tile }) => (
        <Link key={path} to={path} className="press-spring rounded-2xl">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-2.5 shadow-card transition-colors hover:bg-surface-2 lift">
            <div className={`flex size-11 items-center justify-center rounded-2xl ${tile}`}>
              <Icon className="size-[22px]" strokeWidth={2} aria-hidden="true" />
            </div>
            <span className="whitespace-pre-line text-center text-[11px] font-medium leading-tight text-foreground">
              {label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
