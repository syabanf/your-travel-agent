import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { backend } from "@/api/backend";
import { Check, Loader2, Sparkles, Headphones, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { formatIDR } from "@/lib/currency";
import { featureMeta, useFeatureAccess } from "@/lib/featureAccess";

const ICONS = { virtual_guiding: Headphones, ai_itinerary: Sparkles };

// Paywall for the two sold add-ons. Buying goes through the normal checkout so
// there's one payment flow, one receipt, and one place bugs can hide.
export default function FeatureUnlock() {
  const { feature } = useParams();
  const navigate = useNavigate();
  const meta = featureMeta(feature);
  const { unlocked, loading } = useFeatureAccess(feature);
  const [starting, setStarting] = useState(false);

  if (!meta) return <Navigate to="/" replace />;

  const Icon = ICONS[feature] || Sparkles;

  const buy = async () => {
    if (starting) return;
    setStarting(true);
    try {
      // Reuse a pending order for this add-on rather than stacking up drafts
      // every time someone taps Unlock and backs out.
      let pending = null;
      try {
        const drafts = await backend.entities.Booking.filter({ feature_key: feature, status: "pending" });
        pending = drafts?.[0] || null;
      } catch {
        /* couldn't look it up — a fresh order is harmless */
      }

      const details = {
        type: "service",
        title: meta.name,
        provider: "Icon Holiday",
        price: meta.price,
        currency: "IDR",
        status: "pending",
        guests: 1,
        feature_key: feature,
        notes: `${meta.name} — ${meta.unit}`,
      };
      const record = pending
        ? await backend.entities.Booking.update(pending.id, details)
        : await backend.entities.Booking.create(details);

      navigate(`/booking/${record.id}/checkout`);
    } catch {
      toast.error("Couldn't start this purchase. Please try again.");
      setStarting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title={meta.name} subtitle={meta.unit} showBack />

      <div className="px-6 pb-28 space-y-4">
        <GlassCard className="p-6 text-center">
          <div className="w-16 h-16 rounded-2xl glass-gold flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-gold" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-display font-bold text-ich-primary mb-1.5">{meta.name}</h2>
          <p className="text-sm text-ich-neutral leading-relaxed max-w-[280px] mx-auto">{meta.tagline}</p>

          <p className="mt-5 text-2xl font-display font-bold text-gold">{formatIDR(meta.price)}</p>
          <p className="text-[11px] text-ich-neutral/60 mt-0.5">{meta.unit}</p>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-3">What you get</h3>
          <ul className="space-y-2.5">
            {meta.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-sm text-ich-neutral leading-snug">{perk}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-ich-neutral/50 shrink-0" />
          <p className="text-[11px] text-ich-neutral/50 leading-relaxed">
            One-off payment. Payment is simulated in this demo.
          </p>
        </div>

        {unlocked ? (
          <button
            onClick={() => navigate(feature === "virtual_guiding" ? "/virtual-guiding" : "/assistant/ai")}
            className="w-full py-4 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Already unlocked — open it
          </button>
        ) : (
          <button
            onClick={buy}
            disabled={starting || loading}
            className="w-full py-4 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Unlock for {formatIDR(meta.price)}
          </button>
        )}
      </div>
    </div>
  );
}
