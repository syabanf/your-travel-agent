import { Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConciergeOffer() {
  return (
    <div className="px-6">
      <Link to="/assistant" className="block press-spring">
        <div className="relative overflow-hidden rounded-3xl shadow-lift">
          <div className="absolute inset-0 premium-bg-dark" />
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-ich-gold/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-ich-crimson/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />

          <div className="relative p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-soft flex-shrink-0"
              style={{ backgroundImage: "linear-gradient(135deg, #D4A24C, #B9842C)" }}
            >
              <Crown className="w-6 h-6 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-amber-300/90 tracking-widest uppercase mb-0.5">Premium Service</p>
              <h3 className="text-base font-display font-semibold text-white mb-0.5">
                Personal Concierge
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Expert travel advisors for your perfect journey
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-300 flex-shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );
}
