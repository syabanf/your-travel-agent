import { ChevronRight } from "lucide-react";
import GlassCard from "../GlassCard";
import { Link } from "react-router-dom";

const destinations = [
  { name: "Bali", country: "Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80", tagline: "Island Paradise" },
  { name: "Kyoto", country: "Japan", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80", tagline: "Ancient Beauty" },
  { name: "Santorini", country: "Greece", image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&q=80", tagline: "Aegean Charm" },
  { name: "Maldives", country: "Indian Ocean", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80", tagline: "Overwater Luxury" },
];

export default function FeaturedDestinations() {
  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-mora-white/90 tracking-wide uppercase">
          Featured Destinations
        </h2>
        <button className="text-xs text-gold flex items-center gap-1">
          Explore <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-1">
        {destinations.map((dest) => (
          <Link
            key={dest.name}
            to={`/assistant/ai?destination=${encodeURIComponent(dest.name)}`}
          >
            <GlassCard className="min-w-[140px] overflow-hidden flex-shrink-0">
              <div className="relative h-40">
                <img 
                  src={dest.image} 
                  alt={dest.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-mora-primary/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[10px] text-gold tracking-widest uppercase mb-0.5">
                    {dest.tagline}
                  </p>
                  <h3 className="text-sm font-display font-semibold text-mora-white">{dest.name}</h3>
                  <p className="text-[10px] text-mora-neutral/70">{dest.country}</p>
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}