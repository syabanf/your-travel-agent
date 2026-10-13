import { useState, useEffect } from "react";
import { backend } from "@/api/backend";
import { Bell, MapPin, CreditCard, MessageCircle, Calendar, Check, Settings, X, FileWarning, Megaphone, CalendarClock, RefreshCw, Tag } from "lucide-react";
import { NOTIFICATION_CATEGORIES, notificationCategory, isForMember } from "@/data/membership";
import { currentEmail } from "@/lib/featureAccess";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import moment from "moment";
import { BRAND } from "@/lib/brand";

// Icon and tint per notification type.
const TYPES = {
  trip_reminder: [MapPin, BRAND.accent],
  booking_update: [CreditCard, BRAND.info],
  payment: [CreditCard, BRAND.success],
  assistant: [MessageCircle, BRAND.accent],
  system: [Settings, BRAND.chartMuted],
  activity_reminder: [Calendar, BRAND.warning],
  document: [FileWarning, BRAND.accent],
  trip_prep: [CalendarClock, BRAND.info],
  itinerary_change: [RefreshCw, BRAND.warning],
  promo: [Tag, BRAND.accent],
  announcement: [Megaphone, BRAND.ink],
};

const chip = (on, onClass) =>
  `min-h-[38px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-semibold transition-colors ${
    on ? onClass : "bg-card text-muted shadow-card hover:text-foreground"
  }`;

// Which categories the member wants pushed to the device (13.2). The in-app
// list always shows everything; this is the delivery preference.
const PREFS_KEY = "ich_notif_prefs";
const DEFAULT_PREFS = { trip: true, personal: true, promo: true };
const readPrefs = () => {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") }; }
  catch { return DEFAULT_PREFS; }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const togglePref = (key) => setPrefs((p) => {
    const next = { ...p, [key]: !p[key] };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  });

  const load = async () => {
    const data = (await backend.entities.Notification.list("-created_at", 80)).filter((n) => isForMember(n, currentEmail()));
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markAsRead = async (id) => {
    await backend.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    for (const n of notifications.filter(n => !n.is_read)) {
      await backend.entities.Notification.update(n.id, { is_read: true });
    }
    await load();
  };

  const deleteNotification = async (id) => {
    await backend.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const countFor = (cat) => notifications.filter((n) => cat === "all" || notificationCategory(n) === cat).length;

  const shown = notifications.filter((n) =>
    (category === "all" || notificationCategory(n) === category) && (!unreadOnly || !n.is_read)
  );

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader
        title="Notifications"
        showBack 
        rightAction={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                aria-label="Mark all notifications as read"
                className="flex h-9 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-semibold text-accent-strong shadow-card transition-colors hover:bg-surface-2"
              >
                <Check className="size-3.5" aria-hidden="true" /> Read all
              </button>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Notification settings"
              className="flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-colors hover:bg-surface-2"
            >
              <Settings className="size-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      {/* Categories from the membership spec, plus an unread toggle. */}
      {!loading && (
        <div className="flex gap-2 overflow-x-auto px-6 pb-4 hide-scrollbar" role="tablist" aria-label="Notification category">
          {NOTIFICATION_CATEGORIES.map((c) => (
            <button
              key={c.value}
              role="tab"
              aria-selected={category === c.value}
              onClick={() => setCategory(c.value)}
              className={chip(category === c.value, "bg-accent-strong text-white shadow-glow")}
            >
              {c.label} <span className="opacity-75">{countFor(c.value)}</span>
            </button>
          ))}
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            aria-pressed={unreadOnly}
            className={chip(unreadOnly, "bg-ink text-white")}
          >
            Unread {unreadCount}
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-6">
          <SkeletonRows rows={4} />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          hint="No notifications right now."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? "No unread notifications here" : "Nothing in this category"}
          hint="Try another category to see the rest."
        />
      ) : (
        <div className="px-6 space-y-4 stagger">
          {shown.map((notification) => {
            const [Icon, color] = TYPES[notification.type] || [Bell, BRAND.chartMuted];
            return (
              <GlassCard
                key={notification.id}
                className={`press p-5 flex gap-4 transition-all ${!notification.is_read ? "border-l-2" : ""}`}
                style={!notification.is_read ? { borderLeftColor: color } : {}}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-medium ${!notification.is_read ? "text-foreground" : "text-muted"}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-accent-strong rounded-full" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                        aria-label="Delete notification"
                        className="text-muted hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{notification.message}</p>
                  <p className="text-[10px] text-muted mt-1.5">
                    {moment(notification.created_at).fromNow()}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Notification settings (13.2): which categories reach the device. */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Notification settings">
          <button type="button" aria-label="Close settings" className="absolute inset-0 bg-foreground/30" onClick={() => setSettingsOpen(false)} />
          <div className="safe-b absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[28px] bg-card px-5 pb-6 pt-3 shadow-float animate-slide-up">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Notification settings</h2>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings" className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted">Choose what Icon Holiday sends to this device. Everything still appears in this list.</p>
            <ul className="divide-y divide-border">
              {[
                ["trip", "My trips", "Departure, preparation and itinerary changes"],
                ["personal", "Personal", "Documents and account messages for you"],
                ["promo", "Promo", "Member offers and announcements"],
              ].map(([key, label, hint]) => (
                <li key={key} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted">{hint}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs[key]}
                    aria-label={`${label} notifications`}
                    onClick={() => togglePref(key)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${prefs[key] ? "bg-accent-strong" : "bg-border"}`}
                  >
                    <span className={`absolute top-1 size-5 rounded-full bg-white shadow-card transition-transform ${prefs[key] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
