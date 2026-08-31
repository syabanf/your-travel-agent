import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { backend } from "@/api/backend";
import OLMap from "../components/OLMap";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { formatIDR } from "@/lib/currency";
import { destImages } from "@/lib/destinationImages";
import { MapPin, Plane, Sparkles, CalendarSearch } from "lucide-react";

export default function DestinationDetail() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    backend.entities.Destination.filter({ id }).then((r) => { setD(r[0] || null); setLoading(false); setIdx(0); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div>
  );
  if (!d) return (
    <div className="animate-fade-in"><PageHeader title="Not found" showBack /><p className="px-6 text-sm text-ich-neutral/70">This destination is no longer available.</p></div>
  );

  const vibes = Array.isArray(d.vibes) ? d.vibes : [];
  const gallery = destImages(d);
  const active = Math.min(idx, Math.max(0, gallery.length - 1));

  return (
    <div className="animate-fade-in pb-28">
      {/* Hero gallery */}
      <div className="relative h-72 bg-ich-primary">
        {gallery.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={d.name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === active ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute top-0 left-0 right-0"><PageHeader showBack title="" /></div>
        {gallery.length > 1 && (
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % gallery.length)}
            className="absolute top-16 left-0 right-0 bottom-28"
            aria-label="Next photo"
          />
        )}
        {d.fromPrice > 0 && (
          <div className="absolute top-16 right-4 glass-light px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Plane className="w-3 h-3 text-gold flex-shrink-0" />
            <span className="stat-value text-[11px] font-semibold text-ich-primary whitespace-nowrap">from {formatIDR(d.fromPrice)}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {gallery.length > 1 && (
            <div className="flex gap-1.5 mb-3">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-2 bg-white/40"}`}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          )}
          {d.tagline && <p className="text-[11px] text-[#F0B7B9] tracking-widest uppercase mb-1">{d.tagline}</p>}
          <h1 className="text-3xl font-display font-bold text-white text-shadow-soft leading-tight">{d.name}</h1>
          <p className="text-sm text-white/85 flex items-center gap-1.5 mt-1"><MapPin className="w-3.5 h-3.5 text-gold" />{d.country}</p>
        </div>
      </div>

      <div className="px-6 -mt-4 relative z-10 space-y-4">
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-ich-primary mb-2">About {d.name}</h2>
          <p className="text-sm text-ich-neutral leading-relaxed">
            {d.tagline ? `${d.name} — ${d.tagline.toLowerCase()}. ` : ""}
            A favorite among Icon Holiday travelers, {d.name} blends {vibes.slice(0, 3).map((v) => v.toLowerCase()).join(", ") || "unforgettable experiences"} into one trip. Tap below and let the concierge craft a day-by-day plan.
          </p>
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {vibes.map((v) => (
                <span key={v} className="text-[11px] font-medium text-gold bg-ich-gold/10 border border-ich-gold/20 px-2.5 py-1 rounded-full">{v}</span>
              ))}
            </div>
          )}
        </GlassCard>

        {d.lat != null && d.lng != null && (
          <GlassCard className="overflow-hidden p-0">
            <div className="h-40">
              <OLMap center={[d.lng, d.lat]} zoom={6} markers={[{ id: d.id, lng: d.lng, lat: d.lat }]} interactive={false} />
            </div>
          </GlassCard>
        )}

        <Link to={`/assistant/ai?destination=${encodeURIComponent(d.name)}`} className="w-full py-3.5 btn-primary rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" /> Plan a trip to {d.name}
        </Link>
        <Link to="/ota" className="w-full py-3.5 glass-light rounded-2xl text-sm font-medium text-ich-primary flex items-center justify-center gap-2 hover:bg-ich-primary/5 transition-colors">
          <CalendarSearch className="w-4 h-4 text-gold" /> Browse flights & stays
        </Link>
      </div>
    </div>
  );
}
