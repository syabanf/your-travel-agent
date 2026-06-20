import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, X, RotateCcw, MapPin, Plane, Check } from "lucide-react";
import { DESTINATIONS } from "@/data/destinations";
import { base44 } from "@/api/base44Client";
import { addFavorite, removeFavorite } from "@/lib/favorites";
import { formatIDR } from "@/lib/currency";

function CardFace({ dest }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(11,27,59,0.18)] select-none bg-mora-primary">
      {!imgError ? (
        <img
          src={dest.image}
          alt={dest.name}
          draggable={false}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-6xl" style={{ background: `linear-gradient(135deg, ${dest.gradient[0]}, ${dest.gradient[1]})` }}>
          {dest.emoji}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 pointer-events-none" />

      <div className="absolute top-4 left-4 glass-light px-3 py-1.5 rounded-full flex items-center gap-1.5">
        <Plane className="w-3 h-3 text-gold" />
        <span className="text-[11px] font-semibold text-mora-primary">from {formatIDR(dest.fromPrice)}</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
        <p className="text-[11px] text-[#F0B7B9] tracking-widest uppercase mb-1">{dest.tagline}</p>
        <h3 className="text-3xl font-display font-bold text-white text-shadow-soft leading-tight">{dest.name}</h3>
        <div className="flex items-center gap-1.5 mt-1 mb-3">
          <MapPin className="w-3.5 h-3.5 text-gold" />
          <span className="text-sm text-white/85">{dest.country}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dest.vibes.map((v) => (
            <span key={v} className="text-[10px] font-medium text-white/90 bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full">{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DestinationSwipe({ onLikedChange }) {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState([]);
  const [history, setHistory] = useState([]);
  const [gone, setGone] = useState(null); // 'left' | 'right' while the top card flies off
  const [hint, setHint] = useState(null); // live drag direction for LIKE/NOPE badges
  const [deck, setDeck] = useState(DESTINATIONS); // CMS-managed destinations (fallback: static list)

  useEffect(() => {
    base44.entities.Destination.list("-created_date", 100)
      .then((rows) => { if (rows && rows.length) setDeck(rows.filter((d) => d.active !== false)); })
      .catch(() => {});
  }, []);

  const current = deck[index];
  const next = deck[index + 1];
  const done = index >= deck.length;

  const advance = (dir) => {
    const dest = deck[index];
    setHistory((h) => [...h, { dir, dest }]);
    setIndex((i) => i + 1);
    setHint(null);
    setGone(null);
  };

  // Persist the decision immediately (robust even if the card unmounts mid-fly).
  const decide = (dir) => {
    if (gone) return;
    if (dir === "right") {
      const dest = deck[index];
      addFavorite(dest);
      const nl = liked.some((d) => d.id === dest.id) ? liked : [...liked, dest];
      setLiked(nl);
      onLikedChange?.(nl);
    }
    setGone(dir);
  };

  const undo = () => {
    if (!history.length || gone) return;
    const last = history[history.length - 1];
    if (last.dir === "right") {
      removeFavorite(last.dest.id);
      const nl = liked.filter((d) => d.id !== last.dest.id);
      setLiked(nl);
      onLikedChange?.(nl);
    }
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  };

  const activeHint = gone || hint;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full" style={{ height: 420 }}>
        {done ? (
          <div className="absolute inset-0 rounded-3xl glass-card flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl glass-gold flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-gold" />
            </div>
            <h3 className="text-xl font-display font-semibold text-mora-primary mb-1">That's everyone!</h3>
            <p className="text-sm text-mora-neutral mb-4">
              {liked.length > 0
                ? `You saved ${liked.length} destination${liked.length > 1 ? "s" : ""} as references.`
                : "No favorites yet — tap Continue to plan anyway."}
            </p>
            <button onClick={() => { setIndex(0); setHistory([]); }} className="text-xs text-gold flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Start over
            </button>
          </div>
        ) : (
          <>
            {next && (
              <div className="absolute inset-0 scale-[0.94] translate-y-3 opacity-70 pointer-events-none">
                <CardFace dest={next} />
              </div>
            )}
            <motion.div
              key={current.id}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              drag={gone ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDrag={(_e, info) => {
                const h = info.offset.x > 45 ? "right" : info.offset.x < -45 ? "left" : null;
                setHint((prev) => (prev === h ? prev : h));
              }}
              onDragEnd={(_e, info) => {
                setHint(null);
                if (info.offset.x > 110 || info.velocity.x > 650) decide("right");
                else if (info.offset.x < -110 || info.velocity.x < -650) decide("left");
              }}
              initial={{ scale: 0.96, y: 14, opacity: 0 }}
              animate={
                gone
                  ? { x: gone === "right" ? 560 : -560, rotate: gone === "right" ? 18 : -18, opacity: 0 }
                  : { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }
              }
              transition={gone ? { duration: 0.3, ease: "easeOut" } : { type: "spring", stiffness: 320, damping: 30 }}
              onAnimationComplete={() => { if (gone) advance(gone); }}
            >
              <CardFace dest={current} />
              <motion.div animate={{ opacity: activeHint === "right" ? 1 : 0 }} className="absolute top-8 left-6 rotate-[-12deg] border-4 border-emerald-400 text-emerald-400 text-2xl font-extrabold px-3 py-1 rounded-xl tracking-wider pointer-events-none">
                LIKE
              </motion.div>
              <motion.div animate={{ opacity: activeHint === "left" ? 1 : 0 }} className="absolute top-8 right-6 rotate-[12deg] border-4 border-red-400 text-red-400 text-2xl font-extrabold px-3 py-1 rounded-xl tracking-wider pointer-events-none">
                NOPE
              </motion.div>
            </motion.div>
          </>
        )}
      </div>

      {!done && (
        <div className="flex items-center justify-center gap-5 mt-6">
          <button onClick={() => decide("left")} className="w-14 h-14 rounded-full glass-card flex items-center justify-center text-red-400 hover:scale-105 active:scale-95 transition-transform" aria-label="Skip">
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <button onClick={undo} disabled={!history.length} className="w-11 h-11 rounded-full glass-light flex items-center justify-center text-mora-neutral hover:scale-105 active:scale-95 transition-transform disabled:opacity-30" aria-label="Undo">
            <RotateCcw className="w-4.5 h-4.5" />
          </button>
          <button onClick={() => decide("right")} className="w-14 h-14 rounded-full flex items-center justify-center text-white btn-primary hover:scale-105 active:scale-95 transition-transform" aria-label="Favorite">
            <Heart className="w-6 h-6" fill="currentColor" />
          </button>
        </div>
      )}

      <p className="text-[11px] text-mora-neutral/60 mt-4">
        {done ? "" : `${index + 1} / ${deck.length} · `}
        <span className="text-gold font-medium">{liked.length} saved</span>
      </p>
    </div>
  );
}
