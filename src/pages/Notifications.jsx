import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, MapPin, CreditCard, MessageCircle, Calendar, Check, Settings, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import moment from "moment";

const typeIcons = {
  trip_reminder: MapPin,
  booking_update: CreditCard,
  payment: CreditCard,
  assistant: MessageCircle,
  system: Settings,
  activity_reminder: Calendar,
};

const typeColors = {
  trip_reminder: "#AD1F23",
  booking_update: "#60A5FA",
  payment: "#34D399",
  assistant: "#F472B6",
  system: "#94A3B8",
  activity_reminder: "#FBBF24",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const data = await base44.entities.Notification.list("-created_date", 50);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markAsRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    for (const n of notifications.filter(n => !n.is_read)) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    await load();
  };

  const deleteNotification = async (id) => {
    await base44.entities.Notification.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.length - unreadCount;

  // Keep a chip visible while it is the active filter, even once its bucket empties.
  const chips = [
    { value: "all", label: `All (${notifications.length})` },
    ...(unreadCount > 0 || filter === "unread" ? [{ value: "unread", label: `Unread (${unreadCount})` }] : []),
    ...(readCount > 0 || filter === "read" ? [{ value: "read", label: "Read" }] : []),
  ];

  const shown = notifications.filter((n) =>
    filter === "all" ? true : filter === "unread" ? !n.is_read : n.is_read
  );

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader
        title="Notifications"
        showBack 
        rightAction={
          unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              aria-label="Mark all notifications as read"
              className="flex items-center gap-1.5 px-3 py-1.5 glass-light rounded-lg text-[10px] text-gold"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )
        }
      />

      {/* Read-state filter chips */}
      {!loading && chips.length > 2 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-6 pb-4">
          {chips.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              aria-pressed={filter === c.value}
              className={`px-4 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 press-spring transition-colors ${
                filter === c.value ? "btn-primary text-white" : "glass-light text-ich-neutral"
              }`}
            >
              {c.label}
            </button>
          ))}
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
          title={filter === "unread" ? "No unread notifications" : "No read notifications"}
          hint="Try another filter to see the rest."
        />
      ) : (
        <div className="px-6 space-y-4 stagger">
          {shown.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const color = typeColors[notification.type] || "#94A3B8";
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
                    <h3 className={`text-sm font-medium ${!notification.is_read ? "text-ich-white" : "text-ich-neutral/70"}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-ich-gold rounded-full" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                        aria-label="Delete notification"
                        className="text-ich-neutral/40 hover:text-ich-primary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-ich-neutral/70 mt-0.5 leading-relaxed">{notification.message}</p>
                  <p className="text-[10px] text-ich-neutral/60 mt-1.5">
                    {moment(notification.created_date).fromNow()}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}