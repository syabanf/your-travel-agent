import { Crown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConciergeOffer() {
  return (
    <div className="px-6">
      <Link to="/assistant" className="block press-spring">
        <div className="flex items-center gap-4 rounded-card bg-card p-5 shadow-card transition-colors hover:bg-surface-2 lift">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
            <Crown className="size-6" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Premium service</p>
            <h3 className="mb-0.5 text-base font-semibold text-foreground">Personal Concierge</h3>
            <p className="text-xs leading-relaxed text-muted">Expert travel advisors for your perfect journey</p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-accent-strong" aria-hidden="true" />
        </div>
      </Link>
    </div>
  );
}
