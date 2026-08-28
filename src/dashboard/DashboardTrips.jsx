import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { tripAccess } from "@/lib/payments";
import { Plus, Pencil, Trash2, X, Loader2, Save, Search, Map, Lock, Unlock, ListChecks, Wallet, CalendarRange, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { useRole } from "./RoleContext";
import { can } from "./rbac";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { SkeletonRows, SkeletonStat } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { confirmDialog } from "@/components/ConfirmDialog";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";
import Drawer from "@/dashboard/Drawer";
import SearchableSelect from "@/dashboard/SearchableSelect";

const TRIP_STATUSES = ["draft", "planned", "active", "completed", "cancelled"];
const TRAVEL_STYLES = ["luxury", "adventure", "cultural", "relaxation", "business", "family", "budget"];
const TRIP_TYPES = ["solo", "couple", "family", "business", "luxury", "group"];
const PACES = ["relaxed", "moderate", "packed"];
const ACCOMMODATION_PREFS = ["hotel", "villa", "resort", "apartment"];
const CURRENCIES = ["IDR", "USD", "SGD", "EUR", "AUD"];

const ITINERARY_CATEGORIES = ["transport", "accommodation", "dining", "attraction", "activity", "shopping", "rest", "other"];
const ITINERARY_BOOKING_STATUSES = ["not_booked", "pending", "confirmed"];

const statusPill = {
  active: "bg-emerald-500/15 text-emerald-600",
  planned: "bg-blue-500/15 text-blue-600",
  completed: "bg-blue-500/15 text-blue-600",
  draft: "bg-mora-primary/10 text-mora-neutral",
  cancelled: "bg-red-500/15 text-red-600",
};
const itinStatusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-mora-gold/10 text-gold",
  not_booked: "bg-mora-primary/10 text-mora-neutral",
};

const EMPTY = {
  title: "", destination: "", cover_image: "", start_date: "", end_date: "", status: "draft",
  travelers: "", travel_style: "", budget_total: "", budget_currency: "IDR", notes: "",
  pace: "", trip_type: "", customer_id: "", lead_traveler: "", adults: "", children: "",
  accommodation_pref: "", special_requests: "", locked_until_paid: false, booking_id: "",
};

const EMPTY_ITEM = {
  day_number: 1, time: "", activity_name: "", location: "", description: "",
  duration_minutes: "", budget: "", category: "activity", booking_status: "not_booked", sort_order: "",
};

