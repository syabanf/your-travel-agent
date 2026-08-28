import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";
import { MapPin, CalendarDays, Tag, Clock, ArrowRight, Check } from "lucide-react";
import moment from "moment";

const TYPE_LABEL = { promo: "Promotion", event: "Event", news: "News" };

function InfoCell({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-ich-gold/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-ich-neutral/60 uppercase tracking-wider">{label}</p>
        <p className="stat-value text-sm font-medium text-ich-primary truncate">{value}</p>
      </div>
    </div>
  );
}

export default function PromotionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Claim the offer: copy the promo code (if any) and head to the booking flow.
  const claim = async () => {
    if (item.promo_code) {
      try {
        await navigator.clipboard.writeText(item.promo_code);
        toast.success(`Code ${item.promo_code} copied — apply it at checkout`);
      } catch {
        toast.success(`Use code ${item.promo_code} at checkout`);
      }
    } else {
      toast.success(item.type === "event" ? "Saved to your events" : "Offer applied");
    }
    if (item.type !== "event") navigate("/ota");
  };

  useEffect(() => {
    base44.entities.Promotion.filter({ id }).then((r) => { setItem(r[0] || null); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div>
  );
  if (!item) return (
    <div className="animate-fade-in"><PageHeader title="Not found" showBack /><p className="px-6 text-sm text-ich-neutral/70">This item is no longer available.</p></div>
  );

  const isEvent = item.type === "event";
  const perks = isEvent
    ? ["Entry as per ticket tier", "Schedule & venue details in-app", "Free cancellation up to 48h before"]
    : ["Instant confirmation", "Best-price guarantee", "Free changes on most bookings"];

  return (
    <div className="animate-fade-in pb-28">
      {/* Hero */}
      <div className="relative h-56 bg-ich-primary">
        {item.image && <img src={item.image} alt={item.title} onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute top-0 left-0 right-0"><PageHeader showBack title="" /></div>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-full">{TYPE_LABEL[item.type] || "Offer"}</span>
            {item.discount ? <span className="text-[10px] font-bold bg-ich-gold text-white px-2.5 py-1 rounded-full">{item.discount}% OFF</span> : null}
          </div>
          <h1 className="text-2xl font-display font-bold text-white text-shadow-soft">{item.title}</h1>
          {item.location && <p className="text-xs text-white/85 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{item.location}</p>}
        </div>
      </div>

      <div className="px-6 -mt-4 relative z-10 space-y-4">
        <GlassCard className="p-5">
          <p className="text-sm text-ich-neutral leading-relaxed">{item.description}</p>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-ich-primary/10">
            {item.price ? <InfoCell icon={Tag} label="From" value={formatIDR(item.price)} /> : null}
            {item.discount ? <InfoCell icon={Tag} label="Discount" value={`${item.discount}% off`} /> : null}
            {item.valid_until ? <InfoCell icon={Clock} label="Valid until" value={moment(item.valid_until).format("MMM D, YYYY")} /> : null}
            {item.date ? <InfoCell icon={CalendarDays} label="Date" value={moment(item.date).format("MMM D, YYYY")} /> : null}
            {item.location ? <InfoCell icon={MapPin} label="Location" value={item.location} /> : null}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-ich-primary mb-3">Good to know</h2>
          <ul className="space-y-2">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-ich-neutral">
                <Check className="w-4 h-4 text-gold flex-shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </GlassCard>

        <button onClick={claim} className="w-full py-3.5 btn-primary rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 press">
          {item.cta || "Get this offer"} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
