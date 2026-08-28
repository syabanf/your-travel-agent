import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Sparkles, Loader2, Wand2, MapPin, Users,
  Heart, Calendar, Check, Plane,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createInquiryForPlan } from "@/lib/inquiry";
import { confirmDialog } from "@/components/ConfirmDialog";
import GlassCard from "@/components/GlassCard";
import DateTimePicker from "@/components/DateTimePicker";
import { Input } from "@/components/ui/input";
import DestinationSwipe from "@/components/wizard/DestinationSwipe";
import OTASearch from "@/components/booking/OTASearch";
import { getFavorites } from "@/lib/favorites";
import { formatIDR, formatIDRCompact } from "@/lib/currency";

const STEPS = ["discover", "destination", "dates", "details", "budget", "review", "book"];
const PLANNING_STEPS = 6; // discover..review

const STEP_META = {
  discover: { title: "Find your vibe", subtitle: "Swipe right on places you love" },
  destination: { title: "Where to?", subtitle: "Pick a reference or type your own" },
  dates: { title: "When?", subtitle: "Choose your travel dates" },
  details: { title: "Your style", subtitle: "Tell us how you travel" },
  budget: { title: "Budget", subtitle: "Set an approximate budget" },
  review: { title: "Review", subtitle: "Confirm and let's build it" },
  book: { title: "Book your trip", subtitle: "Add flights & stays (optional)" },
};

const travelStyles = ["luxury", "adventure", "cultural", "relaxation", "business", "family", "budget"];
const paceOptions = ["relaxed", "moderate", "packed"];
const tripTypes = ["solo", "couple", "family", "business", "luxury", "group"];
const budgetChips = [5000000, 15000000, 30000000, 50000000];

const EMPTY_FORM = {
  destination: "",
  start_date: "",
  end_date: "",
  travelers: 2,
  travel_style: "luxury",
  pace: "moderate",
  trip_type: "couple",
  budget_total: "",
};

// A reload mid-wizard used to wipe every answer. Progress is kept in
// sessionStorage so it survives a refresh but never outlives the tab.
const DRAFT_KEY = "trip:wizard";
const LAST_PLANNING_STEP = STEPS.indexOf("review");

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    const draft = raw ? JSON.parse(raw) : null;
    return draft && typeof draft === "object" ? draft : null;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore — storage is a convenience, never a requirement */
  }
}

/** Merge a stored draft over the empty form, ignoring unknown/blank keys. */
function restoreForm() {
  const saved = readDraft()?.form;
  const out = { ...EMPTY_FORM };
  if (saved && typeof saved === "object") {
    for (const k of Object.keys(EMPTY_FORM)) {
      if (saved[k] !== undefined && saved[k] !== null) out[k] = saved[k];
    }
  }
  return out;
}

/** Restore the step, clamped to the planning steps ("book" needs a live trip). */
function restoreStep() {
  const saved = Number(readDraft()?.step);
  if (!Number.isFinite(saved)) return 0;
  return Math.min(Math.max(Math.trunc(saved), 0), LAST_PLANNING_STEP);
}