const cap1 = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");
const nice = (s) => cap1(String(s || "").replace(/_/g, " "));
const blank = (v) => (v == null ? "" : v);
const numOr = (v, fallback = 0) => {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
// Optional numeric field: an empty box stays empty rather than becoming 0.
const numOrUndef = (v) => (v === "" || v == null ? undefined : numOr(v, undefined));
const opts = (list) => list.map((v) => ({ value: v, label: nice(v) }));
const dateInput = (v) => (v ? moment(v).format("YYYY-MM-DD") : "");

const toForm = (t) => ({
  ...EMPTY,
  id: t.id,
  title: blank(t.title),
  destination: blank(t.destination),
  cover_image: blank(t.cover_image),
  start_date: dateInput(t.start_date),
  end_date: dateInput(t.end_date),
  status: t.status || "draft",
  travelers: blank(t.travelers),
  travel_style: blank(t.travel_style),
  budget_total: blank(t.budget_total),
  budget_currency: t.budget_currency || "IDR",
  notes: blank(t.notes),
  pace: blank(t.pace),
  trip_type: blank(t.trip_type),
  customer_id: blank(t.customer_id),
  lead_traveler: blank(t.lead_traveler),
  adults: blank(t.adults),
  children: blank(t.children),
  accommodation_pref: blank(t.accommodation_pref),
  special_requests: blank(t.special_requests),
  locked_until_paid: !!t.locked_until_paid,
  booking_id: blank(t.booking_id),
});

const toItemForm = (i) => ({
  ...EMPTY_ITEM,
  id: i.id,
  day_number: i.day_number ?? 1,
  time: blank(i.time),
  activity_name: blank(i.activity_name),
  location: blank(i.location),
  description: blank(i.description),
  duration_minutes: blank(i.duration_minutes),
  budget: blank(i.budget),
  category: i.category || "activity",
  booking_status: i.booking_status || "not_booked",
  sort_order: blank(i.sort_order),
});

export default function DashboardTrips() {
  const { role } = useRole();
  const navigate = useNavigate();

  const [trips, setTrips] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("all");

  // Itinerary drawer — the trip being planned, its activities, and the inline row editor.
  const [itinTrip, setItinTrip] = useState(null);
  const [itinItems, setItinItems] = useState(null);
  const [itemForm, setItemForm] = useState(null);
  const [savingItem, setSavingItem] = useState(false);

  const load = async () => {
    setTrips(await base44.entities.Trip.list("-created_date", 500));
    // Bookings drive the lock state; customers back the owner dropdown.
    setBookings(await base44.entities.Booking.list("-created_date", 500));
    setCustomers(await base44.entities.Customer.list("-created_date", 500));
  };
  useEffect(() => { load(); }, []);

  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const title = (editing.title || "").trim();
    const destination = (editing.destination || "").trim();
    if (!title) { toast.error("Title is required"); return; }
    if (!destination) { toast.error("Destination is required"); return; }
    if (editing.start_date && editing.end_date && editing.end_date < editing.start_date) {
      toast.error("End date can't be before the start date"); return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        destination,
        cover_image: (editing.cover_image || "").trim() || undefined,
        start_date: editing.start_date || undefined,
        end_date: editing.end_date || undefined,
        status: editing.status || "draft",
        travelers: numOrUndef(editing.travelers),
        travel_style: editing.travel_style || undefined,
        budget_total: numOr(editing.budget_total, 0),
        budget_currency: editing.budget_currency || "IDR",
        notes: editing.notes || "",
        pace: editing.pace || undefined,
        trip_type: editing.trip_type || undefined,
        customer_id: editing.customer_id || undefined,
        lead_traveler: (editing.lead_traveler || "").trim() || undefined,
        adults: numOrUndef(editing.adults),
        children: numOrUndef(editing.children),
        accommodation_pref: editing.accommodation_pref || undefined,
        special_requests: editing.special_requests || undefined,
        locked_until_paid: !!editing.locked_until_paid,
        booking_id: editing.booking_id || undefined,
      };
      if (editing.id) await base44.entities.Trip.update(editing.id, payload);
      else await base44.entities.Trip.create(payload);
      toast.success(editing.id ? "Saved" : "Created");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save"); }
    finally { setSaving(false); }
  };

  const remove = async (t) => {
    const ok = await confirmDialog({
      title: "Delete this trip?",
      body: `${t.title || "This trip"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await base44.entities.Trip.delete(t.id);
      toast.success("Trip deleted");
      load();
    } catch { toast.error("Couldn't delete trip"); }
  };

  /* ----------------------------- itinerary ---------------------------- */

  const loadItems = async (tripId) =>
    setItinItems(await base44.entities.ItineraryItem.filter({ trip_id: tripId }));

  const openItinerary = async (t) => {
    setItinTrip(t);
    setItinItems(null);
    setItemForm(null);
    try { await loadItems(t.id); }
    catch { setItinItems([]); toast.error("Couldn't load the itinerary"); }
  };

  const updItem = (k, v) => setItemForm((p) => ({ ...p, [k]: v }));

  const saveItem = async () => {
    const name = (itemForm.activity_name || "").trim();
    if (!name) { toast.error("Activity name is required"); return; }
    setSavingItem(true);
    try {
      const payload = {
        trip_id: itinTrip.id,
        day_number: Math.max(1, numOr(itemForm.day_number, 1)),
        time: itemForm.time || undefined,
        activity_name: name,
        location: (itemForm.location || "").trim() || undefined,
        description: itemForm.description || undefined,
        duration_minutes: numOrUndef(itemForm.duration_minutes),
        budget: numOrUndef(itemForm.budget),
        category: itemForm.category || "activity",
        booking_status: itemForm.booking_status || "not_booked",
        sort_order: numOr(itemForm.sort_order, 0),
      };
      if (itemForm.id) await base44.entities.ItineraryItem.update(itemForm.id, payload);
      else await base44.entities.ItineraryItem.create(payload);
      toast.success(itemForm.id ? "Activity updated" : "Activity added");
      setItemForm(null);
      await loadItems(itinTrip.id);
    } catch { toast.error("Couldn't save this activity"); }
    finally { setSavingItem(false); }
  };

  const removeItem = async (item) => {
    const ok = await confirmDialog({
      title: "Delete this activity?",
      body: `${item.activity_name || "This activity"} will be removed from the itinerary. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await base44.entities.ItineraryItem.delete(item.id);
      toast.success("Activity removed");
      await loadItems(itinTrip.id);
    } catch { toast.error("Couldn't delete this activity"); }
  };

  // Land "Add activity" on the last day in the plan rather than always on day 1.
  const nextDay = () => Math.max(1, ...(itinItems || []).map((i) => numOr(i.day_number, 1)));

  const itinSorted = [...(itinItems || [])].sort((a, b) => {
    const d = numOr(a.day_number, 1) - numOr(b.day_number, 1);
    if (d) return d;
    const s = numOr(a.sort_order, 0) - numOr(b.sort_order, 0);
    if (s) return s;
    return String(a.time || "").localeCompare(String(b.time || ""));
  });
  const itinGroups = itinSorted.reduce((acc, item) => {
    const day = numOr(item.day_number, 1);
    (acc[day] = acc[day] || []).push(item);
    return acc;
  }, {});
  const itinDays = Object.keys(itinGroups).sort((a, b) => Number(a) - Number(b));

  /* ------------------------------ listing ----------------------------- */

  const q = query.trim().toLowerCase();
  const filtered = (trips || []).filter((t) => {
    const mq = !q || [t.title, t.destination, t.lead_traveler].some((v) => (v || "").toLowerCase().includes(q));
    const ms = statusF === "all" || (t.status || "draft") === statusF;
    return mq && ms;
  });

  const pg = usePagination(filtered, 10, `${query}|${statusF}`);

  const total = (trips || []).length;
  const activeCount = (trips || []).filter((t) => t.status === "active").length;
  const lockedCount = (trips || []).filter((t) => tripAccess(t, bookings).locked).length;
  const budgetSum = (trips || []).reduce((s, t) => s + (Number(t.budget_total) || 0), 0);

  const canCreate = can(role, "trips", "create");
  const canEdit = can(role, "trips", "edit");
  const canDelete = can(role, "trips", "delete");
  const filtersDirty = query || statusF !== "all";

  const customerOptions = [{ value: "", label: "— None —" }, ...customers.map((c) => ({ value: c.id, label: c.name }))];
  const bookingOptions = [{ value: "", label: "— None —" }, ...bookings.map((b) => ({ value: b.id, label: `${b.title || "Booking"} — ${formatIDR(b.price)}` }))];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="trips" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Map className="w-3.5 h-3.5" /> Planning</p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Trips</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Every itinerary the agency is building, with its day-by-day plan and payment lock.</p>
        </div>
        {canCreate && (
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 press shrink-0">
            <Plus className="w-4 h-4" /> New trip
          </button>
        )}
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 stagger">
        {trips == null ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (<>
          <Kpi icon={Map} label="Total trips" value={total} />
          <Kpi icon={CalendarRange} label="In progress" value={activeCount} />
          <Kpi icon={Lock} label="Locked (unpaid)" value={lockedCount} />
          <Kpi icon={Wallet} label="Planned budget" value={formatIDR(budgetSum)} />
        </>)}
      </div>

      {trips == null ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-4"><SkeletonRows rows={6} /></div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mora-neutral pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search title, destination or lead traveler…" />
            </div>
            <SearchableSelect
              value={statusF}
              onChange={setStatusF}
              options={[{ value: "all", label: "All statuses" }, ...opts(TRIP_STATUSES)]}
              ariaLabel="Filter by status"
              className="min-w-[160px]"
            />
            {filtersDirty && (
              <button onClick={() => { setQuery(""); setStatusF("all"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          <DataTable
            minWidth={1180}
            columns={[
              { key: "title", label: "Trip", className: "font-medium text-mora-primary", render: (t) => (
                <span className="block max-w-[220px] truncate">{t.title || "Untitled trip"}</span>
              ) },
              { key: "destination", label: "Destination", render: (t) => t.destination || "—" },
              { key: "dates", label: "Dates", render: (t) => (
                t.start_date
                  ? `${moment(t.start_date).format("MMM D")}${t.end_date ? ` – ${moment(t.end_date).format("MMM D, YYYY")}` : ""}`
                  : "—"
              ) },
              { key: "status", label: "Status", render: (t) => (
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusPill[t.status] || statusPill.draft}`}>{t.status || "draft"}</span>
              ) },
              { key: "travelers", label: "Travelers", align: "right", className: "text-right", render: (t) => (
                t.travelers ?? ((t.adults ?? 0) + (t.children ?? 0) || "—")
              ) },
              { key: "lead_traveler", label: "Lead traveler", render: (t) => (
                <span className="block max-w-[160px] truncate">{t.lead_traveler || "—"}</span>
              ) },
              { key: "budget_total", label: "Budget", align: "right", className: "text-right font-semibold text-gold", render: (t) => (t.budget_total ? formatIDR(t.budget_total) : "—") },
              { key: "lock", label: "Lock", render: (t) => <LockCell trip={t} bookings={bookings} /> },
              { key: "actions", label: "", align: "right", className: "text-right", render: (t) => (
                <span className="inline-flex gap-1.5">
                  <button onClick={(e) => { e.stopPropagation(); openItinerary(t); }} aria-label={`Itinerary for ${t.title || "trip"}`} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 inline-flex items-center justify-center text-mora-primary hover:text-gold press"><ListChecks className="w-4 h-4" /></button>
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setEditing(toForm(t)); }} aria-label={`Edit ${t.title || "trip"}`} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 inline-flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                  )}
                  {canDelete && (
                    <button onClick={(e) => { e.stopPropagation(); remove(t); }} aria-label={`Delete ${t.title || "trip"}`} className="w-9 h-9 rounded-lg hover:bg-red-50 inline-flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
                  )}
                </span>
              ) },
            ]}
            rows={pg.pageItems}
            onRowClick={(t) => navigate(`/dashboard/trips/${t.id}`)}
            empty="No trips match your filters."
          />

          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="trips" />

          {total === 0 && (
            <EmptyState
              icon={Map}
              title="No trips yet"
              hint="Create a trip to group its itinerary, travelers and budget in one place."
              action={canCreate ? (
                <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press">
                  <Plus className="w-4 h-4" /> New trip
                </button>
              ) : null}
            />
          )}
          {total > 0 && filtered.length === 0 && (
            <EmptyState icon={Search} title="No matches" hint="No trips match your search or filters." />
          )}
        </div>
      )}

      {/* Trip editor */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        icon={editing?.id ? Pencil : Plus}
        width="max-w-2xl"
        title={editing?.id ? "Edit trip" : "New trip"}
        subtitle="Shown in the traveller's Trips tab"
      >
        {editing && (
          <div className="space-y-3">
            <Fld label="Title"><input autoFocus value={editing.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Bali Paradise Escape" /></Fld>
            <Row2>
              <Fld label="Destination"><input value={editing.destination} onChange={(e) => upd("destination", e.target.value)} className="dash-input" placeholder="Bali, Indonesia" /></Fld>
              <Fld label="Status">
                <SearchableSelect value={editing.status} onChange={(v) => upd("status", v)} options={opts(TRIP_STATUSES)} ariaLabel="Status" />
              </Fld>
            </Row2>
            <Fld label="Cover image URL"><input value={editing.cover_image} onChange={(e) => upd("cover_image", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
            <Row2>
              <Fld label="Start date"><input type="date" value={editing.start_date} onChange={(e) => upd("start_date", e.target.value)} className="dash-input" /></Fld>
              <Fld label="End date"><input type="date" value={editing.end_date} onChange={(e) => upd("end_date", e.target.value)} className="dash-input" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Customer">
                <SearchableSelect value={editing.customer_id} onChange={(v) => upd("customer_id", v)} options={customerOptions} placeholder="— None —" ariaLabel="Customer" />
              </Fld>
              <Fld label="Lead traveler"><input value={editing.lead_traveler} onChange={(e) => upd("lead_traveler", e.target.value)} className="dash-input" placeholder="Putri Wijaya" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Travelers"><input type="number" min="0" value={editing.travelers} onChange={(e) => upd("travelers", e.target.value)} className="dash-input" placeholder="2" /></Fld>
              <Fld label="Adults"><input type="number" min="0" value={editing.adults} onChange={(e) => upd("adults", e.target.value)} className="dash-input" placeholder="2" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Children"><input type="number" min="0" value={editing.children} onChange={(e) => upd("children", e.target.value)} className="dash-input" placeholder="0" /></Fld>
              <Fld label="Accommodation preference">
                <SearchableSelect value={editing.accommodation_pref} onChange={(v) => upd("accommodation_pref", v)} options={[{ value: "", label: "—" }, ...opts(ACCOMMODATION_PREFS)]} placeholder="—" ariaLabel="Accommodation preference" />
              </Fld>
            </Row2>
            <Row2>
              <Fld label="Travel style">
                <SearchableSelect value={editing.travel_style} onChange={(v) => upd("travel_style", v)} options={[{ value: "", label: "—" }, ...opts(TRAVEL_STYLES)]} placeholder="—" ariaLabel="Travel style" />
              </Fld>
              <Fld label="Trip type">
                <SearchableSelect value={editing.trip_type} onChange={(v) => upd("trip_type", v)} options={[{ value: "", label: "—" }, ...opts(TRIP_TYPES)]} placeholder="—" ariaLabel="Trip type" />
              </Fld>
            </Row2>
            <Row2>
              <Fld label="Pace">
                <SearchableSelect value={editing.pace} onChange={(v) => upd("pace", v)} options={[{ value: "", label: "—" }, ...opts(PACES)]} placeholder="—" ariaLabel="Pace" />
              </Fld>
              <Fld label="Budget currency">
                <SearchableSelect value={editing.budget_currency} onChange={(v) => upd("budget_currency", v)} options={opts(CURRENCIES)} ariaLabel="Budget currency" />
              </Fld>
            </Row2>
            <Fld label="Total budget"><input type="number" min="0" value={editing.budget_total} onChange={(e) => upd("budget_total", e.target.value)} className="dash-input" placeholder="48000000" /></Fld>
            <Fld label="Special requests"><textarea value={editing.special_requests} onChange={(e) => upd("special_requests", e.target.value)} className="dash-input !h-auto py-2" rows={2} placeholder="Dietary needs, accessibility, celebrations…" /></Fld>
            <Fld label="Notes"><textarea value={editing.notes} onChange={(e) => upd("notes", e.target.value)} className="dash-input !h-auto py-2" rows={2} /></Fld>

            <div className="rounded-xl border border-mora-primary/10 bg-white p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-mora-neutral">
                <input type="checkbox" checked={!!editing.locked_until_paid} onChange={(e) => upd("locked_until_paid", e.target.checked)} className="accent-[#AD1F23] w-4 h-4" />
                Hide the day-by-day plan until the booking is paid in full
              </label>
              <Fld label="Booking behind this trip">
                <SearchableSelect value={editing.booking_id} onChange={(v) => upd("booking_id", v)} options={bookingOptions} placeholder="— None —" ariaLabel="Booking behind this trip" />
              </Fld>
              {/* tripAccess() fails open when a gated trip has no booking to check, so flag the gap here. */}
              {editing.locked_until_paid && !editing.booking_id && (
                <Hint>No booking linked — the lock won&apos;t apply unless a booking records this trip.</Hint>
              )}
            </div>

            <div className="flex gap-2 pt-3">
              <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Itinerary editor */}
      <Drawer
        open={!!itinTrip}
        onClose={() => { setItinTrip(null); setItemForm(null); }}
        icon={ListChecks}
        width="max-w-2xl"
        title={itinTrip?.title || "Itinerary"}
        subtitle="Day-by-day plan travellers follow in the app"
      >
        {itinTrip && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-mora-neutral">
                {itinItems == null ? "Loading…" : `${itinItems.length} ${itinItems.length === 1 ? "activity" : "activities"}`}
              </p>
              {!itemForm && canCreate && itinItems != null && (
                <button onClick={() => setItemForm({ ...EMPTY_ITEM, day_number: nextDay() })} className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:opacity-80 press">
                  <Plus className="w-4 h-4" /> Add activity
                </button>
              )}
            </div>

            {itemForm && (
              <div className="rounded-xl border border-mora-primary/10 bg-white p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Fld label="Day"><input type="number" min="1" value={itemForm.day_number} onChange={(e) => updItem("day_number", e.target.value)} className="dash-input" placeholder="1" /></Fld>
                  <Fld label="Time"><input type="time" value={itemForm.time} onChange={(e) => updItem("time", e.target.value)} className="dash-input" /></Fld>
                </div>
                <div className="mt-3 space-y-3">
                  <Fld label="Activity name"><input autoFocus value={itemForm.activity_name} onChange={(e) => updItem("activity_name", e.target.value)} className="dash-input" placeholder="Sunset at Tanah Lot" /></Fld>
                  <Fld label="Location"><input value={itemForm.location} onChange={(e) => updItem("location", e.target.value)} className="dash-input" placeholder="Tanah Lot Temple" /></Fld>
                  <Fld label="Description"><textarea value={itemForm.description} onChange={(e) => updItem("description", e.target.value)} className="dash-input !h-auto py-2" rows={2} placeholder="Iconic sea temple at golden hour." /></Fld>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <Fld label="Duration (minutes)"><input type="number" min="0" value={itemForm.duration_minutes} onChange={(e) => updItem("duration_minutes", e.target.value)} className="dash-input" placeholder="120" /></Fld>
                  <Fld label="Budget"><input type="number" min="0" value={itemForm.budget} onChange={(e) => updItem("budget", e.target.value)} className="dash-input" placeholder="150000" /></Fld>
                  <Fld label="Category">
                    <SearchableSelect value={itemForm.category} onChange={(v) => updItem("category", v)} options={opts(ITINERARY_CATEGORIES)} ariaLabel="Category" />
                  </Fld>
                  <Fld label="Booking status">
                    <SearchableSelect value={itemForm.booking_status} onChange={(v) => updItem("booking_status", v)} options={opts(ITINERARY_BOOKING_STATUSES)} ariaLabel="Booking status" />
                  </Fld>
                  <Fld label="Sort order">
                    <input type="number" min="0" value={itemForm.sort_order} onChange={(e) => updItem("sort_order", e.target.value)} className="dash-input" placeholder="1" />
                    <Hint>Orders activities within the same day.</Hint>
                  </Fld>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={saveItem} disabled={savingItem} className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                    {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                  <button onClick={() => setItemForm(null)} className="rounded-xl px-4 py-2 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
                </div>
              </div>
            )}

            {itinItems == null ? (
              <div className="bg-white rounded-2xl border border-mora-primary/10 p-4"><SkeletonRows rows={4} /></div>
            ) : itinDays.length === 0 ? (
              !itemForm && (
                <EmptyState
                  icon={ListChecks}
                  title="No activities yet"
                  hint="Add the first day's plan and travellers will see it in their itinerary."
                  action={canCreate ? (
                    <button onClick={() => setItemForm({ ...EMPTY_ITEM })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press">
                      <Plus className="w-4 h-4" /> Add activity
                    </button>
                  ) : null}
                />
              )
            ) : (
              <div className="space-y-5">
                {itinDays.map((day) => (
                  <div key={day}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-mora-neutral mb-2">Day {day}</h3>
                    <ul className="space-y-2">
                      {itinGroups[day].map((item) => (
                        <li key={item.id} className="flex items-start gap-3 rounded-xl bg-white border border-mora-primary/10 px-3 py-2.5 group">
                          <span className="shrink-0 w-14 text-xs font-medium text-gold tabular-nums mt-0.5 inline-flex items-center gap-1">
                            {item.time ? <><Clock className="w-3 h-3" />{item.time}</> : "—"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-mora-primary truncate">{item.activity_name || "Activity"}</p>
                            {item.location && (
                              <span className="inline-flex items-center gap-1 text-xs text-mora-neutral mt-0.5">
                                <MapPin className="w-3.5 h-3.5" /> {item.location}
                              </span>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-mora-primary/[0.06] text-mora-neutral">{nice(item.category || "activity")}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${itinStatusPill[item.booking_status] || itinStatusPill.not_booked}`}>{nice(item.booking_status || "not_booked")}</span>
                              {item.duration_minutes > 0 && <span className="text-[10px] text-mora-neutral/60">{item.duration_minutes} min</span>}
                              {item.budget > 0 && <span className="text-[10px] font-medium text-mora-primary">{formatIDR(item.budget)}</span>}
                            </div>
                          </div>
                          {(canEdit || canDelete) && (
                            <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              {canEdit && <button onClick={() => setItemForm(toItemForm(item))} aria-label={`Edit ${item.activity_name || "activity"}`} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-3.5 h-3.5" /></button>}
                              {canDelete && <button onClick={() => removeItem(item)} aria-label={`Delete ${item.activity_name || "activity"}`} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-3.5 h-3.5" /></button>}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

// Lock column. A gated trip whose booking can't be found reads as "at risk" rather
// than open, because tripAccess() deliberately fails open in that case.
const LockCell = ({ trip, bookings }) => {
  if (!trip.locked_until_paid) {
    return <span className="inline-flex items-center gap-1.5 text-xs text-mora-neutral/60"><Unlock className="w-3.5 h-3.5" /> Open</span>;
  }
  const access = tripAccess(trip, bookings);
  if (!access.booking) {
    return <span className="inline-flex items-center gap-1.5 text-xs text-gold"><Lock className="w-3.5 h-3.5" /> Gated · no booking</span>;
  }
  if (!access.locked) {
    return <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600"><Unlock className="w-3.5 h-3.5" /> Paid · unlocked</span>;
  }
  return (
    <span className="inline-flex flex-col">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600"><Lock className="w-3.5 h-3.5" /> Locked</span>
      <span className="text-[10px] text-mora-neutral/60">{formatIDR(access.balance)} due</span>
    </span>
  );
};

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 flex items-center gap-4 min-w-0">
    <div className="w-11 h-11 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
    <div className="min-w-0">
      <div className="text-xs text-mora-neutral uppercase tracking-wider">{label}</div>
      <div className="stat-value text-xl font-display font-bold text-mora-primary truncate">{value}</div>
    </div>
  </div>
);

const Row2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;

const Fld = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);

const Hint = ({ children }) => <p className="text-[11px] text-mora-neutral/60 mt-1">{children}</p>;
