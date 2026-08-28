import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarSearch, MessageCircle, Wallet, ArrowRight, Plane } from "lucide-react";
import PhoneFrame from "../components/PhoneFrame";

const U = (id) => `https://images.unsplash.com/photo-${id}?w=900&q=80`;

const slides = [
  { icon: MapPin, title: "Plan trips you'll love", desc: "Swipe destinations that match your vibe, then let the wizard build a day-by-day itinerary.", color: ["#0EA5E9", "#14B8A6"], img: U("1613395877344-13d4a8e0d49e") },
  { icon: CalendarSearch, title: "Book it all in one place", desc: "Flights, hotels, trains, cars and attractions — priced in Rupiah and saved to your trip.", color: ["#AD1F23", "#C42A2E"], img: U("1436491865332-7a61a109cc05") },
  { icon: MessageCircle, title: "Your concierge, 24/7", desc: "Chat with the AI travel concierge, or hire a human expert to plan it all for you.", color: ["#9333EA", "#DB2777"], img: U("1493976040374-85c8e12f0c0e") },
  { icon: Wallet, title: "Stay perfectly organized", desc: "Track budgets, pack with smart checklists, and see every trip on a map & calendar.", color: ["#059669", "#0EA5E9"], img: U("1514282401047-d79a71a590e8") },
];

const finish = (navigate) => {
  try { localStorage.setItem("ich_onboarded", "1"); } catch { /* ignore */ }
  navigate("/login");
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const last = i === slides.length - 1;
  const s = slides[i];
  const Icon = s.icon;

  return (
    <PhoneFrame>
      <div className="relative z-10 flex-1 flex flex-col px-6 pb-10 pt-3 overflow-hidden">
        {/* Ambient accent glows (tinted per slide) */}
        <div className="pointer-events-none absolute -top-12 -right-16 w-56 h-56 rounded-full blur-3xl opacity-40 transition-colors duration-500" style={{ background: `radial-gradient(circle, ${s.color[0]}66, transparent 70%)` }} />
        <div className="pointer-events-none absolute bottom-28 -left-16 w-52 h-52 rounded-full blur-3xl opacity-30 transition-colors duration-500" style={{ background: `radial-gradient(circle, ${s.color[1]}66, transparent 70%)` }} />

        {/* Brand + skip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center"><Plane className="w-4 h-4 text-white" /></div>
            <span className="font-display font-bold text-ich-primary">Icon Holiday</span>
          </div>
          <button onClick={() => finish(navigate)} className="text-sm text-ich-neutral hover:text-ich-primary transition-colors press">Skip</button>
        </div>

        {/* Slide */}
        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              {/* Hero image with scrim + floating badge + title */}
              <div className="relative rounded-[2rem] overflow-hidden h-80 shadow-[0_24px_60px_rgba(11,27,59,0.22)] ring-1 ring-white/40">
                <img src={s.img} alt={s.title} onError={(e) => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,27,59,0.9), rgba(11,27,59,0.15) 55%, rgba(11,27,59,0.04))" }} />
                {/* color accent wash */}
                <div className="absolute inset-x-0 top-0 h-24 opacity-50" style={{ background: `linear-gradient(135deg, ${s.color[0]}55, transparent 70%)` }} />

                <div className="absolute top-4 left-4 glass-light px-3 py-1 rounded-full">
                  <span className="text-[11px] font-semibold text-ich-primary">Step {i + 1} of {slides.length}</span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-[0_10px_28px_rgba(0,0,0,0.35)]" style={{ background: `linear-gradient(135deg, ${s.color[0]}, ${s.color[1]})` }}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={1.6} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white text-shadow-soft leading-tight">{s.title}</h2>
                </div>
              </div>

              <p className="text-sm text-ich-neutral leading-relaxed text-center mt-5 px-3">{s.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-ich-gold" : "w-1.5 bg-ich-primary/15"}`}
            />
          ))}
        </div>

        <button onClick={() => (last ? finish(navigate) : setI(i + 1))} className="w-full h-12 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 press">
          {last ? "Get Started" : "Next"} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </PhoneFrame>
  );
}
