import { useState, useEffect } from "react";
import { backend } from "@/api/backend";
import { Gift, ChevronRight, LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import QuickActions from "../components/home/QuickActions";
import ActiveTrip from "../components/home/ActiveTrip";
import FeaturedDestinations from "../components/home/FeaturedDestinations";
import ConciergeOffer from "../components/home/ConciergeOffer";
import RecentBookings from "../components/home/RecentBookings";
import HolidayPackages from "../components/home/HolidayPackages";
import Skeleton, { SkeletonRows } from "@/components/Skeletons";

export default function Home() {
  const { isGuest } = useAuth();
  const [user, setUser] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await backend.auth.me();
        setUser(me);
        
        const trips = await backend.entities.Trip.list("-created_at", 5);
        const active = trips.find(t => t.status === "active") || trips.find(t => t.status === "planned") || trips[0];
        setActiveTrip(active);
        
        const recentBookings = await backend.entities.Booking.list("-created_at", 3);
        setBookings(recentBookings);
      } catch {
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
        const trips = await backend.entities.Trip.list("-created_at", 5);
        const active = trips.find(t => t.status === "active") || trips.find(t => t.status === "planned") || trips[0];
        setActiveTrip(active);
        const recentBookings = await backend.entities.Booking.list("-created_at", 3);
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
        <h1 className="text-3xl font-display font-semibold text-foreground mb-3">Welcome to Icon Holiday</h1>
        <p className="text-muted mb-8">Sign in to plan your next adventure</p>
        <Link
          to="/login"
          className="px-6 py-3 bg-accent-soft rounded-xl text-accent-strong font-medium hover:shadow-glow transition-all"
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
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      )}
      {/* Greeting */}
      <div className="px-6 pt-4 pb-2">
        <p className="text-xs text-accent-strong tracking-[0.2em] uppercase mb-1">{greeting()}</p>
        <h1 className="text-[28px] leading-none font-display font-bold text-foreground pb-1">
          {isGuest ? "Welcome" : user?.full_name?.split(" ")[0] || "Traveler"}<span className="text-accent">.</span>
        </h1>
      </div>

      {/* Guests see the catalog without member content (1.3). */}
      {isGuest && (
        <div className="px-6 pt-2">
          <div className="flex items-center gap-3 rounded-card bg-card p-4 shadow-card">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-body">
              <span className="block text-sm font-semibold text-foreground">You're browsing as a guest</span>
              Sign in as a member to see package prices and your trips.
            </p>
            <Link to="/login" className="sheen shrink-0 rounded-full bg-accent-strong px-4 py-2 text-xs font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark">
              Sign in
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-8 pt-4 stagger">
        <QuickActions />
        <Link to="/promotions" className="block px-6 press-spring">
          <div className="flex items-center gap-3.5 rounded-card bg-card p-4 shadow-card transition-colors hover:bg-surface-2 lift">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Gift className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">What&apos;s New</p>
              <p className="text-xs text-muted">Promotions, events & travel news</p>
            </div>
            <ChevronRight className="size-5 text-muted" aria-hidden="true" />
          </div>
        </Link>
        {!isGuest && <ActiveTrip trip={activeTrip} />}
        <HolidayPackages />
        <FeaturedDestinations />
        <ConciergeOffer />
        {!isGuest && <RecentBookings bookings={bookings} />}
      </div>
    </div>
  );
}