export default function TripWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(restoreStep);
  const [liked, setLiked] = useState(getFavorites());
  const [createdTripId, setCreatedTripId] = useState(null);
  const [busy, setBusy] = useState(null); // 'ai' | 'save'
  const [form, setForm] = useState(restoreForm);

  // Keep the draft in step with the form. Once the trip exists there is
  // nothing left to recover, so we stop writing.
  useEffect(() => {
    if (createdTripId) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step: Math.min(step, LAST_PLANNING_STEP), form }));
    } catch {
      /* ignore — storage is a convenience, never a requirement */
    }
  }, [step, form, createdTripId]);

  const key = STEPS[step];
  const meta = STEP_META[key];
  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const destination = String(form.destination || "");
  const canContinue = key === "destination" ? !!destination.trim() : true;

  /** Has the traveler actually typed/picked anything yet? */
  const isDirty = () =>
    Object.keys(EMPTY_FORM).some((k) => String(form[k] ?? "") !== String(EMPTY_FORM[k]));

  const back = async () => {
    if (step > 0) {
      setStep((s) => s - 1);
      return;
    }
    // Step 0's back control leaves the wizard entirely — check first.
    if (isDirty()) {
      const ok = await confirmDialog({
        title: "Leave trip planner?",
        body: "Your answers so far will be discarded.",
        confirmLabel: "Leave",
        destructive: true,
      });
      if (!ok) return;
    }
    clearDraft();
    navigate(-1);
  };
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const cityOnly = destination.split(",")[0].trim();

  const buildItinerary = async (trip, activities) => {
    if (!activities?.length) return;
    for (const act of activities) {
      await base44.entities.ItineraryItem.create({
        trip_id: trip.id,
        day_number: act.day || 1,
        time: act.time || "",
        activity_name: act.name,
        location: act.location || cityOnly,
        description: act.description || "",
        budget: act.budget || 0,
        category: act.category || "activity",
        duration_minutes: act.duration_minutes || 60,
        booking_status: "not_booked",
      });
    }
  };

  const finishTrip = (trip) => {
    queryClient.invalidateQueries({ queryKey: ["trips"] });
    clearDraft();
    setCreatedTripId(trip.id);
    setStep(STEPS.indexOf("book"));
  };

  const handleGenerate = async () => {
    setBusy("ai");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a complete ${form.travel_style} travel itinerary for ${form.travelers} traveler(s) to ${form.destination}${
          form.start_date ? ` from ${form.start_date}` : ""
        }${form.end_date ? ` to ${form.end_date}` : " for 4 days"}. Pace: ${form.pace}. Trip type: ${form.trip_type}. Provide a catchy title, short notes, estimated total budget in IDR (Indonesian Rupiah), and a full list of activities per day.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            notes: { type: "string" },
            budget_total: { type: "number" },
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" }, time: { type: "string" }, name: { type: "string" },
                  location: { type: "string" }, description: { type: "string" },
                  budget: { type: "number" }, category: { type: "string" }, duration_minutes: { type: "number" },
                },
              },
            },
          },
        },
      });
      const trip = await base44.entities.Trip.create({
        title: res.title || `${cityOnly} Adventure`,
        destination: form.destination,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        travelers: Number(form.travelers) || 1,
        travel_style: form.travel_style,
        pace: form.pace,
        trip_type: form.trip_type,
        notes: res.notes || "",
        budget_total: res.budget_total || (form.budget_total ? Number(form.budget_total) : undefined),
        budget_currency: "IDR",
        status: "draft",
        is_ai_generated: true,
        // AI proposes; it doesn't book. This lands as a plan, and as an
        // inquiry for the team to price.
        kind: "plan",
      });
      await buildItinerary(trip, res.activities);
      await createInquiryForPlan(trip);
      finishTrip(trip);
    } catch {
      toast.error("Couldn't build your trip. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async () => {
    setBusy("save");
    try {
      const trip = await base44.entities.Trip.create({
        title: `${cityOnly} Trip`,
        destination: form.destination,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        travelers: Number(form.travelers) || 1,
        travel_style: form.travel_style,
        pace: form.pace,
        trip_type: form.trip_type,
        budget_total: form.budget_total ? Number(form.budget_total) : undefined,
        budget_currency: "IDR",
        status: "planned",
        kind: "trip",
      });
      finishTrip(trip);
    } catch {
      toast.error("Couldn't create your trip. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="animate-fade-in pb-6">
      {/* Header + progress */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={back} aria-label="Go back" className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-ich-neutral hover:text-ich-primary transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-semibold text-ich-primary">{meta.title}</h1>
            <p className="text-xs text-ich-neutral mt-0.5">{meta.subtitle}</p>
          </div>
          {key === "discover" && (
            <button onClick={() => setStep(1)} className="text-xs text-gold font-medium">Skip</button>
          )}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: PLANNING_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= Math.min(step, PLANNING_STEPS - 1) ? "bg-ich-gold" : "bg-ich-primary/10"}`} />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="px-6">
        <motion.div
          key={key}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
            {key === "discover" && (
              <div className="pt-2">
                <DestinationSwipe onLikedChange={setLiked} />
              </div>
            )}

            {key === "destination" && (
              <div className="space-y-5 pt-1">
                {liked.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Heart className="w-3 h-3" fill="currentColor" /> Your references
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {liked.map((d) => {
                        const label = `${d.name}, ${d.country}`;
                        const active = form.destination === label;
                        return (
                          <button
                            key={d.id}
                            onClick={() => update("destination", label)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${active ? "glass-gold text-gold" : "glass-light text-ich-neutral hover:text-ich-primary"}`}
                          >
                            <span>{d.emoji}</span> {d.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <GlassCard className="p-4">
                  <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Destination</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
                    <Input
                      value={form.destination}
                      onChange={(e) => update("destination", e.target.value)}
                      placeholder="City, country, or island"
                      className="bg-white/5 border-white/10 text-ich-white placeholder:text-ich-neutral/40 rounded-xl h-11 pl-10"
                    />
                  </div>
                </GlassCard>
              </div>
            )}

            {key === "dates" && (
              <GlassCard className="p-4">
                <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Travel Dates</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-ich-neutral/60 mb-1">From</p>
                    <DateTimePicker type="date" value={form.start_date} onChange={(v) => update("start_date", v)} label="Departure" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ich-neutral/60 mb-1">To</p>
                    <DateTimePicker type="date" value={form.end_date} onChange={(v) => update("end_date", v)} label="Return" />
                  </div>
                </div>
                <p className="text-[11px] text-ich-neutral/60 mt-3">Not sure yet? Skip — we'll plan a 4-day trip.</p>
              </GlassCard>
            )}

            {key === "details" && (
              <div className="space-y-4">
                <GlassCard className="p-4">
                  <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Travelers</label>
                  <div className="flex items-center gap-4">
                    <button onClick={() => update("travelers", Math.max(1, Number(form.travelers) - 1))} className="w-10 h-10 glass-light rounded-xl text-ich-primary text-lg font-semibold">−</button>
                    <div className="flex items-center gap-2 flex-1 justify-center">
                      <Users className="w-4 h-4 text-gold" />
                      <span className="text-lg font-display font-semibold text-ich-primary">{form.travelers}</span>
                    </div>
                    <button onClick={() => update("travelers", Number(form.travelers) + 1)} className="w-10 h-10 glass-light rounded-xl text-ich-primary text-lg font-semibold">+</button>
                  </div>
                </GlassCard>

                <GlassCard className="p-4">
                  <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Trip Type</label>
                  <div className="flex flex-wrap gap-2">
                    {tripTypes.map((t) => (
                      <button key={t} onClick={() => update("trip_type", t)} className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition-all ${form.trip_type === t ? "glass-gold text-gold" : "glass-light text-ich-neutral/70"}`}>{t}</button>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-4">
                  <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Travel Style</label>
                  <div className="flex flex-wrap gap-2">
                    {travelStyles.map((s) => (
                      <button key={s} onClick={() => update("travel_style", s)} className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition-all ${form.travel_style === s ? "glass-gold text-gold" : "glass-light text-ich-neutral/70"}`}>{s}</button>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-4">
                  <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Pace</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paceOptions.map((p) => (
                      <button key={p} onClick={() => update("pace", p)} className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${form.pace === p ? "glass-gold text-gold" : "glass-light text-ich-neutral/70"}`}>{p}</button>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {key === "budget" && (
              <GlassCard className="p-4">
                <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Total Budget</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold/70">Rp</span>
                  <Input type="number" value={form.budget_total} onChange={(e) => update("budget_total", e.target.value)} placeholder="Total" className="bg-white/5 border-white/10 text-ich-white placeholder:text-ich-neutral/40 rounded-xl h-11 pl-10" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {budgetChips.map((b) => (
                    <button key={b} onClick={() => update("budget_total", String(b))} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${String(b) === form.budget_total ? "glass-gold text-gold" : "glass-light text-ich-neutral/70"}`}>{formatIDRCompact(b)}</button>
                  ))}
                </div>
              </GlassCard>
            )}

            {key === "review" && (
              <div className="space-y-4">
                <GlassCard className="p-5 space-y-3">
                  <Row icon={MapPin} label="Destination" value={form.destination || "—"} />
                  <Row icon={Calendar} label="Dates" value={form.start_date ? `${form.start_date}${form.end_date ? ` → ${form.end_date}` : ""}` : "Flexible (4 days)"} />
                  <Row icon={Users} label="Travelers" value={`${form.travelers} · ${form.trip_type}`} />
                  <Row icon={Sparkles} label="Style" value={`${form.travel_style} · ${form.pace}`} />
                  <Row icon={Plane} label="Budget" value={form.budget_total ? formatIDR(form.budget_total) : "Estimate with AI"} />
                </GlassCard>
                {liked.length > 0 && (
                  <p className="text-[11px] text-ich-neutral/70">
                    Inspired by {liked.map((d) => d.name).join(", ")}.
                  </p>
                )}
                <button onClick={handleGenerate} disabled={busy} className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 btn-primary disabled:opacity-50">
                  {busy === "ai" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  {busy === "ai" ? "Building your trip…" : "Generate full trip with AI"}
                </button>
                <button onClick={handleCreate} disabled={busy} className="w-full py-3.5 glass-light rounded-2xl text-sm font-medium text-ich-primary hover:bg-ich-primary/5 transition-all disabled:opacity-50">
                  {busy === "save" ? "Creating…" : "Create without AI"}
                </button>
              </div>
            )}

            {key === "book" && (
              <div>
                <GlassCard className="p-4 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl glass-gold flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ich-primary">Trip created!</p>
                    <p className="text-xs text-ich-neutral">Add flights & stays for {cityOnly}, or do it later.</p>
                  </div>
                </GlassCard>
                <div className="-mx-6">
                  <OTASearch defaultTo={cityOnly} tripId={createdTripId} defaultTab="flight" />
                </div>
                <button onClick={() => navigate(`/itinerary/${createdTripId}`)} className="w-full py-3.5 btn-primary rounded-2xl text-sm font-semibold flex items-center justify-center gap-2">
                  View my trip <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
        </motion.div>
      </div>

      {/* Footer nav (planning steps only) */}
      {step < STEPS.indexOf("review") && (
        <div className="px-6 mt-6 flex gap-3">
          <button onClick={back} className="px-5 py-3.5 glass-light rounded-2xl text-sm font-medium text-ich-neutral hover:text-ich-primary transition-all">Back</button>
          <button
            onClick={next}
            disabled={!canContinue}
            className="flex-1 py-3.5 btn-primary rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {key === "discover" ? "Continue to planning" : "Continue"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-ich-gold/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-ich-neutral/60 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-ich-primary capitalize truncate">{value}</p>
      </div>
    </div>
  );
}
