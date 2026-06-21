import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarSearch, MessageCircle, Wallet, ArrowRight } from "lucide-react";
import PhoneFrame from "../components/PhoneFrame";

const slides = [
  { icon: MapPin, title: "Plan trips you'll love", desc: "Swipe destinations that match your vibe, then let the wizard build a day-by-day itinerary.", color: ["#0EA5E9", "#14B8A6"] },
  { icon: CalendarSearch, title: "Book it all in one place", desc: "Flights, hotels, trains, cars and attractions — priced in Rupiah and saved to your trip.", color: ["#AD1F23", "#C42A2E"] },
  { icon: MessageCircle, title: "Your concierge, 24/7", desc: "Chat with the AI travel concierge, or hire a human expert to plan it all for you.", color: ["#9333EA", "#DB2777"] },
  { icon: Wallet, title: "Stay perfectly organized", desc: "Track budgets, pack with smart checklists, and see every trip on a map & calendar.", color: ["#059669", "#0EA5E9"] },
];

const finish = (navigate) => {
  try { localStorage.setItem("mora_onboarded", "1"); } catch { /* ignore */ }
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
      <div className="relative z-10 flex-1 flex flex-col px-7 pb-10 pt-2 overflow-hidden">
        <div className="flex justify-end">
          <button onClick={() => finish(navigate)} className="text-sm text-mora-neutral hover:text-mora-primary transition-colors">Skip</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_16px_40px_rgba(11,27,59,0.18)]" style={{ background: `linear-gradient(135deg, ${s.color[0]}, ${s.color[1]})` }}>
                <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-display font-bold text-mora-primary mb-3 max-w-[300px]">{s.title}</h2>
              <p className="text-sm text-mora-neutral leading-relaxed max-w-[300px]">{s.desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-mora-gold" : "w-1.5 bg-mora-primary/15"}`} />
          ))}
        </div>

        <button onClick={() => (last ? finish(navigate) : setI(i + 1))} className="w-full h-12 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          {last ? "Get Started" : "Next"} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </PhoneFrame>
  );
}
