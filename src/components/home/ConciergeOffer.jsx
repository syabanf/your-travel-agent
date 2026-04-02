import { Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConciergeOffer() {
  return (
    <div className="px-6">
      <Link to="/assistant">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#A5997E]/20 via-[#2A4631]/40 to-[#A5997E]/10 backdrop-blur-xl" />
          <div className="absolute inset-0 border border-[#A5997E]/20 rounded-2xl" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A5997E]/10 rounded-full blur-2xl" />
          
          <div className="relative p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#A5997E]/15 flex items-center justify-center flex-shrink-0">
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