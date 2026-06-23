import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { printDocument, tripItineraryHTML } from "@/lib/voucher";
import { toast } from "sonner";
import moment from "moment";
import { ArrowLeft, MapPin, CheckCircle2, Circle, Wallet, ListChecks, Activity, Users, Trash2, UserPlus, Pencil, Loader2, Save, Printer, User } from "lucide-react";

const statusPill = {
  active: "bg-emerald-500/15 text-emerald-600",
  confirmed: "bg-emerald-500/15 text-emerald-600",
  planned: "bg-blue-500/15 text-blue-600",
  completed: "bg-blue-500/15 text-blue-600",
  draft: "bg-mora-primary/10 text-mora-neutral",
  cancelled: "bg-red-500/15 text-red-600",
};

const TRIP_STATUSES = ["draft", "planned", "active", "completed", "cancelled"];
const MEMBER_ROLES = ["organizer", "traveler", "guest"];
const MEMBER_STATUSES = ["confirmed", "invited", "declined"];
const roleBadge = { organizer: "bg-mora-gold/15 text-gold", traveler: "bg-mora-primary/10 text-mora-primary", guest: "bg-slate-400/20 text-slate-600" };
const memberStatusBadge = { confirmed: "bg-emerald-500/15 text-emerald-600", invited: "bg-mora-gold/10 text-gold", declined: "bg-red-500/15 text-red-600" };
const EMPTY_MEMBER = { name: "", email: "", phone: "", role: "traveler", status: "invited" };

