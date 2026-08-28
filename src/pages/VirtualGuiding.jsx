import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Headphones, Play, Pause, MapPin, Radio, Lock, Loader2, Volume2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { useFeatureAccess, PAID_FEATURES } from "@/lib/featureAccess";
import { formatIDR } from "@/lib/currency";

// Live audio guiding. Paid feature — the paywall is the whole point, so an
// unentitled visitor gets the pitch, not the player.
export default function VirtualGuiding() {
  const navigate = useNavigate();
  const { unlocked, loading } = useFeatureAccess("virtual_guiding");
  const [trips, setTrips] = useState([]);
  const [playing, setPlaying] = useState(null);

  useEffect(() => {
    base44.entities.Trip.list()
      .then((t) => setTrips(t.filter((x) => x.status === "active" || x.status === "planned")))
      .catch(() => setTrips([]));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!unlocked) {
    const meta = PAID_FEATURES.virtual_guiding;
    return (
      <div className="animate-fade-in">
        <PageHeader title="Virtual Guiding" subtitle="Locked" showBack />
        <div className="px-6 pb-28">
          <GlassCard className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl glass-gold flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-base font-display font-bold text-ich-primary mb-1.5">
              Virtual Guiding is a paid add-on
            </h2>
            <p className="text-sm text-ich-neutral leading-relaxed max-w-[280px] mx-auto">
              {meta.tagline} Unlock it once and it covers your whole travelling party.
            </p>
            <button
              onClick={() => navigate("/unlock/virtual_guiding")}
              className="w-full py-3.5 mt-6 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all"
            >
              Unlock for {formatIDR(meta.price)}
            </button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const stops = [
    { id: "s1", title: "Welcome & orientation", place: "Meeting point", minutes: 4 },
    { id: "s2", title: "The old quarter", place: "Historic centre", minutes: 11 },
    { id: "s3", title: "Temple grounds", place: "Main sanctuary", minutes: 9 },
    { id: "s4", title: "Market walk", place: "Night market", minutes: 7 },
    { id: "s5", title: "Sunset viewpoint", place: "West terrace", minutes: 6 },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Virtual Guiding" subtitle="Your guide, on demand" showBack />

      <div className="px-6 pb-28 space-y-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl glass-gold flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ich-primary">Live guide available</p>
              <p className="text-[11px] text-ich-neutral/60">Tap any stop to start the audio guide</p>
            </div>
          </div>
        </GlassCard>

        {trips.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-2">Your trips</h3>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
              {trips.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/itinerary/${t.id}`)}
                  className="px-3.5 py-2 rounded-full glass-light text-xs font-medium text-ich-neutral hover:text-gold whitespace-nowrap shrink-0 press-spring transition-colors"
                >
                  {t.destination || t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-2">Guided stops</h3>
          <GlassCard className="p-2">
            {stops.map((stop) => {
              const isPlaying = playing === stop.id;
              return (
                <div key={stop.id} className="flex items-center gap-3 px-3 py-3">
                  <button
                    onClick={() => setPlaying(isPlaying ? null : stop.id)}
                    aria-label={isPlaying ? `Pause ${stop.title}` : `Play ${stop.title}`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 press-spring transition-all ${
                      isPlaying ? "glass-gold text-gold" : "glass-light text-ich-neutral hover:text-gold"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ich-primary truncate">{stop.title}</p>
                    <p className="text-[11px] text-ich-neutral/60 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {stop.place} · {stop.minutes} min
                    </p>
                  </div>
                  {isPlaying && <Volume2 className="w-4 h-4 text-gold shrink-0 animate-pulse" />}
                </div>
              );
            })}
          </GlassCard>
        </div>

        <button
          onClick={() => navigate("/assistant")}
          className="w-full py-3.5 glass-light rounded-xl text-sm font-medium text-ich-primary hover:bg-ich-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Headphones className="w-4 h-4" /> Ask a live guide
        </button>
      </div>
    </div>
  );
}
