import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams } from "react-router-dom";
import { Star, Globe, MessageCircle, Crown, Clock } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";

export default function AssistantProfile() {
  const { assistantId } = useParams();
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const results = await base44.entities.PersonalAssistant.filter({ id: assistantId });
      if (results.length > 0) setAssistant(results[0]);
      setLoading(false);
    };
    load();
  }, [assistantId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
    </div>
  );
  if (!assistant) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader showBack title="" />
      <div className="px-6 space-y-5 -mt-2">
        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
            {assistant.photo_url ? (
              <img src={assistant.photo_url} alt={assistant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-mora-gold/10 flex items-center justify-center">
                <span className="text-3xl font-display text-gold">{assistant.name?.[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-mora-primary truncate">{assistant.name}</h1>
            <p className="text-sm text-mora-neutral/60 mt-0.5">{assistant.specialization}</p>
            <div className="flex items-center gap-3 mt-2">
              {assistant.rating && (
                <span className="flex items-center gap-1 text-xs text-gold">
                  <Star className="w-3.5 h-3.5 fill-current" /> {assistant.rating} ({assistant.reviews_count || 0} reviews)
                </span>
              )}
              {assistant.is_available && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Available
                </span>
              )}
            </div>
          </div>
        </div>

        {assistant.bio && (
          <GlassCard className="p-5">
            <p className="text-sm text-mora-neutral/70 leading-relaxed">{assistant.bio}</p>
          </GlassCard>
        )}

        {assistant.languages?.length > 0 && (
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-gold" />
              <p className="text-xs text-gold uppercase tracking-widest">Languages</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {assistant.languages.map(lang => (
                <span key={lang} className="px-3 py-1.5 glass-light rounded-xl text-xs text-mora-neutral/80">{lang}</span>
              ))}
            </div>
          </GlassCard>
        )}

        {assistant.packages?.length > 0 && (
          <div>
            <h2 className="text-xs text-gold uppercase tracking-widest mb-3">Service Packages</h2>
            <div className="space-y-3">
              {assistant.packages.map((pkg, i) => (
                <GlassCard key={i} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-mora-primary">{pkg.name}</h3>
                      <p className="text-xs text-mora-neutral/50 mt-1">{pkg.description}</p>
                    </div>
                    {pkg.price && <span className="text-sm font-display font-semibold text-gold">{formatIDR(pkg.price)}</span>}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => toast("Consultation booking coming soon")} className="w-full py-4 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all flex items-center justify-center gap-2 mb-6">
          <MessageCircle className="w-4 h-4" /> Book Consultation
        </button>
      </div>
    </div>
  );
}