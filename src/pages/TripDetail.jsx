import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Calendar, Edit, Share2, Copy, Trash2, MoreVertical, Plus, Wand2, Loader2, Lock, CreditCard, Sparkles, MessageCircle } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import DayTimeline from "../components/itinerary/DayTimeline";
import { formatIDR, formatIDRCompact } from "@/lib/currency";
import moment from "moment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { confirmDialog } from "@/components/ConfirmDialog";
import { tripAccess } from "@/lib/payments";
import { isPlan } from "@/data/tripKinds";
import { inquiryForTrip } from "@/lib/inquiry";

// Lead pipeline stages, said the way a traveller would understand them.
const INQUIRY_STAGE = {
  new: "we'll be in touch shortly",
  contacted: "one of our team has picked it up",
  quoted: "a quote is on its way to you",
  won: "confirmed — see your bookings",
  lost: "closed",
};

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "traveler" });
  const [savingInvite, setSavingInvite] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [inquiry, setInquiry] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const trips = await base44.entities.Trip.filter({ id: tripId });
        if (trips.length > 0) setTrip(trips[0]);

        const itineraryItems = await base44.entities.ItineraryItem.filter({ trip_id: tripId });
        setItems(itineraryItems.sort((a, b) => (a.day_number - b.day_number) || (a.sort_order - b.sort_order)));
        const mem = await base44.entities.TripMember.filter({ trip_id: tripId });
        setMembers(mem);
        // Drives the lock: a package trip stays sealed until its booking is settled.
        setBookings(await base44.entities.Booking.filter({ trip_id: tripId }));
        // A plan carries an inquiry; show the traveller where it got to.
        setInquiry(await inquiryForTrip(tripId));
      } catch {
        // Never leave the page on a spinner with no explanation.
        toast.error("Couldn't load this trip. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  const reloadMembers = async () => setMembers(await base44.entities.TripMember.filter({ trip_id: tripId }));
  const addMember = async () => {
    if (!invite.name) { toast.error("Name is required"); return; }
    setSavingInvite(true);
    try {
      await base44.entities.TripMember.create({ trip_id: tripId, name: invite.name, email: invite.email, role: invite.role, status: "invited" });
      setInvite({ name: "", email: "", role: "traveler" });
      setShowInvite(false);
      await reloadMembers();
      toast.success("Invitation sent");
    } catch { toast.error("Couldn't add traveler"); }
    finally { setSavingInvite(false); }
  };
  const removeMember = async (m) => {
    const ok = await confirmDialog({
      title: "Remove this traveler?",
      body: `${m.name || "This traveler"} will be taken off this trip and will lose access to it. You'd have to invite them again to bring them back.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    await base44.entities.TripMember.delete(m.id);
    await reloadMembers();
    toast("Traveler removed");
  };

  const handleDelete = async () => {
    const ok = await confirmDialog({
      title: "Delete this trip?",
      body: `${trip?.title || "This trip"} and its entire itinerary will be permanently deleted. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
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
    try {
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
    } catch {
      toast.error("Couldn't generate activities. Please try again.");
    } finally {
      // Always release the button — never strand the user on "Generating…".
      setAiGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) return (
    <div className="animate-fade-in">
      <PageHeader title="Trip not found" showBack />
      <p className="px-6 text-sm text-ich-neutral/70">This trip is no longer available.</p>
    </div>
  );

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

  const access = tripAccess(trip, bookings);
  const plan = isPlan(trip);

  return (
    <div className="animate-fade-in">
      {/* Cover Image */}
      <div className="relative h-56">
        <img 
          src={trip.cover_image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"} 
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ich-primary via-ich-primary/50 to-transparent" />
        
        {/* Back & Actions */}
        <div className="absolute top-0 left-0 right-0">
          <PageHeader 
            showBack
            title=""
            rightAction={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Trip options" className="w-10 h-10 glass-light rounded-xl flex items-center justify-center text-ich-neutral">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-ich-primary/10 text-ich-primary min-w-[180px]">
                  <DropdownMenuItem onClick={() => navigate(`/itinerary/${tripId}/edit`)} className="text-ich-primary/80 focus:text-ich-primary focus:bg-ich-primary/5">
                    <Edit className="w-4 h-4 mr-2" /> Edit Trip
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} className="text-ich-primary/80 focus:text-ich-primary focus:bg-ich-primary/5">
                    <Copy className="w-4 h-4 mr-2" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: trip.title, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast("Link copied");
                      }
                    }}
                    className="text-ich-primary/80 focus:text-ich-primary focus:bg-ich-primary/5"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-300 focus:bg-red-500/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        </div>

        {/* Trip Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 min-w-0">
          {plan ? (
            <span className="text-[10px] px-2.5 py-1 rounded-full border mb-2 inline-flex items-center gap-1 bg-gold/15 text-gold border-gold/20">
              <Sparkles className="w-3 h-3" /> Trip plan
            </span>
          ) : (
            <span className={`text-[10px] px-2.5 py-1 rounded-full border capitalize mb-2 inline-block ${
              trip.status === "active" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-gold/15 text-gold border-gold/20"
            }`}>
              {trip.status}
            </span>
          )}
          <h1 className="text-2xl font-display font-bold text-white mb-1 truncate">{trip.title}</h1>
          <div className="flex items-center gap-3 text-white/80">
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
        <GlassCard className="p-4 text-center min-w-0">
          <p className="stat-value text-lg font-display font-bold text-ich-primary">{totalDays}</p>
          <p className="text-[10px] text-ich-neutral uppercase tracking-wider mt-1">Days</p>
        </GlassCard>
        <GlassCard className="p-4 text-center min-w-0">
          <p className="stat-value text-lg font-display font-bold text-gold" title={formatIDR(totalBudget)}>
            {formatIDRCompact(totalBudget)}
          </p>
          <p className="text-[10px] text-ich-neutral/60 uppercase tracking-wider mt-1">Budget</p>
        </GlassCard>
        <GlassCard className="p-4 text-center min-w-0">
          <p className="stat-value text-lg font-display font-bold text-ich-primary">
            {completedItems}/{items.length}
          </p>
          <p className="text-[10px] text-ich-neutral uppercase tracking-wider mt-1">Done</p>
        </GlassCard>
      </div>

      {/* A plan isn't booked. Say so plainly, and show where the inquiry got to. */}
      {plan && !access.locked && (
        <div className="px-6 mt-6">
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl glass-gold flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ich-primary">This is a proposal, not a booking</p>
                <p className="text-xs text-ich-neutral leading-relaxed mt-1">
                  {inquiry
                    ? `Our team has your inquiry${INQUIRY_STAGE[inquiry.status] ? ` — ${INQUIRY_STAGE[inquiry.status]}` : ""}. Nothing is reserved until you confirm a quote.`
                    : "Nothing is reserved. Send it to our team and they'll come back with a quote."}
                </p>
                <button
                  onClick={() => navigate("/assistant")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold press"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Talk to a travel expert
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Locked: the trip is visible, its detail isn't. Settle the balance to open it. */}
      {access.locked ? (
        <div className="px-6 mt-8 pb-28">
          <GlassCard className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl glass-gold flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-gold" />
            </div>
            <h2 className="text-base font-display font-bold text-ich-primary mb-1.5">Trip locked</h2>
            <p className="text-sm text-ich-neutral leading-relaxed max-w-[280px] mx-auto">
              Your day-by-day itinerary, contacts and travel documents open as soon as this trip
              is paid in full.
            </p>

            <div className="mt-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-ich-neutral/60 uppercase tracking-wider">Paid so far</span>
                <span className="text-[11px] text-gold font-medium">{Math.round(access.progress * 100)}%</span>
              </div>
              <div
                className="h-2 rounded-full bg-white/10 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(access.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Payment progress"
              >
                <div
                  className="h-full rounded-full bg-ich-gold transition-all"
                  style={{ width: `${Math.max(4, access.progress * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <span className="text-sm text-ich-neutral/70">Balance remaining</span>
                <span className="text-base font-display font-bold text-gold">{formatIDR(access.balance)}</span>
              </div>
              {access.booking?.balance_due_date && (
                <p className="text-[11px] text-ich-neutral/50 mt-1.5">
                  Due by {moment(access.booking.balance_due_date).format("MMM D, YYYY")}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate(`/booking/${access.booking.id}/checkout`)}
              className="w-full py-3.5 mt-6 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Pay {formatIDR(access.balance)} to unlock
            </button>
          </GlassCard>

          {/* A taste of what's inside, without giving it away. */}
          {items.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ich-primary tracking-wide uppercase mb-3">
                {items.length} activities waiting
              </h3>
              <GlassCard className="p-2" aria-label={`${items.length} activities, locked until paid`}>
                {items.slice(0, 3).map((it, i) => (
                  <div key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg glass-light flex items-center justify-center text-[11px] text-ich-neutral shrink-0">
                      D{it.day_number || i + 1}
                    </div>
                    {/* A placeholder bar, not a blurred title — CSS blur still
                        leaves the real text in the DOM for anyone who looks. */}
                    <div className="min-w-0 flex-1" aria-hidden="true">
                      <div
                        className="h-2.5 rounded-full bg-ich-primary/10"
                        style={{ width: `${55 + ((i * 17) % 35)}%` }}
                      />
                    </div>
                    <Lock className="w-3.5 h-3.5 text-ich-neutral/40 shrink-0" />
                  </div>
                ))}
              </GlassCard>
            </div>
          )}
        </div>
      ) : (
      <>
      {/* Travelers */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ich-primary tracking-wide uppercase">Travelers ({members.length})</h2>
          <button onClick={() => setShowInvite((v) => !v)} className="flex items-center gap-1 text-xs text-gold">
            <Plus className="w-4 h-4" /> Invite
          </button>
        </div>
        <GlassCard className="p-2">
          {members.length === 0 && !showInvite && (
            <p className="text-sm text-ich-neutral/70 px-3 py-3">No travelers yet — invite someone to join this trip.</p>
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 group">
              <div className="w-9 h-9 rounded-full glass-gold text-gold flex items-center justify-center font-display font-semibold shrink-0 uppercase">{(m.name || "?").trim().charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ich-primary truncate">{m.name}</p>
                <p className="text-[11px] text-ich-neutral truncate capitalize">{m.role} · {m.status}</p>
              </div>
              <button onClick={() => removeMember(m)} aria-label="Remove traveler" className="w-9 h-9 rounded-lg flex items-center justify-center text-ich-neutral/60 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {showInvite && (
            <div className="p-3 mt-1 border-t border-ich-primary/10 space-y-2">
              <input value={invite.name} onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))} placeholder="Name" aria-label="Guest name" className="w-full glass-light rounded-xl px-3 py-2.5 text-sm text-ich-primary placeholder:text-ich-neutral/50 outline-none" />
              <input value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} placeholder="Email (optional)" aria-label="Guest email" className="w-full glass-light rounded-xl px-3 py-2.5 text-sm text-ich-primary placeholder:text-ich-neutral/50 outline-none" />
              <select value={invite.role} onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))} aria-label="Guest role" className="w-full glass-light rounded-xl px-3 py-2.5 text-sm text-ich-primary outline-none capitalize">
                <option value="traveler">Traveler</option>
                <option value="organizer">Organizer</option>
                <option value="guest">Guest</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button onClick={addMember} disabled={savingInvite} className="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {savingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send invite
                </button>
                <button onClick={() => setShowInvite(false)} className="px-4 py-2.5 glass-light rounded-xl text-sm text-ich-neutral">Cancel</button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Day Timeline */}
      <div className="px-6 mt-8 space-y-5 pb-28">
        {/* Generate Activities with AI */}
        {items.length === 0 && (
          <button
            onClick={handleGenerateActivities}
            disabled={aiGenerating}
            className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 glass-gold border border-gold text-gold hover:glow-gold mb-4"
          >
            {aiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {aiGenerating ? "Generating activities..." : "✨ Generate Activities with AI"}
          </button>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ich-primary tracking-wide uppercase">Itinerary</h2>
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
      </>
      )}
    </div>
  );
}