import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Map, Calendar, DollarSign, CheckSquare, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import TripCard from "../components/itinerary/TripCard";

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Drafts" },
  { id: "past", label: "Past" },
];

const quickLinks = [
  { icon: Calendar, label: "Calendar", path: "/itinerary/calendar" },
  { icon: Map, label: "Map View", path: "/itinerary/map" },
  { icon: DollarSign, label: "Budget", path: "/itinerary/budget" },
  { icon: CheckSquare, label: "Checklist", path: "/itinerary/checklist" },
];

export default function Itinerary() {
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.Trip.list("-created_date", 50);
      setTrips(data);
      setLoading(false);
    };
    load();
  }, []);

  const filteredTrips = trips.filter((trip) => {
    switch (activeTab) {
      case "upcoming": return trip.status === "planned";
      case "active": return trip.status === "active";
      case "draft": return trip.status === "draft";
      case "past": return trip.status === "completed";
      default: return true;
    }
  });

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="My Itineraries" 
        subtitle="Plan & manage your journeys"
        showNotification
        rightAction={
          <Link 
            to="/itinerary/new"
            className="w-10 h-10 glass-gold rounded-xl flex items-center justify-center text-gold hover:glow-gold transition-all"
          >
            <Plus className="w-5 h-5" />
          </Link>
        }
      />

      {/* Quick Links */}
      <div className="flex gap-2.5 px-6 mb-5 overflow-x-auto hide-scrollbar">
        {quickLinks.map(({ icon: Icon, label, path }) => (
          <Link key={path} to={path}>
            <GlassCard className="flex items-center gap-2 px-3.5 py-2.5 whitespace-nowrap">
              <Icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
              <span className="text-xs text-mora-white/80 font-medium">{label}</span>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? "glass-gold text-gold"
                : "text-mora-neutral/60 hover:text-mora-neutral"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trip List */}
      <div className="px-6 space-y-3.5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Map className="w-10 h-10 text-mora-neutral/30 mx-auto mb-3" />
            <p className="text-sm text-mora-neutral/60 mb-1">No trips found</p>
            <p className="text-xs text-mora-neutral/40">Create your first itinerary to get started</p>
            <Link 
              to="/itinerary/new"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 glass-gold rounded-xl text-xs text-gold font-medium hover:glow-gold transition-all"
            >
              <Plus className="w-4 h-4" /> New Itinerary
            </Link>
          </GlassCard>
        ) : (
          filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))
        )}
      </div>
    </div>
  );
}