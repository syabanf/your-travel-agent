import { useState } from "react";
import { Sparkles, Loader2, X, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Per-resource canned "AI insights" for the demo (the real InvokeLLM seam is
// called for latency/feel; swap configureLLM() to wire a real model later).
const CANNED = {
  overview: { insights: ["Revenue is concentrated in a few confirmed bookings — protect those relationships.", "Most trips sit in draft/planned — nudge them toward confirmation.", "Customer base skews high-tier; lookalike acquisition could compound growth."], actions: ["Summarise this week", "Flag at-risk trips", "Draft a status update"] },
  reports: { insights: ["Confirmed-booking revenue is healthy but thin in volume — widen the top of funnel.", "Average booking value is strong; upsell add-ons to lift it further.", "Trips-by-status shows a planning bottleneck before confirmation."], actions: ["Explain the revenue trend", "What should I do next?", "Compare to last period"] },
  customers: { insights: ["Platinum & gold tiers drive most lifetime value — prioritise retention there.", "At least one customer is inactive; a win-back offer could re-engage them.", "Indonesia-based customers dominate — region-specific promos may convert well."], actions: ["Draft a win-back email", "Who are my VIPs?", "Suggest a segment"] },
  leads: { insights: ["New leads are clustering early in the pipeline — follow up within 24h to lift conversion.", "Budget varies widely; route high-budget leads to senior agents.", "A few sources produce most leads — double down there."], actions: ["Prioritise today's leads", "Draft a follow-up", "Score these leads"] },
  bookings: { insights: ["Pending bookings represent unrealised revenue — chase confirmations.", "Flights & hotels dominate; bundle them for higher value.", "Some bookings lack a linked trip — tidy up attribution."], actions: ["List bookings to chase", "Forecast this month", "Find anomalies"] },
  trips: { insights: ["Draft trips outnumber active — a planning nudge could convert them.", "Group trips carry higher budgets; offer concierge upsells.", "Most trips target a handful of destinations — stock inventory accordingly."], actions: ["Which trips need attention?", "Suggest upsells", "Summarise the pipeline"] },
  suppliers: { insights: ["A small set of suppliers covers most cost — negotiate volume rates.", "Mix of types gives resilience; keep at least two per category.", "Watch margins on the highest-cost suppliers."], actions: ["Find cost-saving options", "Rank by margin", "Draft an RFQ"] },
  destinations: { insights: ["A few destinations drive most demand — feature them prominently.", "Higher-priced destinations convert with the right audience.", "Add fresh imagery to under-performing destinations to lift swipes."], actions: ["What's trending?", "Suggest new destinations", "Improve a listing"] },
  promotions: { insights: ["Featured promos pull the most attention — rotate them weekly.", "Expiring offers create urgency; surface them on Home.", "Event-type content boosts engagement without discounting."], actions: ["Draft a flash sale", "Which promo to feature?", "Suggest copy"] },
  marketing: { insights: ["Segment-targeted campaigns outperform broad sends — keep narrowing.", "WhatsApp is your highest-intent channel for VIPs.", "Schedule sends around traveller decision windows."], actions: ["Draft a campaign", "Best segment to target?", "Suggest a subject line"] },
  content: { insights: ["Published FAQs reduce support load — expand the top questions.", "A couple of pages are stale; refresh them for accuracy.", "Add an announcement to surface seasonal info."], actions: ["Suggest new FAQs", "Find stale pages", "Draft an announcement"] },
  media: { insights: ["Reuse top-performing imagery across destinations & promos.", "Some assets are unused — prune to keep the library tidy.", "Add alt text for accessibility & SEO."], actions: ["Find unused assets", "Suggest tags", "Which images convert?"] },
  ota: { insights: ["Connected channels are syncing, but rate parity needs a weekly check.", "Booking.com & Agoda drive the most volume — protect availability there.", "A disconnected channel is leaking demand — reconnect to recover bookings."], actions: ["Check rate parity", "Where am I losing bookings?", "Suggest channel mix"] },
  pms: { insights: ["Occupancy is healthy mid-week but dips on weekends — adjust rates.", "A few room types sell out first; consider adding inventory.", "Maintenance holds are reducing sellable nights — schedule off-peak."], actions: ["Optimise pricing", "Forecast occupancy", "Which rooms to add?"] },
};
const DEFAULT = { insights: ["This view looks healthy. Use the filters to spot outliers.", "Export the data to dig deeper in a spreadsheet.", "Ask a specific question below for a tailored answer."], actions: ["Summarise this page", "What stands out?", "What should I do next?"] };

export default function DashboardAiStub({ resource, label = "Ask AI", context = "" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [answer, setAnswer] = useState(null);

  const run = async () => {
    setOpen(true); setLoading(true); setData(null); setAnswer(null);
    try {
      await base44.integrations.Core.InvokeLLM({ prompt: `Give admin insights for the ${resource} view. ${context}` });
    } catch { /* stubbed */ }
    setData(CANNED[resource] || DEFAULT);
    setLoading(false);
  };

  const ask = async (q) => {
    setLoading(true); setAnswer(null);
    try { await base44.integrations.Core.InvokeLLM({ prompt: q }); } catch { /* stubbed */ }
    setAnswer(`Here's a quick take on “${q}”: based on the current ${resource} data, focus on the highlighted items above first, then revisit next week. (Demo AI — connect a model via configureLLM to make this live.)`);
    setLoading(false);
  };

  return (
    <>
      <button onClick={run} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-mora-gold/30 text-gold bg-mora-gold/5 hover:bg-mora-gold/10 press">
        <Sparkles className="w-4 h-4" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl border border-mora-primary/10 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-mora-primary/10 sticky top-0 bg-white">
              <h3 className="font-display font-semibold text-mora-primary flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" /> AI insights · <span className="capitalize">{resource}</span></h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              {loading && !data ? (
                <div className="flex items-center gap-2 text-sm text-mora-neutral py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Analysing {resource}…</div>
              ) : data && (
                <>
                  <ul className="space-y-2.5">
                    {data.insights.map((t, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-mora-primary">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" /> <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-mora-neutral/60 mb-2">Suggested</p>
                    <div className="flex flex-wrap gap-2">
                      {data.actions.map((a) => (
                        <button key={a} onClick={() => ask(a)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">
                          {a} <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                  {loading && <div className="flex items-center gap-2 text-sm text-mora-neutral"><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</div>}
                  {answer && <div className="rounded-xl bg-mora-gold/[0.06] border border-mora-gold/20 p-3 text-sm text-mora-primary">{answer}</div>}
                  <p className="text-[11px] text-mora-neutral/50 pt-1">Demo AI — responses are simulated. Wire a real model via <code className="text-mora-neutral/70">configureLLM()</code>.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
