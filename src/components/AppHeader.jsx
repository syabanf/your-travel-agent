import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell, Plane } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Slim, sticky brand app-bar shown on the mobile app's main tab screens.
// Carries the brand + global actions (search, notifications, profile) so each
// page no longer has to repeat them.
export default function AppHeader() {
  const [unread, setUnread] = useState(0);
  const [initial, setInitial] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (alive && me?.full_name) setInitial(me.full_name.trim().charAt(0).toUpperCase());
      } catch { /* guest */ }
      try {
        const n = await base44.entities.Notification.filter({ is_read: false });
        if (alive) setUnread((n || []).length);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <header className="sticky top-0 z-30 glass-light border-b border-mora-primary/[0.06]">
      <div className="px-5 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 press">
          <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center"><Plane className="w-4 h-4 text-white" /></div>
          <span className="font-display font-bold text-mora-primary tracking-tight">MORA</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link to="/search" aria-label="Search" className="w-9 h-9 rounded-xl flex items-center justify-center text-mora-neutral hover:text-gold hover:bg-mora-primary/5 transition-colors">
            <Search className="w-[18px] h-[18px]" />
          </Link>
          <Link to="/notifications" aria-label="Notifications" className="relative w-9 h-9 rounded-xl flex items-center justify-center text-mora-neutral hover:text-gold hover:bg-mora-primary/5 transition-colors">
            <Bell className="w-[18px] h-[18px]" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-1 bg-mora-gold text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link to="/profile" aria-label="Profile" className="w-9 h-9 rounded-full btn-primary flex items-center justify-center text-white font-display font-semibold text-sm press">
            {initial || "U"}
          </Link>
        </div>
      </div>
    </header>
  );
}
