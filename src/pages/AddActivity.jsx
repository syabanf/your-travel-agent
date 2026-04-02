import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import DateTimePicker from "../components/DateTimePicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, MapPin, DollarSign, Tag, FileText, Ticket, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

const categories = ["transport", "accommodation", "dining", "attraction", "activity", "shopping", "rest", "other"];

export default function AddActivity() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const dayParam = urlParams.get("day");

  const [form, setForm] = useState({
    trip_id: tripId,
    day_number: dayParam ? parseInt(dayParam) : 1,
    time: "",
    activity_name: "",
    location: "",
    description: "",
    duration_minutes: "",
    budget: "",
    reservation_required: false,
    booking_status: "not_booked",
    notes: "",
    category: "activity",
    is_completed: false,
    sort_order: 0,
    booking_id: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.activity_name) return;
    setSaving(true);
    try {
      await base44.entities.ItineraryItem.create({
        ...form,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
      navigate(`/itinerary/${tripId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Add Activity" subtitle={`Day ${form.day_number}`} showBack />

      <div className="px-6 space-y-4 mt-2">
        <GlassCard className="p-4 space-y-3">
          <div>
            <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Activity Name</label>
            <Input 
              value={form.activity_name}
              onChange={e => update("activity_name", e.target.value)}
              placeholder="e.g., Visit Ubud Temple"
              className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11"
            />
          </div>
          <div>
            <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <Input 
                value={form.location}
                onChange={e => update("location", e.target.value)}
                placeholder="Location or address"
                className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11 pl-10"
              />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Day</label>
              <Input 
                type="number" min={1}
                value={form.day_number}
                onChange={e => update("day_number", parseInt(e.target.value))}
                className="bg-white/5 border-white/10 text-mora-white rounded-xl h-11"
              />
            </div>
            <div>
              <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Time</label>
              <DateTimePicker 
                type="time"
                value={form.time}
                onChange={v => update("time", v)}
                label="Activity Time"
              />
            </div>
            <div>
              <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Duration</label>
              <div className="relative">
                <Input 
                  type="number"
                  value={form.duration_minutes}
                  onChange={e => update("duration_minutes", e.target.value)}
                  placeholder="min"
                  className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2.5 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => update("category", cat)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                  form.category === cat ? "glass-gold text-gold" : "glass-light text-mora-neutral/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 space-y-3">
          <div>
            <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Budget</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50" />
              <Input 
                type="number"
                value={form.budget}
                onChange={e => update("budget", e.target.value)}
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11 pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Notes</label>
            <Textarea 
              value={form.notes}
              onChange={e => update("notes", e.target.value)}
              placeholder="Additional notes..."
              className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl min-h-[80px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-mora-neutral/70">Reservation Required</span>
            <button 
              onClick={() => update("reservation_required", !form.reservation_required)}
              className={`w-10 h-6 rounded-full transition-all ${form.reservation_required ? "bg-mora-gold" : "bg-white/10"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${form.reservation_required ? "translate-x-4" : ""}`} />
            </button>
          </div>

          {/* Browse Booking */}
          <div>
            <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">Link Booking</label>
            <div className="flex gap-2">
              <Input
                value={form.booking_id}
                onChange={e => update("booking_id", e.target.value)}
                placeholder="Booking ID (optional)"
                className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11 flex-1"
              />
              <Link
                to="/booking"
                className="flex items-center gap-1.5 px-3 h-11 glass-gold rounded-xl text-xs font-semibold text-gold hover:glow-gold transition-all flex-shrink-0"
              >
                <Ticket className="w-3.5 h-3.5" /> Browse
              </Link>
            </div>
          </div>

          {form.location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2.5 px-3 glass-light rounded-xl text-xs text-mora-neutral/70 hover:text-gold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-gold" /> View "{form.location}" on Maps
            </a>
          )}
        </GlassCard>

        <button
          onClick={handleSave}
          disabled={saving || !form.activity_name}
          className="w-full py-3.5 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all disabled:opacity-40 mb-6"
        >
          {saving ? "Saving..." : "Add Activity"}
        </button>
      </div>
    </div>
  );
}