import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import QuickActions from "../components/home/QuickActions";
import ActiveTrip from "../components/home/ActiveTrip";
import FeaturedDestinations from "../components/home/FeaturedDestinations";
import ConciergeOffer from "../components/home/ConciergeOffer";
import RecentBookings from "../components/home/RecentBookings";
import Skeleton, { SkeletonRows } from "@/components/Skeletons";

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        
        const trips = await base44.entities.Trip.list("-created_date", 5);
        const active = trips.find(t => t.status === "active") || trips.find(t => t.status === "planned") || trips[0];
        setActiveTrip(active);
        
        const recentBookings = await base44.entities.Booking.list("-created_date", 3);
        setBookings(recentBookings);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleTouchStart = (e) => {
    if (e.currentTarget.scrollTop === 0) setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = async (e) => {
    if (startY === null) return;
    const delta = e.changedTouches[0].clientY - startY;
    setStartY(null);
    if (delta > 70 && !refreshing && user) {
      setRefreshing(true);
      try {
        const trips = await base44.entities.Trip.list("-created_date", 5);
        const active = trips.find(t => t.status === "active") || trips.find(t => t.status === "planned") || trips[0];
        setActiveTrip(active);
        const recentBookings = await base44.entities.Booking.list("-created_date", 3);
        setBookings(recentBookings);
      } finally {
        setRefreshing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="px-6 pt-4 pb-2 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-36" />
        </div>
        <div className="px-6 space-y-8 pt-6">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <SkeletonRows rows={3} />
        </div>
      </div>
    );
  }

  // Guest mode
  if (!user) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-3xl font-display font-semibold text-mora-primary mb-3">Welcome to MORA</h1>
        <p className="text-mora-neutral mb-8">Sign in to plan your next adventure</p>
        <Link
          to="/login"
          className="px-6 py-3 glass-gold rounded-xl text-gold font-medium hover:glow-gold transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {refreshing && user && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        </div>
      )}
      {/* Greeting */}
      <div className="px-6 pt-4 pb-2">
        <p className="text-xs text-gold tracking-[0.2em] uppercase mb-1">{greeting()}</p>
        <h1 className="text-[28px] leading-none font-display font-bold text-gradient pb-1">
          {user?.full_name?.split(" ")[0] || "Traveler"}
        </h1>
      </div>

      <div className="space-y-8 pt-4 stagger">
        <QuickActions />
        <Link to="/promotions" className="block px-6 press-spring">
          <div className="relative overflow-hidden rounded-3xl btn-primary p-4 flex items-center gap-3.5 shadow-lift">
            <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full blur-2xl" style={{ background: "rgba(255,255,255,0.12)" }} />
            <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/30" style={{ background: "rgba(255,255,255,0.18)" }}>
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="relative flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">What's New</p>
              <p className="text-xs text-white/80">Promotions, events & travel news</p>
            </div>
            <ChevronRight className="relative w-5 h-5 text-white/90" />
          </div>
        </Link>
        <ActiveTrip trip={activeTrip} />
        <FeaturedDestinations />
        <ConciergeOffer />
        <RecentBookings bookings={bookings} />
      </div>
    </div>
  );
}