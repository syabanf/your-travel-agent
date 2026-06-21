import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import GlassCard from "../GlassCard";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function FeaturedDestinations() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    base44.entities.Destination.list("created_date", 8)
      .then((rows) => setDestinations((rows || []).filter((d) => d.active !== false)))
      .catch(() => {});
  }, []);

  if (destinations.length === 0) return null;

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-mora-primary tracking-wide uppercase">
          Featured Destinations
        </h2>
        <Link to="/itinerary/wizard" className="text-xs text-gold flex items-center gap-1">
          Explore <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-1">
        {destinations.map((dest) => (
          <Link key={dest.id} to={`/destination/${dest.id}`}>
            <GlassCard className="min-w-[140px] overflow-hidden flex-shrink-0">
              <div className="relative h-40">
                <img
                  src={dest.image}
                  alt={dest.name}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-mora-primary/95 via-mora-primary/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[10px] text-[#F0B7B9] tracking-widest uppercase mb-0.5">{dest.tagline}</p>
                  <h3 className="text-sm font-display font-semibold text-white text-shadow-soft">{dest.name}</h3>
                  <p className="text-[10px] text-white/70">{dest.country}</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
