import { useState, useEffect } from "react";
import { backend } from "@/api/backend";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import DateTimePicker from "../components/DateTimePicker";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

const travelStyles = ["luxury", "adventure", "cultural", "relaxation", "business", "family", "budget"];
const paceOptions = ["relaxed", "moderate", "packed"];
const tripTypes = ["solo", "couple", "family", "business", "luxury", "group"];

export default function NewTrip() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tripId } = useParams();
  const isEdit = Boolean(tripId);
  const [form, setForm] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    travelers: 1,
    travel_style: "luxury",
    budget_total: "",
    budget_currency: "IDR",
    pace: "moderate",
    trip_type: "couple",
    notes: "",
    status: "draft",
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Edit mode: load the existing trip and prefill the form.
  useEffect(() => {
    if (!tripId) return;
    let active = true;
    (async () => {
      const results = await backend.entities.Trip.filter({ id: tripId });
      if (active && results.length > 0) {
        const t = results[0];
        setForm((prev) => ({
          ...prev,
          title: t.title || "",
          destination: t.destination || "",
          start_date: t.start_date || "",
          end_date: t.end_date || "",
          travelers: t.travelers || 1,
          travel_style: t.travel_style || "luxury",
          budget_total: t.budget_total != null ? String(t.budget_total) : "",
          budget_currency: t.budget_currency || "IDR",
          pace: t.pace || "moderate",
          trip_type: t.trip_type || "couple",
          notes: t.notes || "",
          status: t.status || "draft",
        }));
      }
    })();
    return () => { active = false; };
  }, [tripId]);

  const handleAISuggestion = async () => {
    if (!form.destination) return;
    setAiLoading(true);
    try {
    const res = await backend.ask({
      prompt: `Suggest a luxury travel itinerary plan for a trip to ${form.destination}. Based on the destination, suggest: a catchy trip title, the best travel style (one of: luxury, adventure, cultural, relaxation, business, family, budget), ideal pace (one of: relaxed, moderate, packed), trip type (one of: solo, couple, family, business, luxury, group), ideal number of travelers, and a short notes/highlights string. Be concise.`,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          travel_style: { type: "string" },
          pace: { type: "string" },
          trip_type: { type: "string" },
          travelers: { type: "number" },
          notes: { type: "string" }
        }
      }
    });
    setForm(prev => ({
      ...prev,
      title: res.title || prev.title,
      travel_style: res.travel_style || prev.travel_style,
      pace: res.pace || prev.pace,
      trip_type: res.trip_type || prev.trip_type,
      travelers: res.travelers || prev.travelers,
      notes: res.notes || prev.notes,
    }));
    } catch {
      toast.error("Couldn't get AI suggestions. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleGenerateFullTrip = async () => {
    if (!form.destination) return;
    setAiGenerating(true);
    try {
    const res = await backend.ask({
      prompt: `Create a complete ${form.travel_style} travel itinerary for ${form.travelers} traveler(s) to ${form.destination}${
        form.start_date ? ` from ${form.start_date}` : ''
      }${
        form.end_date ? ` to ${form.end_date}` : ' for 3 days'
      }. Pace: ${form.pace}. Trip type: ${form.trip_type}. Provide a catchy title, short notes, estimated total budget in IDR (Indonesian Rupiah), and a full list of activities per day.`,
      schema: {
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
                day: { type: "number" },
                time: { type: "string" },
                name: { type: "string" },
                location: { type: "string" },
                description: { type: "string" },
                budget: { type: "number" },
                category: { type: "string" },
                duration_minutes: { type: "number" }
              }
            }
          }
        }
      }
    });

    const trip = await backend.entities.Trip.create({
      ...form,
      title: res.title || form.title || `${form.destination} Adventure`,
      notes: res.notes || form.notes,
      budget_total: res.budget_total || (form.budget_total ? Number(form.budget_total) : undefined),
      status: "planned",
      is_ai_generated: true,
    });

    if (res.activities?.length > 0) {
      for (const act of res.activities) {
        await backend.entities.ItineraryItem.create({
          trip_id: trip.id,
          day_number: act.day || 1,
          time: act.time || "",
          activity_name: act.name,
          location: act.location || "",
          description: act.description || "",
          budget: act.budget || 0,
          category: act.category || "activity",
          duration_minutes: act.duration_minutes || 60,
          booking_status: "not_booked",
        });
      }
    }

    navigate(`/itinerary/${trip.id}`);
    } catch {
      toast.error("Couldn't generate the trip. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async (status = "draft") => {
    if (!form.title || !form.destination) return;
    setSaving(true);
    try {
      const payload = { ...form, status, budget_total: form.budget_total ? Number(form.budget_total) : undefined };
      const trip = isEdit
        ? await backend.entities.Trip.update(tripId, payload)
        : await backend.entities.Trip.create(payload);
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(isEdit ? "Trip updated" : "Trip created");
      navigate(`/itinerary/${trip.id}`);
    } catch {
      toast.error("Couldn't save the trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title={isEdit ? "Edit Trip" : "New Itinerary"} subtitle={isEdit ? "Update your journey" : "Plan your next journey"} showBack />

      <div className="px-6 space-y-5 mt-2">
        {/* AI Suggestion Banner */}
        {!isEdit && (
        <button
          onClick={handleAISuggestion}
          disabled={!form.destination || aiLoading}
          className="w-full glass-gold rounded-2xl p-4 flex items-center gap-3 hover:glow-gold transition-all disabled:opacity-40"
        >
          <div className="w-10 h-10 rounded-xl bg-ich-gold/20 flex items-center justify-center flex-shrink-0">
            {aiLoading ? <Loader2 className="w-5 h-5 text-gold animate-spin" /> : <Sparkles className="w-5 h-5 text-gold" />}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gold">{aiLoading ? "Generating suggestions..." : "AI Suggestion"}</p>
            <p className="text-[11px] text-ich-neutral/60">Enter destination first, then auto-fill your trip details</p>
          </div>
        </button>
        )}

        {/* Title & Destination */}
        <GlassCard className="p-4 space-y-3">
          <div>
            <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Trip Title</label>
            <Input 
              value={form.title}
              onChange={e => update("title", e.target.value)}
              placeholder="e.g., Bali Paradise Getaway"
              className="bg-white/5 border-white/10 text-ich-white placeholder:text-ich-neutral/30 rounded-xl h-11"
            />
          </div>
          <div>
            <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <Input 
                value={form.destination}
                onChange={e => update("destination", e.target.value)}
                placeholder="City, country, or island"
                className="bg-white/5 border-white/10 text-ich-white placeholder:text-ich-neutral/30 rounded-xl h-11 pl-10"
              />
            </div>
          </div>
        </GlassCard>

        {/* Dates */}
        <GlassCard className="p-4">
         <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Travel Dates</label>
         <div className="grid grid-cols-2 gap-3">
           <div>
             <p className="text-[10px] text-ich-neutral/50 mb-1">From</p>
             <DateTimePicker 
               type="date"
               value={form.start_date}
               onChange={v => update("start_date", v)}
               label="Departure Date"
             />
           </div>
           <div>
             <p className="text-[10px] text-ich-neutral/50 mb-1">To</p>
             <DateTimePicker 
               type="date"
               value={form.end_date}
               onChange={v => update("end_date", v)}
               label="Return Date"
             />
           </div>
         </div>
        </GlassCard>

        {/* Travelers & Budget */}
        <GlassCard className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Travelers</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
                <Input 
                  type="number"
                  min={1}
                  value={form.travelers}
                  onChange={e => update("travelers", parseInt(e.target.value))}
                  className="bg-white/5 border-white/10 text-ich-white rounded-xl h-11 pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Budget</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gold/70">Rp</span>
                <Input
                  type="number"
                  value={form.budget_total}
                  onChange={e => update("budget_total", e.target.value)}
                  placeholder="Total"
                  className="bg-white/5 border-white/10 text-ich-white placeholder:text-ich-neutral/30 rounded-xl h-11 pl-10"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Travel Style */}
        <GlassCard className="p-4">
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Travel Style</label>
          <div className="flex flex-wrap gap-2">
            {travelStyles.map(style => (
              <button
                key={style}
                onClick={() => update("travel_style", style)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                  form.travel_style === style
                    ? "glass-gold text-gold"
                    : "glass-light text-ich-neutral/60 hover:text-ich-neutral"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Pace */}
        <GlassCard className="p-4">
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Trip Pace</label>
          <div className="grid grid-cols-3 gap-2">
            {paceOptions.map(pace => (
              <button
                key={pace}
                onClick={() => update("pace", pace)}
                className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                  form.pace === pace
                    ? "glass-gold text-gold"
                    : "glass-light text-ich-neutral/60"
                }`}
              >
                {pace}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Trip Type */}
        <GlassCard className="p-4">
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Trip Type</label>
          <div className="flex flex-wrap gap-2">
            {tripTypes.map(type => (
              <button
                key={type}
                onClick={() => update("trip_type", type)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                  form.trip_type === type
                    ? "glass-gold text-gold"
                    : "glass-light text-ich-neutral/60"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Generate with AI button */}
        {!isEdit && (
        <button
          onClick={handleGenerateFullTrip}
          disabled={!form.destination || aiGenerating}
          className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 glass-gold border border-gold text-gold hover:glow-gold"
        >
          {aiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          {aiGenerating ? "Generating your trip..." : "✨ Generate Full Trip with AI"}
        </button>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving || !form.title || !form.destination}
            className="flex-1 py-3.5 glass-light rounded-xl text-sm font-medium text-ich-neutral/80 hover:text-ich-white transition-all disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave("planned")}
            disabled={saving || !form.title || !form.destination}
            className="flex-1 py-3.5 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all disabled:opacity-40"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}