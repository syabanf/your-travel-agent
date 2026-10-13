import { useState, useEffect } from "react";
import { backend } from "@/api/backend";
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
import ProtectedContent from "@/components/ProtectedContent";
import TripMemberInfo from "../components/itinerary/TripMemberInfo";
import { isItineraryOpen, opensOn } from "@/data/membership";
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
        const trips = await backend.entities.Trip.filter({ id: tripId });
        if (trips.length > 0) setTrip(trips[0]);

        const itineraryItems = await backend.entities.ItineraryItem.filter({ trip_id: tripId });
        setItems(itineraryItems.sort((a, b) => (a.day_number - b.day_number) || (a.sort_order - b.sort_order)));
        const mem = await backend.entities.TripMember.filter({ trip_id: tripId });
        setMembers(mem);
        // Drives the lock: a package trip stays sealed until its booking is settled.
        setBookings(await backend.entities.Booking.filter({ trip_id: tripId }));
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

  const reloadMembers = async () => setMembers(await backend.entities.TripMember.filter({ trip_id: tripId }));
  const addMember = async () => {
    if (!invite.name) { toast.error("Name is required"); return; }
    setSavingInvite(true);
    try {
      await backend.entities.TripMember.create({ trip_id: tripId, name: invite.name, email: invite.email, role: invite.role, status: "invited" });
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
    await backend.entities.TripMember.delete(m.id);
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
    await backend.entities.Trip.delete(tripId);
    navigate("/itinerary");
  };

  const handleDuplicate = async () => {
    if (!trip) return;
    const { id, created_at, updated_at, created_by, ...data } = trip;
    const newTrip = await backend.entities.Trip.create({ ...data, title: `${data.title} (Copy)`, status: "draft" });
    for (const item of items) {
      const { id: iId, created_at: icd, updated_at: iud, created_by: icb, ...itemData } = item;
      await backend.entities.ItineraryItem.create({ ...itemData, trip_id: newTrip.id });
    }
    navigate(`/itinerary/${newTrip.id}`);
  };

  const handleGenerateActivities = async () => {
    if (!trip) return;
    setAiGenerating(true);
    try {
      const res = await backend.ask({
        prompt: `Generate a detailed ${trip.travel_style || 'luxury'} travel itinerary for ${trip.destination}${
        trip.start_date ? ` from ${trip.start_date} to ${trip.end_date || trip.start_date}` : ` for ${totalDays} days`
      }. Pace: ${trip.pace || 'moderate'}. Trip type: ${trip.trip_type || 'couple'}. Travelers: ${trip.travelers || 2}.
IMPORTANT: The trip is exactly ${totalDays} day(s). Only generate activities for days 1 to ${totalDays}. Do NOT exceed day ${totalDays}. Spread activities evenly across all ${totalDays} day(s).`,
        schema: {
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
          await backend.entities.ItineraryItem.create({
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
        const updated = await backend.entities.ItineraryItem.filter({ trip_id: tripId });
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
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) return (
    <div className="animate-fade-in">
      <PageHeader title="Trip not found" showBack />
      <p className="px-6 text-sm text-muted">This trip is no longer available.</p>
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
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent" />
        
        {/* Back & Actions */}
        <div className="absolute top-0 left-0 right-0">
          <PageHeader 
            showBack
            title=""
            rightAction={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Trip options" className="w-10 h-10 bg-card shadow-card rounded-xl flex items-center justify-center text-muted">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card shadow-card border-border text-foreground min-w-[180px]">
                  <DropdownMenuItem onClick={() => navigate(`/itinerary/${tripId}/edit`)} className="text-body focus:text-foreground focus:bg-surface">
                    <Edit className="w-4 h-4 mr-2" /> Edit Trip
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} className="text-body focus:text-foreground focus:bg-surface">
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
                    className="text-body focus:text-foreground focus:bg-surface"
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-accent-strong focus:text-accent-strong focus:bg-accent-soft">
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
            <span className="text-[10px] px-2.5 py-1 rounded-full border mb-2 inline-flex items-center gap-1 bg-accent-soft text-accent-strong border-accent/20">
              <Sparkles className="w-3 h-3" /> Trip plan
            </span>
          ) : (
            <span className={`text-[10px] px-2.5 py-1 rounded-full border capitalize mb-2 inline-block ${
              trip.status === "active" ? "bg-success-soft text-success border-emerald-500/20" : "bg-accent-soft text-accent-strong border-accent/20"
            }`}>
              {trip.status}
            </span>
          )}
          <h1 className="text-2xl font-display font-bold text-white mb-1 truncate">{trip.title}</h1>
          <div className="flex items-center gap-3 text-white/80">
            <span className="flex items-center gap-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-accent-strong" /> {trip.destination}
            </span>
            {trip.start_date && (
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-accent-strong" />
                {moment(trip.start_date).format("MMM D")} - {moment(trip.end_date).format("MMM D")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-6 -mt-2 relative z-10">
        <GlassCard className="p-4 text-center min-w-0">
          <p className="stat-value text-lg font-display font-bold text-foreground">{totalDays}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Days</p>
        </GlassCard>
        <GlassCard className="p-4 text-center min-w-0">
          <p className="stat-value text-lg font-display font-bold text-accent-strong" title={formatIDR(totalBudget)}>
            {formatIDRCompact(totalBudget)}
          </p>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Budget</p>
        </GlassCard>
        <GlassCard className="p-4 text-center min-w-0">
          <p className="stat-value text-lg font-display font-bold text-foreground">
            {completedItems}/{items.length}
          </p>
          <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Done</p>
        </GlassCard>
      </div>

      {/* A plan isn't booked. Say so plainly, and show where the inquiry got to. */}
      {plan && !access.locked && (
        <div className="px-6 mt-6">
          <GlassCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-accent-strong" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">This is a proposal, not a booking</p>
                <p className="text-xs text-muted leading-relaxed mt-1">
                  {inquiry
                    ? `Our team has your inquiry${INQUIRY_STAGE[inquiry.status] ? ` — ${INQUIRY_STAGE[inquiry.status]}` : ""}. Nothing is reserved until you confirm a quote.`
                    : "Nothing is reserved. Send it to our team and they'll come back with a quote."}
                </p>
                <button
                  onClick={() => navigate("/assistant")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong press"
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
            <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-accent-strong" />
            </div>
            <h2 className="text-base font-display font-bold text-foreground mb-1.5">Trip locked</h2>
            <p className="text-sm text-muted leading-relaxed max-w-[280px] mx-auto">
              Your day-by-day itinerary, contacts and travel documents open as soon as this trip
              is paid in full.
            </p>

            <div className="mt-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted uppercase tracking-wider">Paid so far</span>
                <span className="text-[11px] text-accent-strong font-medium">{Math.round(access.progress * 100)}%</span>
              </div>
              <div
                className="h-2 rounded-full bg-surface overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(access.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Payment progress"
              >
                <div
                  className="h-full rounded-full bg-accent-strong transition-all"
                  style={{ width: `${Math.max(4, access.progress * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-sm text-muted">Balance remaining</span>
                <span className="text-base font-display font-bold text-accent-strong">{formatIDR(access.balance)}</span>
              </div>
              {access.booking?.balance_due_date && (
                <p className="text-[11px] text-muted mt-1.5">
                  Due by {moment(access.booking.balance_due_date).format("MMM D, YYYY")}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate(`/booking/${access.booking.id}/checkout`)}
              className="w-full py-3.5 mt-6 bg-accent-strong rounded-xl text-sm font-semibold text-white shadow-glow hover:bg-accent-dark transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Pay {formatIDR(access.balance)} to unlock
            </button>
          </GlassCard>

          {/* A taste of what's inside, without giving it away. */}
          {items.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">
                {items.length} activities waiting
              </h3>
              <GlassCard className="p-2" aria-label={`${items.length} activities, locked until paid`}>
                {items.slice(0, 3).map((it, i) => (
                  <div key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-8 h-8 rounded-lg bg-card shadow-card flex items-center justify-center text-[11px] text-muted shrink-0">
                      D{it.day_number || i + 1}
                    </div>
                    {/* A placeholder bar, not a blurred title — CSS blur still
                        leaves the real text in the DOM for anyone who looks. */}
                    <div className="min-w-0 flex-1" aria-hidden="true">
                      <div
                        className="h-2.5 rounded-full bg-surface"
                        style={{ width: `${55 + ((i * 17) % 35)}%` }}
                      />
                    </div>
                    <Lock className="w-3.5 h-3.5 text-muted shrink-0" />
                  </div>
                ))}
              </GlassCard>
            </div>
          )}
        </div>
      ) : (
      <>
      <TripMemberInfo trip={trip} />

      {/* Travelers */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Travelers ({members.length})</h2>
          <button onClick={() => setShowInvite((v) => !v)} className="flex items-center gap-1 text-xs text-accent-strong">
            <Plus className="w-4 h-4" /> Invite
          </button>
        </div>
        <GlassCard className="p-2">
          {members.length === 0 && !showInvite && (
            <p className="text-sm text-muted px-3 py-3">No travelers yet — invite someone to join this trip.</p>
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 group">
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent-strong flex items-center justify-center font-display font-semibold shrink-0 uppercase">{(m.name || "?").trim().charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-[11px] text-muted truncate capitalize">{m.role} · {m.status}</p>
              </div>
              <button onClick={() => removeMember(m)} aria-label="Remove traveler" className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-accent-strong hover:bg-accent-soft transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {showInvite && (
            <div className="p-3 mt-1 border-t border-border space-y-2">
              <input value={invite.name} onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))} placeholder="Name" aria-label="Guest name" className="w-full bg-card shadow-card rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none" />
              <input value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} placeholder="Email (optional)" aria-label="Guest email" className="w-full bg-card shadow-card rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none" />
              <select value={invite.role} onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))} aria-label="Guest role" className="w-full bg-card shadow-card rounded-xl px-3 py-2.5 text-sm text-foreground outline-none capitalize">
                <option value="traveler">Traveler</option>
                <option value="organizer">Organizer</option>
                <option value="guest">Guest</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button onClick={addMember} disabled={savingInvite} className="flex-1 py-2.5 bg-accent-strong text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-50 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {savingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send invite
                </button>
                <button onClick={() => setShowInvite(false)} className="px-4 py-2.5 bg-card shadow-card rounded-xl text-sm text-muted">Cancel</button>
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
            className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 bg-accent-strong border border-accent text-white shadow-glow hover:bg-accent-dark mb-4 sheen"
          >
            {aiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {aiGenerating ? "Generating activities..." : "✨ Generate Activities with AI"}
          </button>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Itinerary</h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                onClick={handleGenerateActivities}
                disabled={aiGenerating}
                className="flex items-center gap-1 text-xs text-accent-strong disabled:opacity-50"
              >
                {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                {aiGenerating ? "Generating..." : "AI Generate"}
              </button>
            )}
            <Link 
              to={`/itinerary/${tripId}/add`}
              className="flex items-center gap-1.5 text-xs text-accent-strong"
            >
              <Plus className="w-4 h-4" /> Add Activity
            </Link>
          </div>
        </div>

        {(() => {
          // A guided trip shows only the day-by-day overview until departure
          // day; the operational detail (times, meeting points) opens on H.
          if (trip.tour_leader && !isItineraryOpen(trip)) {
            return (
              <div className="space-y-3">
                <p className="flex items-center gap-2 rounded-2xl bg-info-soft px-4 py-3 text-xs font-semibold text-info">
                  <Lock className="size-4 shrink-0" aria-hidden="true" />
                  Detailed times and meeting points open on {moment(opensOn(trip, 0)).format("D MMMM YYYY")}.
                </p>
                <ol className="stagger space-y-2">
                  {Object.entries(dayGroups).map(([day, dayItems]) => (
                    <li key={day} className="flex items-start gap-3 rounded-2xl bg-card p-3 shadow-card">
                      <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                        <span className="text-[10px] font-semibold leading-none">Day</span>
                        <span className="text-sm font-bold leading-tight">{day}</span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted">{moment(trip.start_date).add(day - 1, "days").format("ddd, D MMM")}</p>
                        <p className="text-sm font-medium text-foreground">
                          {dayItems.length ? dayItems.map((i) => i.activity_name).join(" · ") : "Free day"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          }
          const days = Object.entries(dayGroups).map(([day, dayItems]) => (
            <DayTimeline
              key={day}
              dayNumber={parseInt(day)}
              date={trip.start_date ? moment(trip.start_date).add(day - 1, "days").format("YYYY-MM-DD") : null}
              items={dayItems}
              tripId={tripId}
            />
          ));
          // A proposal is unpriced work the agency doesn't want walked to a
          // competitor; a purchased trip's plan is something someone paid for.
          // A trip the traveller built themselves is theirs — leave it alone.
          const guard = plan || trip.package_id;
          return guard ? (
            <ProtectedContent
              label={plan ? "Trip plan" : "Itinerary"}
              className="space-y-5"
            >
              {days}
            </ProtectedContent>
          ) : (
            days
          );
        })()}
      </div>
      </>
      )}
    </div>
  );
}