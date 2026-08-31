import { useState, useEffect, useMemo, useRef } from "react";
import { backend } from "@/api/backend";
import { Link } from "react-router-dom";
import { Search, MapPin, Tag, Star, Globe } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { SkeletonRows } from "@/components/Skeletons";
import { destCover } from "@/lib/destinationImages";

const norm = (v) => (v == null ? "" : String(v).toLowerCase());

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [dest, promo, exp] = await Promise.all([
        backend.entities.Destination.list("name", 100),
        backend.entities.Promotion.list("-created_at", 100),
        backend.entities.PersonalAssistant.list("-rating", 100),
      ]);
      setDestinations(dest);
      setPromotions(promo);
      setExperts(exp);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return { destinations: [], promotions: [], experts: [] };
    return {
      destinations: destinations.filter(
        (d) => norm(d.name).includes(q) || norm(d.country).includes(q) || norm(d.tagline).includes(q)
      ),
      promotions: promotions.filter(
        (p) => norm(p.title).includes(q) || norm(p.description).includes(q) || norm(p.location).includes(q)
      ),
      experts: experts.filter(
        (e) => norm(e.name).includes(q) || norm(e.specialization).includes(q) || norm(e.languages?.join(" ")).includes(q)
      ),
    };
  }, [q, destinations, promotions, experts]);

  const total = results.destinations.length + results.promotions.length + results.experts.length;

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Search" showBack />

      <div className="px-6">
        <div className="relative">
          <Search className="w-4 h-4 text-ich-neutral/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations, deals & experts"
            aria-label="Search"
            className="w-full glass-light rounded-xl pl-11 pr-4 py-3 text-sm text-ich-primary placeholder:text-ich-neutral/50 outline-none focus:ring-1 focus:ring-ich-gold/40"
          />
        </div>
      </div>

      <div className="px-6 mt-6">
        {error ? (
          <ErrorState
            title="Couldn't load search"
            hint="Please check your connection and try again."
            onRetry={load}
          />
        ) : loading ? (
          <SkeletonRows rows={5} />
        ) : !q ? (
          <EmptyState
            icon={Search}
            title="Search Icon Holiday"
            hint="Find destinations, deals & experts"
          />
        ) : total === 0 ? (
          <EmptyState
            icon={Search}
            title="No results"
            hint={`Nothing matched "${query.trim()}". Try a different search.`}
          />
        ) : (
          <div className="space-y-8">
            {results.destinations.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-ich-primary uppercase tracking-widest mb-3">Destinations</h2>
                <div className="space-y-3 stagger">
                  {results.destinations.map((d) => {
                    const cover = destCover(d);
                    return (
                      <Link key={d.id} to={`/destination/${d.id}`} className="block press">
                        <GlassCard className="p-4 flex items-center gap-3.5 hover:bg-white/10 transition-all">
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-ich-gold/10 flex items-center justify-center">
                            {cover ? (
                              <img src={cover} alt={d.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <MapPin className="w-5 h-5 text-gold" strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-ich-primary truncate">{d.name}</h3>
                            <p className="text-xs text-ich-neutral mt-0.5 truncate">{d.country || d.tagline}</p>
                          </div>
                        </GlassCard>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {results.promotions.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-ich-primary uppercase tracking-widest mb-3">Promotions</h2>
                <div className="space-y-3 stagger">
                  {results.promotions.map((p) => (
                    <Link key={p.id} to={`/promotions/${p.id}`} className="block press">
                      <GlassCard className="p-4 flex items-center gap-3.5 hover:bg-white/10 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-ich-gold/10 flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt={p.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          ) : (
                            <Tag className="w-5 h-5 text-gold" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-ich-primary truncate">{p.title}</h3>
                          {p.location && <p className="text-xs text-ich-neutral mt-0.5 truncate">{p.location}</p>}
                        </div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {results.experts.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-ich-primary uppercase tracking-widest mb-3">Experts</h2>
                <div className="space-y-3 stagger">
                  {results.experts.map((e) => (
                    <Link key={e.id} to={`/assistant/profile/${e.id}`} className="block press">
                      <GlassCard className="p-4 flex items-center gap-3.5 hover:bg-white/10 transition-all">
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gold/15 flex items-center justify-center">
                          {e.photo_url ? (
                            <img src={e.photo_url} alt={e.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-display text-gold">{e.name?.[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-ich-primary truncate">{e.name}</h3>
                          <p className="text-xs text-ich-neutral mt-0.5 truncate">{e.specialization}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {e.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-gold">
                                <Star className="w-3 h-3 fill-current" /> {e.rating}
                              </span>
                            )}
                            {e.languages?.length > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-ich-neutral truncate">
                                <Globe className="w-3 h-3 flex-shrink-0" /> {e.languages.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
