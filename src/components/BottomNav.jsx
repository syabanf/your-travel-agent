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
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-300 min-w-[48px] min-h-[48px] justify-center ${
                    isActive ? "bg-mora-gold/10" : "hover:bg-mora-primary/5 active:scale-95"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-gold" : "text-mora-neutral/70"}`}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  <span className={`text-[11px] font-medium tracking-wide ${isActive ? "text-gold" : "text-mora-neutral/70"}`}>
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