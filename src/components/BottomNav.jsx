import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, CalendarSearch, MessageCircle, User } from "lucide-react";

const TAB_ROOTS = ["/", "/itinerary", "/booking", "/assistant", "/profile"];

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/itinerary", icon: Map, label: "Itinerary" },
  { path: "/booking", icon: CalendarSearch, label: "Booking" },
  { path: "/assistant", icon: MessageCircle, label: "Assistant" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Persist last visited path per tab root in sessionStorage
  useEffect(() => {
    const root = TAB_ROOTS.find(r =>
      r === "/" ? location.pathname === "/" : location.pathname.startsWith(r)
    );
    if (root) sessionStorage.setItem(`tab_path_${root}`, location.pathname + location.search);
  }, [location]);

  const handleTabPress = (path) => {
    const isActive = path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);
    if (isActive) {
      // Reset to root path on click
      navigate(path);
      sessionStorage.setItem(`tab_path_${path}`, path);
      return;
    }
    const saved = sessionStorage.getItem(`tab_path_${path}`);
    navigate(saved || path);
  };

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
                <button
                  key={path}
                  onClick={() => handleTabPress(path)}
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
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}