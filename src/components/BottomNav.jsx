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
    <nav aria-label="Main" className="absolute inset-x-0 bottom-0 z-50">
      <div aria-hidden="true" className="pointer-events-none h-8 bg-gradient-to-t from-surface to-transparent" />
      <div className="safe-b rounded-t-[28px] bg-card shadow-up">
        <div className="flex items-stretch px-3 pb-2 pt-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => handleTabPress(path)}
                aria-current={isActive ? "page" : undefined}
                className="group flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-1.5 focus-visible:outline-none"
              >
                <span
                  className={`relative flex h-9 w-14 items-center justify-center rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-accent/40 ${
                    isActive ? "text-white" : "text-muted group-hover:bg-surface group-hover:text-foreground group-active:bg-border"
                  }`}
                >
                  {/* One pill that slides to whichever tab is current. */}
                  {isActive && (
                    <motion.span
                      layoutId="tab-active"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-accent-strong shadow-glow"
                      transition={{ type: "spring", stiffness: 520, damping: 36 }}
                    />
                  )}
                  <Icon aria-hidden="true" className="relative size-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className={`text-[11px] font-semibold transition-colors ${isActive ? "text-accent-strong" : "text-muted group-hover:text-foreground"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
