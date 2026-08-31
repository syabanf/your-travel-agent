import { useState, useEffect, useCallback } from "react";
import { backend } from "@/api/backend";
import { Plus, Map, Calendar, Wallet, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import TripCard from "../components/itinerary/TripCard";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { isPlan } from "@/data/tripKinds";

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  // Proposals live in their own tab — they aren't booked trips and shouldn't
  // sit in the same list as ones that are.
  { id: "plans", label: "Plans" },
  { id: "draft", label: "Drafts" },
  { id: "past", label: "Past" },
];

const quickLinks = [
  { icon: Calendar, label: "Calendar", path: "/itinerary/calendar" },
  { icon: Map, label: "Map View", path: "/itinerary/map" },
  { icon: Wallet, label: "Budget", path: "/itinerary/budget" },
  { icon: CheckSquare, label: "Checklist", path: "/itinerary/checklist" },
];

export default function Itinerary() {
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);

  const loadTrips = useCallback(async () => {
    setError(false);
    try {
      const data = await backend.entities.Trip.list("-created_at", 50);
      setTrips(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleTouchStart = (e) => {
    if (e.currentTarget.scrollTop === 0) setStartY(e.touches[0].clientY);
  };
  const handleTouchEnd = async (e) => {
    if (startY === null) return;
    const delta = e.changedTouches[0].clientY - startY;
    setStartY(null);
    if (delta > 70 && !refreshing) {
      setRefreshing(true);
      await loadTrips();
      setRefreshing(false);
    }
  };

  const filteredTrips = trips
    .filter((trip) => {
      // Plans are excluded from every other tab, so a proposal never reads as
      // a trip that's going ahead.
      if (activeTab !== "plans" && isPlan(trip)) return false;
      switch (activeTab) {
        case "plans": return isPlan(trip);
        case "upcoming": return trip.status === "planned";
        case "active": return trip.status === "active";
        case "draft": return trip.status === "draft";
        case "past": return trip.status === "completed";
        default: return true;
      }
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="animate-fade-in pb-28" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {refreshing && (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" />
        </div>
      )}
      <PageHeader
        title="My Itineraries"
        subtitle="Plan & manage your journeys"
        rightAction={
          <Link 
            to="/itinerary/wizard"
            className="w-10 h-10 glass-gold rounded-xl flex items-center justify-center text-gold hover:glow-gold transition-all"
          >
            <Plus className="w-5 h-5" />
          </Link>
        }
      />

      {/* Quick Links */}
      <div className="flex gap-3 px-6 mb-6 overflow-x-auto hide-scrollbar">
        {quickLinks.map(({ icon: Icon, label, path }) => (
          <Link key={path} to={path}>
            <GlassCard className="flex items-center gap-2.5 px-4 py-3 whitespace-nowrap">
              <Icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
              <span className="text-xs text-ich-primary font-medium">{label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* My Itineraries Section */}
      {!loading && trips.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-xs font-semibold text-ich-primary uppercase tracking-widest mb-3">My Itineraries</h2>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {trips.filter((t) => !isPlan(t)).slice(0, 5).map((trip) => (
              <Link key={trip.id} to={`/itinerary/${trip.id}`} className="press block">
                <div className="flex-shrink-0 glass-light rounded-xl p-3 min-w-[140px] hover:bg-ich-primary/5 transition-all">
                 <p className="text-xs font-semibold text-ich-primary truncate">{trip.title}</p>
                 <p className="text-[10px] text-ich-neutral mt-1">{trip.destination}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full capitalize ${
                      trip.status === "active" ? "bg-emerald-500/20 text-emerald-600" :
                      trip.status === "planned" ? "bg-blue-500/20 text-blue-400" :
                      trip.status === "completed" ? "bg-slate-500/20 text-slate-400" :
                      "bg-ich-gold/20 text-gold"
                    }`}>{trip.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-6 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`px-4 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 press-spring transition-colors ${
              activeTab === tab.id ? "btn-primary text-white" : "glass-light text-ich-neutral"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trip List */}
      {loading ? (
        <div className="px-6">
          <SkeletonRows rows={4} />
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load itineraries"
          hint="Please check your connection and try again."
          onRetry={loadTrips}
        />
      ) : filteredTrips.length === 0 && trips.length > 0 ? (
        <EmptyState
          icon={Map}
          title="No trips found"
          hint={`Nothing under "${tabs.find((t) => t.id === activeTab)?.label}". Try another filter to see your other trips.`}
        />
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No trips found"
          hint="Create your first itinerary to get started"
          action={
            <Link
              to="/itinerary/wizard"
              className="press inline-flex items-center gap-2 px-5 py-2.5 glass-gold rounded-xl text-xs text-gold font-medium hover:glow-gold transition-all"
            >
              <Plus className="w-4 h-4" /> New Itinerary
            </Link>
          }
        />
      ) : (
        <div className="px-6 space-y-4 stagger">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}