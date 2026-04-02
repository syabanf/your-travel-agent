import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";
import QuickActions from "../components/home/QuickActions";
import ActiveTrip from "../components/home/ActiveTrip";
import FeaturedDestinations from "../components/home/FeaturedDestinations";
import ConciergeOffer from "../components/home/ConciergeOffer";
import RecentBookings from "../components/home/RecentBookings";

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gold tracking-widest uppercase mb-1">{greeting()}</p>
            <h1 className="text-2xl font-display font-semibold text-mora-white">
              {user?.full_name?.split(" ")[0] || "Traveler"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/itinerary"
              className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-mora-neutral/70 hover:text-gold transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link 
              to="/notifications"
              className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-mora-neutral/70 hover:text-gold transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-mora-gold rounded-full" />
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-8 pt-4">
        <QuickActions />
        <ActiveTrip trip={activeTrip} />
        <FeaturedDestinations />
        <ConciergeOffer />
        <RecentBookings bookings={bookings} />
      </div>
    </div>
  );
}