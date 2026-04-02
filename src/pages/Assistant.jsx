import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, MessageCircle, Star, Globe, ChevronRight, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

const servicePackages = [
  { id: "consult", name: "Consultation", desc: "Expert travel advice & tips", price: "From $29", icon: MessageCircle },
  { id: "consult_itinerary", name: "Consult + Itinerary", desc: "Advice + custom itinerary creation", price: "From $79", icon: Star },
  { id: "full_service", name: "Full Service", desc: "Consult + itinerary + booking", price: "From $149", icon: Crown },
  { id: "tour_guide", name: "Tour Guide", desc: "Personal guide for your trip", price: "From $199/day", icon: Globe },
];

export default function Assistant() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await base44.entities.PersonalAssistant.list("-rating", 20);
      setAssistants(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title="Assistant" subtitle="AI & personal travel experts" showNotification />

      {/* AI Assistant CTA */}
      <div className="px-6 mb-6">
        <Link to="/assistant/ai">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#A5997E]/15 via-[#2A4631]/50 to-[#606A54]/20 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-[#A5997E]/15 rounded-2xl" />
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#A5997E]/10 rounded-full blur-2xl" />
            
            <div className="relative p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#A5997E]/15 flex items-center justify-center flex-shrink-0 glow-gold">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gold tracking-widest uppercase mb-0.5">Smart-A Itinerary</p>
                <h3 className="text-base font-display font-semibold text-mora-white mb-0.5">
                  AI Travel Planner
                </h3>
                <p className="text-xs text-mora-neutral/60">
                  Generate custom itineraries instantly
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gold flex-shrink-0" />
            </div>
          </div>
        </Link>
      </div>

      {/* Service Packages */}
      <div className="px-6 mb-8">
        <h2 className="text-sm font-semibold text-mora-white/90 tracking-wide uppercase mb-3">
          Concierge Services
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {servicePackages.map(({ id, name, desc, price, icon: Icon }) => (
            <GlassCard key={id} className="p-5 hover:glow-gold transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-[#A5997E]/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-mora-white mb-0.5">{name}</h3>
              <p className="text-[10px] text-mora-neutral/50 mb-2 leading-relaxed">{desc}</p>
              <p className="text-xs font-display font-semibold text-gold">{price}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Personal Assistants */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-mora-white/90 tracking-wide uppercase">
            Travel Experts
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
          </div>
        ) : assistants.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <MessageCircle className="w-10 h-10 text-mora-neutral/30 mx-auto mb-3" />
            <p className="text-sm text-mora-neutral/60">No assistants available yet</p>
            <p className="text-xs text-mora-neutral/40 mt-1">Our experts are being onboarded</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {assistants.map((assistant) => (
              <Link key={assistant.id} to={`/assistant/profile/${assistant.id}`} className="block">
                 <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                   <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    {assistant.photo_url ? (
                      <img src={assistant.photo_url} alt={assistant.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#A5997E]/15 flex items-center justify-center">
                        <span className="text-lg font-display text-gold">{assistant.name?.[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-mora-white">{assistant.name}</h3>
                    <p className="text-xs text-mora-neutral/60 mt-0.5 truncate">{assistant.specialization}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {assistant.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-gold">
                          <Star className="w-3 h-3 fill-current" /> {assistant.rating}
                        </span>
                      )}
                      {assistant.languages?.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-mora-neutral/50 truncate">
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
                      <span className="text-xs font-display text-gold">${assistant.hourly_rate}/hr</span>
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