import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import BrandMark from "./BrandMark";
import { isForMember } from "@/data/membership";
import { currentEmail } from "@/lib/featureAccess";
import { backend } from "@/api/backend";

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
        const me = await backend.auth.me();
        if (alive && me?.full_name) setInitial(me.full_name.trim().charAt(0).toUpperCase());
      } catch { /* guest */ }
      try {
        const n = (await backend.entities.Notification.filter({ is_read: false })).filter((x) => isForMember(x, currentEmail()));
        if (alive) setUnread((n || []).length);
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  const iconBtn = "relative flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-colors hover:bg-surface-2 active:scale-95";

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-3 px-5">
        <Link to="/" aria-label="Icon Holiday home" className="press rounded-xl">
          <BrandMark className="[&_img]:w-24" />
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/search" aria-label="Search" className={iconBtn}>
            <Search className="size-5" aria-hidden="true" />
          </Link>
          <Link to="/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} className={iconBtn}>
            <Bell className="size-5" aria-hidden="true" />
            {unread > 0 && (
              <span key={unread} className="animate-pop absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-bold leading-none text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link to="/profile" aria-label="Profile" className="flex size-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-on-ink shadow-card active:scale-95">
            {initial || "U"}
          </Link>
        </div>
      </div>
    </header>
  );
}
