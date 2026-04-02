import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Calendar, Users, DollarSign, Edit, Share2, Copy, Trash2, MoreVertical, Plus, CheckCircle, Wand2, Loader2 } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import DayTimeline from "../components/itinerary/DayTimeline";
import moment from "moment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      const trips = await base44.entities.Trip.filter({ id: tripId });
      if (trips.length > 0) setTrip(trips[0]);
      
      const itineraryItems = await base44.entities.ItineraryItem.filter({ trip_id: tripId });
      setItems(itineraryItems.sort((a, b) => (a.day_number - b.day_number) || (a.sort_order - b.sort_order)));
      setLoading(false);
    };
    load();
  }, [tripId]);

  const handleDelete = async () => {
    await base44.entities.Trip.delete(tripId);
    navigate("/itinerary");
  };

  const handleDuplicate = async () => {
    if (!trip) return;
    const { id, created_date, updated_date, created_by, ...data } = trip;
    const newTrip = await base44.entities.Trip.create({ ...data, title: `${data.title} (Copy)`, status: "draft" });
    for (const item of items) {
      const { id: iId, created_date: icd, updated_date: iud, created_by: icb, ...itemData } = item;
      await base44.entities.ItineraryItem.create({ ...itemData, trip_id: newTrip.id });
    }
    navigate(`/itinerary/${newTrip.id}`);
  };

  const handleGenerateActivities = async () => {
    if (!trip) return;
    setAiGenerating(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a detailed ${trip.travel_style || 'luxury'} travel itinerary for ${trip.destination}${
        trip.start_date ? ` from ${trip.start_date} to ${trip.end_date || trip.start_date}` : ` for ${totalDays} days`
      }. Pace: ${trip.pace || 'moderate'}. Trip type: ${trip.trip_type || 'couple'}. Travelers: ${trip.travelers || 2}.
IMPORTANT: The trip is exactly ${totalDays} day(s). Only generate activities for days 1 to ${totalDays}. Do NOT exceed day ${totalDays}. Spread activities evenly across all ${totalDays} day(s).`,
      response_json_schema: {
        type: "object",
        properties: {
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

    if (res.activities?.length > 0) {
      for (const act of res.activities) {
        await base44.entities.ItineraryItem.create({
          trip_id: tripId,
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
      // Reload items
      const updated = await base44.entities.ItineraryItem.filter({ trip_id: tripId });
      setItems(updated.sort((a, b) => (a.day_number - b.day_number) || (a.sort_order - b.sort_order)));
    }
    setAiGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) return null;

  const totalDays = trip.start_date && trip.end_date
    ? Math.max(1, moment(trip.end_date).diff(moment(trip.start_date), "days") + 1)
    : Math.max(1, ...items.map(i => i.day_number || 1), 1);

  const totalBudget = items.reduce((sum, item) => sum + (item.budget || 0), 0);
  const completedItems = items.filter(i => i.is_completed).length;

  // Group items by day — only within the date range
  const validItems = trip.start_date && trip.end_date
    ? items.filter(i => i.day_number >= 1 && i.day_number <= totalDays)
    : items;

  const dayGroups = {};
  for (let d = 1; d <= totalDays; d++) {
    dayGroups[d] = validItems.filter(i => i.day_number === d);
  }

  return (
    <div className="animate-fade-in">
      {/* Cover Image */}
      <div className="relative h-56">
        <img 
          src={trip.cover_image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"} 
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22] via-[#1a2e22]/50 to-transparent" />
        
        {/* Back & Actions */}
        <div className="absolute top-0 left-0 right-0">
          <PageHeader 
            showBack
            title=""
            rightAction={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-mora-white/80">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-white/10 text-mora-white min-w-[180px]">
                  <DropdownMenuItem onClick={() => navigate(`/itinerary/${tripId}/edit`)} className="text-mora-white/80 focus:text-mora-white focus:bg-white/10">
                    <Edit className="w-4 h-4 mr-2" /> Edit Trip
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} className="text-mora-white/80 focus:text-mora-white focus:bg-white/10">
                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-mora-white/80 focus:text-mora-white focus:bg-white/10">
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </div>

        {/* Trip Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className={`text-[10px] px-2.5 py-1 rounded-full border capitalize mb-2 inline-block ${
            trip.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-[#A5997E]/15 text-gold border-[#A5997E]/20"
          }`}>
            {trip.status}
          </span>
          <h1 className="text-2xl font-display font-bold text-mora-white mb-1">{trip.title}</h1>
          <div className="flex items-center gap-3 text-mora-neutral/70">
            <span className="flex items-center gap-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-gold" /> {trip.destination}
            </span>
            {trip.start_date && (
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                {moment(trip.start_date).format("MMM D")} - {moment(trip.end_date).format("MMM D")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-6 -mt-2 relative z-10">
        <GlassCard className="p-4 text-center">
          <p className="text-lg font-display font-bold text-mora-white">{totalDays}</p>
          <p className="text-[10px] text-mora-neutral/60 uppercase tracking-wider">Days</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-lg font-display font-bold text-gold">
            ${totalBudget.toLocaleString()}
          </p>
          <p className="text-[10px] text-mora-neutral/60 uppercase tracking-wider">Budget</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-lg font-display font-bold text-mora-white">
            {completedItems}/{items.length}
          </p>
          <p className="text-[10px] text-mora-neutral/60 uppercase tracking-wider">Done</p>
        </GlassCard>
      </div>

      {/* Day Timeline */}
      <div className="px-6 mt-8 space-y-5 pb-8">
        {/* Generate Activities with AI */}
        {items.length === 0 && (
          <button
            onClick={handleGenerateActivities}
            disabled={aiGenerating}
            className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-gradient-to-r from-[#A5997E]/30 to-[#606A54]/20 border border-[#A5997E]/30 text-gold hover:glow-gold mb-4"
          >
            {aiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {aiGenerating ? "Generating activities..." : "✨ Generate Activities with AI"}
          </button>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-mora-white/90 tracking-wide uppercase">Itinerary</h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={handleGenerateActivities}
                disabled={aiGenerating}
                className="flex items-center gap-1 text-xs text-gold disabled:opacity-50"
              >
                {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {aiGenerating ? "Generating..." : "AI Generate"}
              </button>
            )}
            <Link 
              to={`/itinerary/${tripId}/add`}
              className="flex items-center gap-1.5 text-xs text-gold"
            >
              <Plus className="w-4 h-4" /> Add Activity
            </Link>
          </div>
        </div>

        {Object.entries(dayGroups).map(([day, dayItems]) => (
          <DayTimeline 
            key={day} 
            dayNumber={parseInt(day)} 
            date={trip.start_date ? moment(trip.start_date).add(day - 1, "days").format("YYYY-MM-DD") : null}
            items={dayItems}
            tripId={tripId}
          />
        ))}
      </div>
    </div>
  );
}