const Pill = ({ s }) => (
  <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[s] || statusPill.draft}`}>{s || "—"}</span>
);

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 p-4 min-w-0">
      <div className="flex items-center gap-2 text-mora-neutral text-xs font-medium">
        <Icon className="w-4 h-4 text-gold" />
        {label}
      </div>
      <div className="stat-value mt-1.5 text-lg lg:text-xl font-display font-bold text-mora-primary">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export default function DashboardTripDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [related, setRelated] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberForm, setMemberForm] = useState(null);
  const [savingMember, setSavingMember] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannerOk, setBannerOk] = useState(true);
  const [relatedQ, setRelatedQ] = useState("");
  const [relatedType, setRelatedType] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [trips, itineraryItems, allBookings, tripMembers] = await Promise.all([
          base44.entities.Trip.filter({ id }),
          base44.entities.ItineraryItem.filter({ trip_id: id }),
          base44.entities.Booking.list("-created_date", 500),
          base44.entities.TripMember.filter({ trip_id: id }),
        ]);
        if (!alive) return;
        const t0 = trips?.[0] || null;
        setTrip(t0);
        setItems(Array.isArray(itineraryItems) ? itineraryItems : []);
        setRelated((Array.isArray(allBookings) ? allBookings : []).filter((b) => b.trip_id === id));
        setMembers(Array.isArray(tripMembers) ? tripMembers : []);
        if (t0?.customer_id) base44.entities.Customer.filter({ id: t0.customer_id }).then((r) => alive && setCustomer(r[0] || null));
      } catch {
        if (alive) toast.error("Couldn't load this trip");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const back = (
    <Link to="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-mora-primary transition-colors">
      <ArrowLeft className="w-4 h-4" /> Back to Trips &amp; Bookings
    </Link>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <Spinner />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="mt-6 bg-white rounded-2xl border border-mora-primary/10 p-10 text-center">
          <p className="text-mora-primary font-display font-bold text-lg">Trip not found</p>
          <p className="text-sm text-mora-neutral mt-1">It may have been deleted or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const completedCount = items.filter((i) => i.is_completed).length;

  const updateStatus = async (status) => {
    try {
      await base44.entities.Trip.update(id, { status });
      setTrip((t) => ({ ...t, status }));
      toast.success("Status updated");
    } catch {
      toast.error("Couldn't update status");
    }
  };

  const deleteTrip = async () => {
    try {
      await base44.entities.Trip.delete(id);
      toast.success("Trip deleted");
      navigate("/dashboard/bookings");
    } catch {
      toast.error("Couldn't delete trip");
    }
  };

  const printItinerary = () => printDocument("MORA Itinerary", tripItineraryHTML(trip, items, members));

  // --- Members ---
  const canManageMembers = can(role, "trips", "create") || can(role, "trips", "edit") || can(role, "trips", "delete");
  const loadMembers = async () => setMembers(await base44.entities.TripMember.filter({ trip_id: id }));
  const startAddMember = () => setMemberForm({ ...EMPTY_MEMBER });
  const startEditMember = (m) => setMemberForm({ ...EMPTY_MEMBER, ...m });
  const updMember = (k, v) => setMemberForm((p) => ({ ...p, [k]: v }));
  const saveMember = async () => {
    if (!memberForm.name) { toast.error("Name is required"); return; }
    setSavingMember(true);
    try {
      const payload = {
        trip_id: id, name: memberForm.name, email: memberForm.email, phone: memberForm.phone,
        role: memberForm.role || "traveler", status: memberForm.status || "invited",
      };
      if (memberForm.id) await base44.entities.TripMember.update(memberForm.id, payload);
      else await base44.entities.TripMember.create(payload);
      toast.success(memberForm.id ? "Member updated" : "Member added");
      setMemberForm(null);
      await loadMembers();
    } catch { toast.error("Couldn't save member"); }
    finally { setSavingMember(false); }
  };
  const removeMember = async (mid) => { await base44.entities.TripMember.delete(mid); toast.success("Member removed"); loadMembers(); };

  // Sort itinerary by day then time, and group under "Day N".
  const sorted = [...items].sort((a, b) => {
    const da = a.day_number ?? 0;
    const db = b.day_number ?? 0;
    if (da !== db) return da - db;
    return String(a.time || "").localeCompare(String(b.time || ""));
  });
  const groups = sorted.reduce((acc, item) => {
    const day = item.day_number ?? 1;
    (acc[day] = acc[day] || []).push(item);
    return acc;
  }, {});
  const dayKeys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));

  const relatedNeedle = relatedQ.trim().toLowerCase();
  const relatedTypes = [...new Set(related.map((b) => b.type).filter(Boolean))];
  const filteredRelated = related.filter((b) => {
    if (relatedType && b.type !== relatedType) return false;
    return !relatedNeedle || `${b.title || ""} ${b.type || ""}`.toLowerCase().includes(relatedNeedle);
  });

  const dateRange = trip.start_date && trip.end_date
    ? `${moment(trip.start_date).format("MMM D")} – ${moment(trip.end_date).format("MMM D, YYYY")}`
    : trip.start_date
      ? moment(trip.start_date).format("MMM D, YYYY")
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* 1. Banner or plain header */}
      {trip.cover_image && bannerOk ? (
        <div className="relative mt-4 rounded-2xl overflow-hidden">
          <img
            src={trip.cover_image}
            alt={trip.title}
            onError={() => setBannerOk(false)}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <h1 className="absolute bottom-4 left-5 right-5 text-2xl font-display font-bold text-white drop-shadow">
            {trip.title || "Untitled trip"}
          </h1>
        </div>
      ) : (
        <header className="mt-4">
          <h1 className="text-2xl font-display font-bold text-mora-primary">{trip.title || "Untitled trip"}</h1>
        </header>
      )}

      {/* 2. Sub-header */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-mora-neutral flex-1 min-w-0">
          {trip.destination && (
            <span className="inline-flex items-center gap-1.5 text-mora-primary font-medium">
              <MapPin className="w-4 h-4 text-gold" /> {trip.destination}
            </span>
          )}
          <Pill s={trip.status} />
          {dateRange && <span>{dateRange}</span>}
          {customer && (
            <Link to={`/dashboard/customers/${customer.id}`} className="inline-flex items-center gap-1.5 text-mora-primary hover:text-gold">
              <User className="w-4 h-4 text-gold" /> {customer.name}
            </Link>
          )}
        </div>
        <button onClick={printItinerary} className="inline-flex items-center gap-1.5 text-sm font-medium text-mora-primary bg-mora-primary/5 hover:bg-mora-primary/10 px-3 py-1.5 rounded-xl shrink-0">
          <Printer className="w-4 h-4" /> Print itinerary
        </button>
      </div>

      {/* 3. KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Kpi icon={Wallet} label="Budget" value={formatIDR(trip.budget_total)} />
        <Kpi icon={Activity} label="Activities" value={items.length} />
        <Kpi icon={ListChecks} label="Completed" value={`${completedCount}/${items.length}`} />
        <Kpi icon={Users} label="Travelers" value={members.length || trip.travelers || "—"} />
      </div>

      {/* 4. Itinerary */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mt-6">
        <h2 className="font-display font-bold text-mora-primary mb-3">Itinerary</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-mora-neutral">No activities yet</p>
        ) : (
          <div className="space-y-5">
            {dayKeys.map((day) => (
              <div key={day}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-mora-neutral mb-2">Day {day}</h3>
                <ul className="space-y-2">
                  {groups[day].map((item) => (
                    <li key={item.id} className="flex items-start gap-3 rounded-xl bg-mora-primary/[0.03] px-3 py-2.5">
                      <span className="shrink-0 mt-0.5">
                        {item.is_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-mora-neutral/50" />
                        )}
                      </span>
                      {item.time && <span className="shrink-0 text-xs font-medium text-gold tabular-nums mt-0.5 w-14">{item.time}</span>}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-mora-primary">{item.activity_name || "Activity"}</p>
                        {item.location && (
                          <span className="inline-flex items-center gap-1 text-xs text-mora-neutral mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> {item.location}
                          </span>
                        )}
                      </div>
                      {item.budget > 0 && (
                        <span className="shrink-0 text-xs font-medium text-mora-primary mt-0.5">{formatIDR(item.budget)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Members / roster */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-mora-primary">
            Members <span className="text-mora-neutral font-body font-normal text-sm">({members.length})</span>
          </h2>
          {!memberForm && can(role, "trips", "create") && (
            <button onClick={startAddMember} className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:opacity-80">
              <UserPlus className="w-4 h-4" /> Add member
            </button>
          )}
        </div>

        {memberForm && (
          <div className="rounded-xl border border-mora-primary/10 bg-mora-primary/[0.02] p-4 mb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name"><input value={memberForm.name} onChange={(e) => updMember("name", e.target.value)} className="dash-input" placeholder="Jane Traveler" /></Field>
              <Field label="Email"><input value={memberForm.email} onChange={(e) => updMember("email", e.target.value)} className="dash-input" placeholder="jane@example.com" /></Field>
              <Field label="Phone"><input value={memberForm.phone} onChange={(e) => updMember("phone", e.target.value)} className="dash-input" placeholder="+62…" /></Field>
              <Field label="Role">
                <select value={memberForm.role} onChange={(e) => updMember("role", e.target.value)} className="dash-input capitalize">
                  {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={memberForm.status} onChange={(e) => updMember("status", e.target.value)} className="dash-input capitalize">
                  {MEMBER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={saveMember} disabled={savingMember} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {savingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setMemberForm(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
            </div>
          </div>
        )}

        {members.length === 0 && !memberForm ? (
          <p className="text-sm text-mora-neutral">No members yet{can(role, "trips", "create") ? " — add the first traveler." : "."}</p>
        ) : (
          <ul className="divide-y divide-mora-primary/5">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3 group">
                <div className="w-9 h-9 rounded-full bg-mora-gold/10 text-gold flex items-center justify-center font-display font-semibold shrink-0 uppercase">{(m.name || "?").trim().charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-mora-primary truncate">{m.name}</p>
                  <p className="text-xs text-mora-neutral truncate">{m.email || m.phone || "—"}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${roleBadge[m.role] || roleBadge.traveler}`}>{m.role}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${memberStatusBadge[m.status] || memberStatusBadge.invited}`}>{m.status}</span>
                {canManageMembers && (
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {can(role, "trips", "edit") && <button onClick={() => startEditMember(m)} className="w-7 h-7 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold"><Pencil className="w-3.5 h-3.5" /></button>}
                    {can(role, "trips", "delete") && <button onClick={() => removeMember(m.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 6. Related bookings */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mt-6">
        <h2 className="font-display font-bold text-mora-primary mb-3">Related bookings</h2>
        {related.length === 0 ? (
          <p className="text-sm text-mora-neutral">No linked bookings</p>
        ) : (
          <>
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              value={relatedQ}
              onChange={(e) => setRelatedQ(e.target.value)}
              className="dash-input flex-1 min-w-[140px]"
              placeholder="Search bookings…"
            />
            {relatedTypes.length > 0 && (
              <select value={relatedType} onChange={(e) => setRelatedType(e.target.value)} className="dash-input max-w-[150px] capitalize">
                <option value="">All types</option>
                {relatedTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          {filteredRelated.length === 0 ? (
            <p className="text-sm text-mora-neutral">No bookings match your filter.</p>
          ) : (
          <ul className="divide-y divide-mora-primary/5">
            {filteredRelated.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/dashboard/bookings/${b.id}`}
                  className="flex items-center gap-3 py-3 -mx-1 px-1 rounded-lg hover:bg-mora-primary/[0.03] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-mora-primary truncate">{b.title || "Booking"}</p>
                    {b.type && <p className="text-xs text-mora-neutral capitalize">{b.type}</p>}
                  </div>
                  <Pill s={b.status} />
                  <span className="shrink-0 text-sm font-medium text-mora-primary w-28 text-right">{formatIDR(b.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          )}
          </>
        )}
      </div>

      {/* 6. Actions (gated) */}
      {(can(role, "trips", "edit") || can(role, "trips", "delete")) && (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mt-6">
          <h2 className="font-display font-bold text-mora-primary mb-3">Actions</h2>
          <div className="flex flex-wrap items-end gap-4">
            {can(role, "trips", "edit") && (
              <div>
                <label className="block text-xs font-medium text-mora-neutral mb-1">Status</label>
                <select
                  value={trip.status || "draft"}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="dash-input max-w-xs capitalize"
                >
                  {TRIP_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {can(role, "trips", "delete") && (
              <button
                onClick={deleteTrip}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-500/10 hover:bg-red-500/15 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete trip
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
