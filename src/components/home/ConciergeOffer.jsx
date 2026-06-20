import { Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConciergeOffer() {
  return (
    <div className="px-6">
      <Link to="/assistant">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-mora-gold/20 via-mora-primary/40 to-mora-gold/10 backdrop-blur-xl" />
          <div className="absolute inset-0 border border-mora-gold/20 rounded-2xl" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-mora-gold/10 rounded-full blur-2xl" />

          <div className="relative p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mora-gold/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-gold" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gold tracking-widest uppercase mb-0.5">Premium Service</p>
              <h3 className="text-sm font-display font-semibold text-mora-white mb-0.5">
                Personal Concierge
              </h3>
              <p className="text-xs text-mora-neutral/70 leading-relaxed">
                Expert travel advisors for your perfect journey
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gold flex-shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );
}