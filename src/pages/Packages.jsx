import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/PageHeader";
import Skeleton from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { formatIDR } from "@/lib/currency";
import { PACKAGE_CATEGORIES, categoryLabel, packageDiscount } from "@/data/packageCategories";
import { MapPin, CalendarDays, Star, Package as PackageIcon, Users } from "lucide-react";

const Img = (props) => <img {...props} onError={(e) => { e.currentTarget.style.display = "none"; }} />;

function PriceTag({ pkg, className = "" }) {
  const off = packageDiscount(pkg);
  return (
    <div className={className}>
      {off != null && (
        <span className="block text-[11px] text-mora-neutral/50 line-through leading-none">{formatIDR(pkg.price_before)}</span>
      )}
      <span className="stat-value text-base font-display font-bold text-gold">{formatIDR(pkg.price)}</span>
      <span className="text-[10px] text-mora-neutral/60"> /person</span>
    </div>
  );
}

export default function Packages() {
  const [items, setItems] = useState(null);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    base44.entities.TourPackage.list("-created_date", 100)
      .then((rows) => setItems((rows || []).filter((p) => p.status !== "draft")))
      .catch(() => setItems([]));
  }, []);

  // Only show category chips that actually have packages behind them.
  const chips = useMemo(() => {
    if (!items) return [];
    const present = new Set(items.map((p) => p.category));
    return [{ value: "all", label: "All" }, ...PACKAGE_CATEGORIES.filter((c) => present.has(c.value))];
  }, [items]);

  const shown = useMemo(
    () => (items || []).filter((p) => cat === "all" || p.category === cat),
    [items, cat]
  );
  const featured = cat === "all" ? shown.find((p) => p.featured) : null;
  const rest = shown.filter((p) => p !== featured);

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Holiday Packages" subtitle="Ready-made trips, one tap to book" showBack />

      {items == null ? (
        <div className="px-6 space-y-4">
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={PackageIcon} title="No packages yet" hint="New holiday packages will appear here as soon as they go on sale." />
      ) : (
        <>
          {/* Category chips */}
          {chips.length > 2 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar px-6 pb-4">
              {chips.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCat(c.value)}
                  className={`px-4 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap shrink-0 press-spring transition-colors ${
                    cat === c.value ? "btn-primary text-white" : "glass-light text-mora-neutral"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <div className="px-6 space-y-4 stagger">
            {/* Featured */}
            {featured && (
              <Link to={`/packages/${featured.id}`} className="block press-spring group">
                <div className="relative h-52 rounded-3xl overflow-hidden shadow-lift">
                  <Img src={featured.image} alt={featured.title} className="absolute inset-0 w-full h-full object-cover img-zoom" />
                  <div className="absolute inset-0 bg-gradient-to-t from-mora-primary via-mora-primary/35 to-transparent" />
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="chip-glass">Featured</span>
                    {packageDiscount(featured) != null && (
                      <span className="chip-glass !bg-mora-gold/90 !border-white/30">{packageDiscount(featured)}% off</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-xl font-display font-bold text-white text-shadow-soft">{featured.title}</h2>
                    <p className="text-xs text-white/80 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gold" />{featured.destination}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-gold" />{featured.duration_days}D / {featured.duration_nights}N</span>
                    </p>
                    <p className="mt-2 text-white">
                      <span className="stat-value text-lg font-display font-bold">{formatIDR(featured.price)}</span>
                      <span className="text-[11px] text-white/70"> /person</span>
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* The rest */}
            {rest.map((p) => {
              const off = packageDiscount(p);
              return (
                <Link key={p.id} to={`/packages/${p.id}`} className="block press-spring group">
                  <div className="card-modern rounded-3xl overflow-hidden flex gap-3.5 p-3 hover:shadow-lift transition-shadow">
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-mora-primary/5 flex-shrink-0">
                      <Img src={p.image} alt={p.title} className="w-full h-full object-cover img-zoom" />
                      {off != null && (
                        <span className="absolute top-1 left-1 bg-mora-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{off}%</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-mora-primary line-clamp-2">{p.title}</h3>
                        {p.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-gold font-semibold shrink-0">
                            <Star className="w-3 h-3 fill-gold" />{Number(p.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-mora-neutral/70 truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold shrink-0" />{p.destination}
                      </p>
                      <p className="text-[11px] text-mora-neutral/60 mt-0.5 flex items-center gap-2.5">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{p.duration_days}D/{p.duration_nights}N</span>
                        <span className="truncate">{categoryLabel(p.category)}</span>
                      </p>
                      <div className="flex items-end justify-between gap-2 mt-auto pt-1.5">
                        <PriceTag pkg={p} />
                        {p.slots_left > 0 && p.slots_left <= 5 && (
                          <span className="text-[10px] font-semibold text-red-600 flex items-center gap-1 shrink-0">
                            <Users className="w-3 h-3" />{p.slots_left} left
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {shown.length === 0 && (
              <EmptyState icon={PackageIcon} title="Nothing in this category" hint="Try another category to see more packages." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
