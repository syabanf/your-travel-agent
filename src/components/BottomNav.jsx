import { Link, useLocation } from "react-router-dom";
import { Home, Map, CalendarSearch, MessageCircle, User } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/itinerary", icon: Map, label: "Itinerary" },
  { path: "/booking", icon: CalendarSearch, label: "Booking" },
  { path: "/assistant", icon: MessageCircle, label: "Assistant" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="px-3 pt-1" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <nav className="glass-nav rounded-2xl px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = path === "/" 
                ? location.pathname === "/"
                : location.pathname.startsWith(path);
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[44px] min-h-[44px] justify-center ${
                    isActive 
                      ? "text-mora-gold" 
                      : "text-mora-neutral/60 hover:text-mora-neutral"
                  }`}
                >
                  <div className="relative">
                    {isActive && (
                      <div className="absolute -inset-2 bg-[#A5997E]/10 rounded-xl" />
                    )}
                    <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className={`text-xs font-medium tracking-wide ${isActive ? "text-gold" : ""}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}