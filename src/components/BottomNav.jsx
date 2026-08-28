import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
        <nav className="glass-nav rounded-[1.75rem] px-2 py-2 shadow-float">
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
                  className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl min-w-[52px] min-h-[48px] justify-center active:scale-90 transition-transform"
                >
                  {isActive && (
                    <motion.span
                      layoutId="navActivePill"
                      className="absolute inset-0 rounded-2xl bg-ich-gold/[0.12]"
                      transition={{ type: "spring", stiffness: 520, damping: 38 }}
                    />
                  )}
                  <Icon
                    className={`relative w-5 h-5 transition-colors ${isActive ? "text-gold" : "text-ich-neutral/60"}`}
                    strokeWidth={isActive ? 2.4 : 1.7}
                  />
                  <span className={`relative text-[11px] font-medium tracking-wide transition-colors ${isActive ? "text-gold" : "text-ich-neutral/60"}`}>
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