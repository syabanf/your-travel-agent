import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User, MapPin, Heart, CreditCard, Calendar, Sparkles, Settings, ChevronRight, LogOut, Bell, Shield, LayoutDashboard, Database } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

const menuItems = [
  { icon: Heart, label: "Travel Preferences", desc: "Style, pace & interests", path: "/profile/preferences" },
  { icon: User, label: "Saved Travelers", desc: "Companions & family", path: "/profile/travelers" },
  { icon: CreditCard, label: "Payment Methods", desc: "Cards & wallets", path: "/profile/payments" },
  { icon: Calendar, label: "Booking History", desc: "All past reservations", path: "/booking" },
  { icon: MapPin, label: "Saved Itineraries", desc: "Your trip collection", path: "/itinerary" },
  { icon: Sparkles, label: "AI Trip History", desc: "Generated itineraries", path: "/itinerary" },
  { icon: Bell, label: "Notifications", desc: "Alerts & reminders", path: "/notifications" },
  { icon: Shield, label: "Privacy & Security", desc: "Account protection", path: "/profile/security" },
  { icon: Database, label: "Privacy & Data", desc: "Export or delete your data", path: "/profile/privacy" },
  { icon: Settings, label: "Settings", desc: "App preferences", path: "/profile/settings" },
  { icon: LayoutDashboard, label: "Admin Dashboard", desc: "Manage app content (CMS)", path: "/dashboard" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [tripCount, setTripCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      const trips = await base44.entities.Trip.list("-created_date", 100);
      setTripCount(trips.length);
      
      const bookings = await base44.entities.Booking.list("-created_date", 100);
      setBookingCount(bookings.length);
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Profile" showNotification />

      {/* Profile Card */}
      <div className="px-6 mb-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/20">
              <span className="text-2xl font-display font-bold text-gold">
                {user?.full_name?.[0] || "M"}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-display font-semibold text-mora-primary">
                {user?.full_name || "Traveler"}
              </h2>
              <p className="text-xs text-mora-neutral mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <div className="px-2.5 py-0.5 bg-amber-soft border border-amber-soft rounded-full">
                  <span className="text-[9px] text-amber-accent font-semibold tracking-wider uppercase">Premium Member</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-mora-primary/10">
            <div className="text-center min-w-0">
              <p className="stat-value text-lg font-display font-bold text-mora-primary">{tripCount}</p>
              <p className="text-[10px] text-mora-neutral uppercase tracking-wider">Trips</p>
            </div>
            <div className="text-center min-w-0">
              <p className="stat-value text-lg font-display font-bold text-mora-primary">{bookingCount}</p>
              <p className="text-[10px] text-mora-neutral uppercase tracking-wider">Bookings</p>
            </div>
            <div className="text-center min-w-0">
              <p className="stat-value text-lg font-display font-bold text-gold">4.9</p>
              <p className="text-[10px] text-mora-neutral/70 uppercase tracking-wider">Rating</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Menu Items */}
      <div className="px-6 space-y-3 stagger">
        {menuItems.map(({ icon: Icon, label, desc, path }) => (
          <Link key={label} to={path} className="block press">
            <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(173, 31, 35, 0.08)' }}>
                <Icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-mora-primary">{label}</h3>
                <p className="text-[10px] text-mora-neutral">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-mora-neutral flex-shrink-0" />
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="px-6 mt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 glass-light rounded-2xl text-sm font-medium text-red-600 hover:text-red-700 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}