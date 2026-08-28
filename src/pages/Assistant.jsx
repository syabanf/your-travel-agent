import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, MessageCircle, Star, Globe, ChevronRight, Crown, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import ErrorState from "@/components/ErrorState";
import { formatIDR } from "@/lib/currency";

const servicePackages = [
  { id: "consult", name: "Consultation", desc: "Expert travel advice & tips", price: `From ${formatIDR(450000)}`, icon: MessageCircle },
  { id: "consult_itinerary", name: "Consult + Itinerary", desc: "Advice + custom itinerary creation", price: `From ${formatIDR(990000)}`, icon: Star },
  { id: "full_service", name: "Full Service", desc: "Consult + itinerary + booking", price: `From ${formatIDR(2500000)}`, icon: Crown },
  { id: "tour_guide", name: "Tour Guide", desc: "Personal guide for your trip", price: `From ${formatIDR(1500000)}/day`, icon: Globe },
];

export default function Assistant() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const data = await base44.entities.PersonalAssistant.list("-rating", 20);
      setAssistants(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Assistant" subtitle="AI & personal travel experts" />

      {/* AI Assistant CTA */}
      <div className="px-6 mb-6">
        <Link to="/assistant/ai">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-ich-primary/10 to-gold/5 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-gold/10 rounded-2xl" />
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gold/5 rounded-full blur-2xl" />
            
            <div className="relative p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center flex-shrink-0 glow-gold">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gold tracking-widest uppercase mb-0.5">Smart-A Itinerary</p>
                <h3 className="text-base font-display font-semibold text-ich-primary mb-0.5">
                  AI Travel Planner
                </h3>
                <p className="text-xs text-ich-neutral">
                  Generate custom itineraries instantly
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gold flex-shrink-0" />
            </div>
          </div>
        </Link>
      </div>

      {/* Virtual Guiding — a paid add-on, so it gets its own entry rather than
          hiding inside the concierge grid. */}
      <div className="px-6 mb-6">
        <Link to="/virtual-guiding">
          <GlassCard className="p-4 flex items-center gap-4 hover:glow-gold transition-all">
            <div className="w-12 h-12 rounded-xl glass-gold flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gold tracking-widest uppercase mb-0.5">Add-on</p>
              <h3 className="text-base font-display font-semibold text-ich-primary mb-0.5">Virtual Guiding</h3>
              <p className="text-xs text-ich-neutral">A live guide at every stop</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gold flex-shrink-0" />
          </GlassCard>
        </Link>
      </div>

      {/* Service Packages */}
      <div className="px-6 mb-8">
        <h2 className="text-sm font-semibold text-ich-primary tracking-wide uppercase mb-3">
          Concierge Services
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {servicePackages.map(({ id, name, desc, price, icon: Icon }) => (
            <GlassCard key={id} className="p-5 hover:glow-gold transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-ich-primary mb-0.5">{name}</h3>
              <p className="text-[10px] text-ich-neutral mb-2 leading-relaxed">{desc}</p>
              <p className="text-xs font-display font-semibold text-gold">{price}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Personal Assistants */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ich-primary tracking-wide uppercase">
            Travel Experts
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" />
          </div>
        ) : error ? (
          <ErrorState
            title="Couldn't load experts"
            hint="Please check your connection and try again."
            onRetry={load}
          />
        ) : assistants.length === 0 ? (
          <GlassCard className="p-8 text-center">
          <MessageCircle className="w-10 h-10 text-ich-neutral/30 mx-auto mb-3" />
          <p className="text-sm text-ich-neutral">No assistants available yet</p>
          <p className="text-xs text-ich-neutral/70 mt-1">Our experts are being onboarded</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {assistants.map((assistant) => (
              <Link key={assistant.id} to={`/assistant/profile/${assistant.id}`} className="block">
                 <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                   <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    {assistant.photo_url ? (
                      <img src={assistant.photo_url} alt={assistant.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gold/15 flex items-center justify-center">
                        <span className="text-lg font-display text-gold">{assistant.name?.[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-ich-primary">{assistant.name}</h3>
                    <p className="text-xs text-ich-neutral mt-0.5 truncate">{assistant.specialization}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {assistant.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-gold">
                          <Star className="w-3 h-3 fill-current" /> {assistant.rating}
                        </span>
                      )}
                      {assistant.languages?.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-ich-neutral truncate">
                          <Globe className="w-3 h-3 flex-shrink-0" /> {assistant.languages.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-1">
                    {assistant.is_available && (
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mb-1 ml-auto" />
                    )}
                    {assistant.hourly_rate && (
                      <span className="stat-value block text-xs font-display text-gold whitespace-nowrap">{formatIDR(assistant.hourly_rate)}/hr</span>
                    )}
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}