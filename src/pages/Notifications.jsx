import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, MapPin, CreditCard, MessageCircle, Calendar, Check, Settings } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
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
  trip_reminder: "#A5997E",
  booking_update: "#60A5FA",
  payment: "#34D399",
  assistant: "#F472B6",
  system: "#94A3B8",
  activity_reminder: "#FBBF24",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Notification.list("-created_date", 50);
      setNotifications(data);
      setLoading(false);
    };
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
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Notifications" 
        showBack 
        rightAction={
          unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-light rounded-lg text-[10px] text-gold"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )
        }
      />

      <div className="px-6 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Bell className="w-10 h-10 text-mora-neutral/30 mx-auto mb-3" />
            <p className="text-sm text-mora-neutral/60">All caught up</p>
            <p className="text-xs text-mora-neutral/40 mt-1">No notifications yet</p>
          </GlassCard>
        ) : (
          notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const color = typeColors[notification.type] || "#BCC3BD";
            return (
              <GlassCard 
                key={notification.id} 
                className={`p-4 flex gap-3.5 transition-all ${!notification.is_read ? "border-l-2" : ""}`}
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
                    <h3 className={`text-sm font-medium ${!notification.is_read ? "text-mora-white" : "text-mora-neutral/70"}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-mora-gold rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-mora-neutral/50 mt-0.5 leading-relaxed">{notification.message}</p>
                  <p className="text-[10px] text-mora-neutral/30 mt-1.5">
                    {moment(notification.created_date).fromNow()}
                  </p>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
}