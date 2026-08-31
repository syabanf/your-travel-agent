import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, CalendarDays, Star } from "lucide-react";
import { backend } from "@/api/backend";
import { formatIDR } from "@/lib/currency";
import { packageDiscount } from "@/data/packageCategories";

// Ready-made holiday packages the traveller can buy — curated on the dashboard.
export default function HolidayPackages() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    backend.entities.TourPackage.list("-created_date", 20)
      .then((rows) => setItems((rows || []).filter((p) => p.status !== "draft").slice(0, 8)))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="px-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="eyebrow text-sm font-semibold text-ich-primary tracking-wide uppercase">
          Holiday Packages
        </h2>
        <Link to="/packages" className="text-xs text-gold flex items-center gap-1 press-spring">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3.5 overflow-x-auto hide-scrollbar -mx-6 px-6 pb-1 stagger">
        {items.map((p) => {
          const off = packageDiscount(p);
          return (
            <Link key={p.id} to={`/packages/${p.id}`} className="block press-spring group flex-shrink-0">
              <div className="w-[210px] card-modern rounded-3xl overflow-hidden shadow-soft hover:shadow-lift transition-shadow">
                <div className="relative h-28">
                  <img
                    src={p.image}
                    alt={p.title}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="w-full h-full object-cover img-zoom"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ich-primary/60 to-transparent" />
                  {off != null && (
                    <span className="absolute top-2 left-2 chip-glass !bg-ich-gold/90 !border-white/30">{off}% off</span>
                  )}
                  {p.rating > 0 && (
                    <span className="absolute bottom-2 right-2 chip-glass">
                      <Star className="w-2.5 h-2.5 fill-white" />{Number(p.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-ich-primary line-clamp-1">{p.title}</h3>
                  <p className="text-[11px] text-ich-neutral/60 truncate mt-0.5 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />{p.duration_days}D/{p.duration_nights}N · {p.destination}
                  </p>
                  <p className="mt-1.5">
                    <span className="stat-value text-sm font-display font-bold text-gold">{formatIDR(p.price)}</span>
                    <span className="text-[10px] text-ich-neutral/60"> /person</span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
