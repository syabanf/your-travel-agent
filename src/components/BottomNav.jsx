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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="max-w-lg w-full px-4 pb-4">
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
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "text-mora-gold" 
                      : "text-mora-neutral/60 hover:text-mora-neutral"
                  }`}
                >
                  <div className={`relative ${isActive ? "" : ""}`}>
                    {isActive && (
                      <div className="absolute -inset-2 bg-[#A5997E]/10 rounded-xl" />
                    )}
                    <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${isActive ? "text-gold" : ""}`}>
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