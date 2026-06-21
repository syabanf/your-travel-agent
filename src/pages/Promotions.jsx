import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { formatIDR } from "@/lib/currency";
import { MapPin, ArrowRight } from "lucide-react";
import moment from "moment";

const Img = (props) => <img {...props} onError={(e) => { e.currentTarget.style.display = "none"; }} />;
const Section = ({ title, children }) => (
  <div>
    <h2 className="text-sm font-semibold text-mora-primary uppercase tracking-wide mb-3">{title}</h2>
    <div className="space-y-3">{children}</div>
  </div>
);

export default function Promotions() {
  const [items, setItems] = useState(null);

  useEffect(() => { base44.entities.Promotion.list("-created_date", 50).then(setItems); }, []);

  const featured = items?.find((p) => p.featured);
  const promos = items?.filter((p) => p.type === "promo" && !p.featured) || [];
  const events = items?.filter((p) => p.type === "event") || [];
  const news = items?.filter((p) => p.type === "news") || [];

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="What's New" subtitle="Promotions, events & news" showBack />

      {items == null ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-mora-neutral/60 py-16 px-6">Nothing new right now — check back soon.</p>
      ) : (
        <div className="px-6 space-y-6">
          {featured && (
            <Link to={`/promotions/${featured.id}`} className="block relative rounded-2xl overflow-hidden h-48 bg-mora-primary">
              <Img src={featured.image} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              {featured.discount ? <span className="absolute top-3 left-3 bg-mora-gold text-white text-xs font-bold px-2.5 py-1 rounded-full">{featured.discount}% OFF</span> : null}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-xl font-display font-bold text-white text-shadow-soft">{featured.title}</h2>
                <p className="text-xs text-white/80 mt-1 line-clamp-2">{featured.description}</p>
                <span className="mt-3 btn-primary rounded-lg px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5">
                  {featured.cta || "View offer"} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          )}

          {promos.length > 0 && (
            <Section title="Promotions">
              {promos.map((p) => (
                <Link key={p.id} to={`/promotions/${p.id}`} className="block">
                  <GlassCard className="p-3 flex gap-3 hover:bg-white/10 transition-all">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-mora-primary/5 flex-shrink-0">{p.image && <Img src={p.image} alt={p.title} className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-mora-primary truncate">{p.title}</h3>
                      <p className="text-xs text-mora-neutral/70 line-clamp-2 mt-0.5">{p.description}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        {p.valid_until ? <span className="text-[10px] text-gold">Until {moment(p.valid_until).format("MMM D")}</span> : <span />}
                        {p.price ? <span className="text-sm font-semibold text-gold">{formatIDR(p.price)}</span> : null}
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </Section>
          )}

          {events.length > 0 && (
            <Section title="Upcoming Events">
              {events.map((e) => (
                <Link key={e.id} to={`/promotions/${e.id}`} className="block">
                  <GlassCard className="p-4 flex gap-3 items-center hover:bg-white/10 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-mora-gold/10 flex flex-col items-center justify-center text-gold flex-shrink-0">
                      <span className="text-[9px] uppercase tracking-wide">{moment(e.date).format("MMM")}</span>
                      <span className="text-lg font-display font-bold leading-none">{moment(e.date).format("D")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-mora-primary truncate">{e.title}</h3>
                      {e.location && <p className="text-xs text-mora-neutral/60 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{e.location}</p>}
                      <p className="text-xs text-mora-neutral/60 mt-0.5 line-clamp-1">{e.description}</p>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </Section>
          )}

          {news.length > 0 && (
            <Section title="News & Info">
              {news.map((n) => (
                <Link key={n.id} to={`/promotions/${n.id}`} className="block">
                  <GlassCard className="p-4 hover:bg-white/10 transition-all">
                    <h3 className="text-sm font-semibold text-mora-primary">{n.title}</h3>
                    <p className="text-xs text-mora-neutral/70 mt-1">{n.description}</p>
                  </GlassCard>
                </Link>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
