import { useState, useEffect } from "react";
import { backend } from "@/api/backend";
import { User, UserRound, MapPin, Heart, CreditCard, Calendar, Sparkles, Settings, ChevronRight, LogOut, Bell, Shield, LayoutDashboard, Database, FolderOpen, Stamp, LifeBuoy, Luggage } from "lucide-react";
import BrandMark from "../components/BrandMark";
import { memberNumber, memberPoints, tripPhase } from "@/data/membership";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import CountUp from "@/components/CountUp";

const menuItems = [
  { icon: User, label: "Personal details", desc: "Name and phone used in bookings", path: "/profile/details" },
  { icon: Luggage, label: "My trips", desc: "Upcoming, ongoing and past", path: "/itinerary" },
  { icon: FolderOpen, label: "My documents", desc: "Passport, visa and insurance status", path: "/profile/documents" },
  { icon: Stamp, label: "Visa info", desc: "Requirements by destination", path: "/visa" },
  { icon: Heart, label: "Travel Preferences", desc: "Style, pace & interests", path: "/profile/preferences" },
  { icon: UserRound, label: "Saved Travelers", desc: "Companions & family", path: "/profile/travelers" },
  { icon: CreditCard, label: "Payment Methods", desc: "Cards & wallets", path: "/profile/payments" },
  { icon: Calendar, label: "Booking History", desc: "All past reservations", path: "/booking" },
  { icon: MapPin, label: "Saved Itineraries", desc: "Your trip collection", path: "/itinerary" },
  { icon: Sparkles, label: "AI Trip History", desc: "Generated itineraries", path: "/itinerary" },
  { icon: Bell, label: "Notifications", desc: "Alerts & reminders", path: "/notifications" },
  { icon: Shield, label: "Privacy & Security", desc: "Account protection", path: "/profile/security" },
  { icon: Database, label: "Privacy & Data", desc: "Export or delete your data", path: "/profile/privacy" },
  { icon: Settings, label: "Settings", desc: "App preferences", path: "/profile/settings" },
  { icon: LifeBuoy, label: "Help", desc: "FAQ and contact Icon Holiday", path: "/help" },
  { icon: LayoutDashboard, label: "Admin Dashboard", desc: "Manage app content (CMS)", path: "/dashboard" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [tripCount, setTripCount] = useState(0);
  const [upcoming, setUpcoming] = useState(0);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const load = async () => {
      const me = await backend.auth.me();
      setUser(me);
      
      const trips = await backend.entities.Trip.list("-created_at", 100);
      setTripCount(trips.length);
      setUpcoming(trips.filter((t) => ["upcoming", "prep"].includes(tripPhase(t))).length);

      const bookings = await backend.entities.Booking.list("-created_at", 200);
      setPoints(memberPoints(bookings));
    };
    load();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Profile" />

      {/* Digital member card (12.1–12.3) and membership overview (12.6). */}
      <div className="px-6 mb-6 space-y-3">
        <div className="animate-rise relative overflow-hidden rounded-hero bg-card p-5 shadow-float">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent/10 blur-2xl" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex h-1.5">
            <span className="flex-1 bg-accent" /><span className="flex-1 bg-highlight" />
          </div>
          <div className="relative flex items-start justify-between gap-3">
            <BrandMark className="[&_img]:w-24" />
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-strong">Icon Member</span>
          </div>
          <div className="relative mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Member</p>
              <h2 className="truncate text-xl font-bold text-foreground">{user?.full_name || "Traveler"}</h2>
              <p className="mt-0.5 font-mono text-sm font-semibold tracking-wider text-body">{memberNumber(user?.email)}</p>
            </div>
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-xl font-bold text-white" aria-hidden="true">
              {user?.full_name?.[0] || "M"}
            </span>
          </div>
          <Barcode value={memberNumber(user?.email)} />
        </div>

        <div className="stagger grid grid-cols-3 gap-3">
          {[["Trips", tripCount], ["Upcoming", upcoming], ["Points", points]].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-2xl bg-card p-3 text-center shadow-card">
              <p className="stat-value text-xl font-bold text-foreground"><CountUp value={value} /></p>
              <p className="text-[11px] font-semibold text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 space-y-3 stagger">
        {menuItems.map(({ icon: Icon, label, desc, path }) => (
          <Link key={label} to={path} className="block press">
            <GlassCard className="p-4 flex items-center gap-4 hover:bg-surface transition-all lift">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-accent-strong" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">{label}</h3>
                <p className="text-[10px] text-muted">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="px-6 mt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-card shadow-card rounded-2xl text-sm font-medium text-accent-strong hover:text-accent-strong transition-all lift"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
/**
 * The member card's barcode. Bars are derived from the member number so each
 * card is distinct; the spec does not define scanning, so it is a visual ID.
 */
function Barcode({ value = "" }) {
  const bars = [];
  let x = 0;
  for (const ch of `*${value}*`) {
    const code = ch.charCodeAt(0);
    for (let i = 0; i < 4; i++) {
      const w = ((code >> i) & 1) + 1;
      if (i % 2 === 0) bars.push(<rect key={x} x={x} y="0" width={w} height="34" />);
      x += w + 1;
    }
  }
  return (
    <svg role="img" aria-label={`Member barcode ${value}`} viewBox={`0 0 ${x} 34`} preserveAspectRatio="none" className="relative mt-4 h-10 w-full fill-foreground">
      {bars}
    </svg>
  );
}
