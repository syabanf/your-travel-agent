import { useEffect, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { backend } from "@/api/backend";
import { formatIDR } from "@/lib/currency";

export default function FeaturedDestinations() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    backend.entities.Destination.list("created_at", 8)
      .then((rows) => setDestinations((rows || []).filter((d) => d.active !== false)))
      .catch(() => {});
  }, []);

  if (destinations.length === 0) return null;

  const price = (p) => (typeof p === "number" ? formatIDR(p, { symbol: false }) : p);

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="eyebrow text-sm font-semibold text-ich-primary tracking-wide uppercase">
          Featured Destinations
        </h2>
        <Link to="/itinerary/wizard" className="text-xs text-gold flex items-center gap-1 press-spring">
          Explore <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3.5 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-1 stagger">
        {destinations.map((dest) => (
          <Link key={dest.id} to={`/destination/${dest.id}`} className="block press-spring group flex-shrink-0">
            <div className="relative w-[162px] h-52 rounded-3xl overflow-hidden shadow-lift">
              <img
                src={dest.image}
                alt={dest.name}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="w-full h-full object-cover img-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ich-primary/95 via-ich-primary/25 to-transparent" />
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
              {dest.fromPrice != null && dest.fromPrice !== "" && (
                <div className="absolute top-3 left-3 chip-glass">from {price(dest.fromPrice)}</div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <p className="text-[10px] text-[#F0B7B9] tracking-widest uppercase mb-0.5 truncate">{dest.tagline}</p>
                <h3 className="text-base font-display font-semibold text-white text-shadow-soft truncate">{dest.name}</h3>
                <p className="text-[11px] text-white/75 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gold" /> {dest.country}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
