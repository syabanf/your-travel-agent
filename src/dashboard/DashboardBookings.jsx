import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { Plus, Pencil, Trash2, X, Loader2, Save, Search, ChevronUp, ChevronDown, Briefcase, Map, Download } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { useRole } from "./RoleContext";
import { can } from "./rbac";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { downloadCSV } from "@/lib/csv";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";
import SearchableSelect from "@/dashboard/SearchableSelect";

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-mora-gold/10 text-gold",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
  active: "bg-emerald-500/15 text-emerald-600",
  planned: "bg-blue-500/15 text-blue-600",
  draft: "bg-mora-primary/10 text-mora-neutral",
};
const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const TRIP_STATUSES = ["draft", "planned", "active", "completed", "cancelled"];
const BOOKING_TYPES = ["flight", "hotel", "train", "bus", "car", "attraction", "restaurant", "activity"];
const TRAVEL_STYLES = ["luxury", "cultural", "relaxation", "adventure", "budget", "family"];

const PAYMENT_STATUSES = ["paid", "deposit", "unpaid"];
const CHANNELS = ["Direct", "Booking.com", "Agoda", "Traveloka", "Expedia"];
const ACCOMMODATION_PREFS = ["hotel", "villa", "resort", "apartment"];

const EMPTY_BOOKING = { type: "hotel", title: "", provider: "", status: "pending", payment_status: "unpaid", channel: "Direct", trip_id: "", customer_id: "", supplier_id: "", supplier_ref: "", location: "", check_in: "", check_out: "", guests: "", price: "", cost_price: "", commission: "", confirmation_code: "", image_url: "", notes: "" };
const EMPTY_TRIP = { title: "", destination: "", customer_id: "", status: "draft", lead_traveler: "", start_date: "", end_date: "", travelers: "", adults: "", children: "", budget_total: "", travel_style: "", accommodation_pref: "", cover_image: "", special_requests: "", notes: "" };

export default function DashboardBookings() {
  const { role } = useRole();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "trips" ? "trips" : "bookings");
  const [trips, setTrips] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [editing, setEditing] = useState(null); // { kind: 'booking'|'trip', data } | null
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [statusF, setStatusF] = useState(searchParams.get("status") || "all");
  const [typeF, setTypeF] = useState("all");
  const [range, setRange] = useState("all");
  const [bSort, setBSort] = useState({ key: null, dir: "asc" });
  const [tSort, setTSort] = useState({ key: null, dir: "asc" });

  const load = async () => {
    setTrips(await base44.entities.Trip.list("-created_date", 500));
    setBookings(await base44.entities.Booking.list("-created_date", 500));
    setCustomers(await base44.entities.Customer.list("-created_date", 500));
    setSuppliers(await base44.entities.Supplier.list("-created_date", 500));
  };
  useEffect(() => { load(); }, []);

  const delTrip = async (id) => { await base44.entities.Trip.delete(id); toast.success("Trip deleted"); load(); };
  const delBooking = async (id) => { await base44.entities.Booking.delete(id); toast.success("Booking deleted"); load(); };
  const setBookingStatus = async (id, status) => { await base44.entities.Booking.update(id, { status }); toast.success("Status updated"); load(); };
  const setTripStatus = async (id, status) => { await base44.entities.Trip.update(id, { status }); toast.success("Status updated"); load(); };

  const startAddBooking = () => setEditing({ kind: "booking", data: { ...EMPTY_BOOKING } });
  const startAddTrip = () => setEditing({ kind: "trip", data: { ...EMPTY_TRIP } });
  const startEditBooking = (b) => setEditing({ kind: "booking", data: {
    ...EMPTY_BOOKING, ...b,
    payment_status: b.payment_status ?? "", channel: b.channel ?? "", supplier_ref: b.supplier_ref ?? "",
    trip_id: b.trip_id || "", customer_id: b.customer_id || "", supplier_id: b.supplier_id || "",
    check_in: b.check_in ? moment(b.check_in).format("YYYY-MM-DD") : "",
    check_out: b.check_out ? moment(b.check_out).format("YYYY-MM-DD") : "",
    guests: b.guests ?? "", price: b.price ?? "", cost_price: b.cost_price ?? "", commission: b.commission ?? "",
    confirmation_code: b.confirmation_code || "", image_url: b.image_url || "", notes: b.notes || "",
  } });
  const startEditTrip = (t) => setEditing({ kind: "trip", data: {
    ...EMPTY_TRIP, ...t,
    customer_id: t.customer_id || "", lead_traveler: t.lead_traveler ?? "",
    start_date: t.start_date ? moment(t.start_date).format("YYYY-MM-DD") : "",
    end_date: t.end_date ? moment(t.end_date).format("YYYY-MM-DD") : "",
    travelers: t.travelers ?? "", adults: t.adults ?? "", children: t.children ?? "", budget_total: t.budget_total ?? "",
    travel_style: t.travel_style || "", accommodation_pref: t.accommodation_pref ?? "",
    cover_image: t.cover_image || "", special_requests: t.special_requests ?? "", notes: t.notes || "",
  } });

  const upd = (k, v) => setEditing((p) => ({ ...p, data: { ...p.data, [k]: v } }));

  const save = async () => {
    const { kind, data } = editing;
    if (!data.title) { toast.error("Title is required"); return; }
    if (kind === "trip" && !data.destination) { toast.error("Destination is required"); return; }
    setSaving(true);
    try {
      if (kind === "booking") {
        const payload = {
          type: data.type, title: data.title, provider: data.provider, status: data.status || "pending",
          payment_status: data.payment_status || undefined, channel: data.channel || undefined,
          trip_id: data.trip_id || undefined, customer_id: data.customer_id || undefined, supplier_id: data.supplier_id || undefined,
          supplier_ref: data.supplier_ref || undefined,
          location: data.location,
          check_in: data.check_in || undefined, check_out: data.check_out || undefined,
          guests: data.guests ? Number(data.guests) : undefined,
          price: data.price ? Number(data.price) : 0,
          cost_price: data.cost_price ? Number(data.cost_price) : 0, currency: "IDR",
          commission: data.commission ? Number(data.commission) : 0,
          confirmation_code: data.confirmation_code || undefined,
          image_url: data.image_url || undefined, notes: data.notes || "",
        };
        if (data.id) await base44.entities.Booking.update(data.id, payload);
        else await base44.entities.Booking.create(payload);
      } else {
        const payload = {
          title: data.title, destination: data.destination, customer_id: data.customer_id || undefined, status: data.status || "draft",
          lead_traveler: data.lead_traveler || undefined,
          start_date: data.start_date || undefined, end_date: data.end_date || undefined,
          travelers: data.travelers ? Number(data.travelers) : undefined,
          adults: data.adults ? Number(data.adults) : undefined,
          children: data.children ? Number(data.children) : undefined,
          budget_total: data.budget_total ? Number(data.budget_total) : 0, budget_currency: "IDR",
          travel_style: data.travel_style || undefined,
          accommodation_pref: data.accommodation_pref || undefined,
          special_requests: data.special_requests || undefined,
          cover_image: data.cover_image || undefined, notes: data.notes || "",
        };
        if (data.id) await base44.entities.Trip.update(data.id, payload);
        else await base44.entities.Trip.create(payload);
      }
      toast.success(data.id ? "Saved" : "Created");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save"); }
    finally { setSaving(false); }
  };

  const Pill = ({ s }) => <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[s] || statusPill.pending}`}>{s}</span>;
  const StatusCell = ({ value, options, editable, onChange }) =>
    editable ? (
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options.map((o) => ({ value: o, label: cap1(o) }))}
        ariaLabel="Status"
        className="text-[11px] !h-auto py-1 max-w-[150px]"
      />
    ) : <Pill s={value} />;

  const canEditBookings = can(role, "bookings", "edit");
  const canDelBookings = can(role, "bookings", "delete");
  const canEditTrips = can(role, "trips", "edit");
  const canDelTrips = can(role, "trips", "delete");
  const d = editing?.data;

  const q = query.trim().toLowerCase();
  const fBookings = (bookings || []).filter((b) => (!q || [b.title, b.provider, b.location, b.type].some((v) => (v || "").toLowerCase().includes(q))) && (statusF === "all" || b.status === statusF) && (typeF === "all" || b.type === typeF) && inRange(b.created_date, range));
  const fTrips = (trips || []).filter((t) => (!q || [t.title, t.destination].some((v) => (v || "").toLowerCase().includes(q))) && (statusF === "all" || t.status === statusF) && inRange(t.created_date, range));

  // Sort a copy of the filtered array (never mutate the source).
  const sortRows = (rows, { key, dir }) => {
    if (!key) return rows;
    const sign = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      let av = a[key], bv = b[key];
      if (av == null) av = ""; if (bv == null) bv = "";
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sign;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * sign;
    });
  };
  const toggleSort = (set) => (key) => set((p) => p.key === key ? { key, dir: p.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const SortHead = ({ label, field, active, dir, onSort, className = "" }) => (
    <th className={`px-5 py-3 font-medium ${className}`}>
      <button onClick={() => onSort(field)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-mora-primary transition-colors">
        {label}
        {active === field && (dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );

  const sBookings = sortRows(fBookings, bSort);
  const sTrips = sortRows(fTrips, tSort);
  const bookingPg = usePagination(sBookings, 10, `${query}|${statusF}|${typeF}|${range}|${bSort.key}|${bSort.dir}`);
  const tripPg = usePagination(sTrips, 10, `${query}|${statusF}|${range}|${tSort.key}|${tSort.dir}`);

  const exportCSV = () => downloadCSV(
    "mora-bookings",
    ["Title", "Type", "Provider", "Status", "Date", "Price"],
    sBookings.map((b) => [
      b.title, b.type, b.provider, b.status,
      b.check_in ? moment(b.check_in).format("YYYY-MM-DD") : "",
      b.price || 0,
    ]),
  );

  // Insight aggregations (date-scoped so charts follow the range)
  const cap1 = (str) => (str ? str[0].toUpperCase() + str.slice(1) : str);
  const scopedBookings = (bookings || []).filter((b) => inRange(b.created_date, range));
  const scopedTrips = (trips || []).filter((t) => inRange(t.created_date, range));
  const typeCount = {}, statusRevenue = {}, tripStatusCount = {};
  scopedBookings.forEach((b) => {
    const t = b.type || "other";
    typeCount[t] = (typeCount[t] || 0) + 1;
    const st = b.status || "pending";
    statusRevenue[st] = (statusRevenue[st] || 0) + (Number(b.price) || 0);
  });
  scopedTrips.forEach((t) => { const st = t.status || "draft"; tripStatusCount[st] = (tripStatusCount[st] || 0) + 1; });
  const byType = BOOKING_TYPES.map((t) => ({ name: cap1(t), value: typeCount[t] || 0 })).filter((d) => d.value);
  const revenueByStatus = BOOKING_STATUSES.map((st) => ({ name: cap1(st), value: statusRevenue[st] || 0 })).filter((d) => d.value);
  const TRIP_STATUS_COLOR = { draft: "#94A3B8", planned: "#3B82F6", active: "#10B981", completed: "#0EA5E9", cancelled: "#EF4444" };
  const tripsByStatus = TRIP_STATUSES.map((st) => ({ name: cap1(st), value: tripStatusCount[st] || 0, color: TRIP_STATUS_COLOR[st] })).filter((d) => d.value);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Trips & Bookings</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Create, review and manage every trip and booking.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="bookings" data={bookings} />
            <button onClick={exportCSV} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {tab === "bookings"
              ? can(role, "bookings", "create") && (
                <button onClick={startAddBooking} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> New booking</button>
              )
              : can(role, "trips", "create") && (
                <button onClick={startAddTrip} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> New trip</button>
              )}
          </div>
        )}
      </header>

      {!editing && bookings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ChartCard title="Bookings by type" subtitle="What you sell most."><CategoryBars data={byType} money={false} /></ChartCard>
          <ChartCard title="Revenue by status" subtitle="Where revenue sits."><CategoryBars data={revenueByStatus} money={true} /></ChartCard>
          <ChartCard title="Trips by status" subtitle="Pipeline mix."><MixDonut data={tripsByStatus} /></ChartCard>
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">
              {d.id ? "Edit" : "New"} {editing.kind === "booking" ? "booking" : "trip"}
            </h2>
            <button onClick={() => setEditing(null)} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>

          {editing.kind === "booking" ? (
            <div className="space-y-3">
              <Row2>
                <Fld label="Type">
                  <SearchableSelect value={d.type} onChange={(v) => upd("type", v)} options={BOOKING_TYPES.map((t) => ({ value: t, label: cap1(t) }))} ariaLabel="Type" />
                </Fld>
                <Fld label="Status">
                  <SearchableSelect value={d.status} onChange={(v) => upd("status", v)} options={BOOKING_STATUSES.map((s) => ({ value: s, label: cap1(s) }))} ariaLabel="Status" />
                </Fld>
              </Row2>
              <Fld label="Title"><input value={d.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Garuda Indonesia — SIN → DPS" /></Fld>
              <Row2>
                <Fld label="Provider"><input value={d.provider} onChange={(e) => upd("provider", e.target.value)} className="dash-input" placeholder="Garuda Indonesia" /></Fld>
                <Fld label="Linked trip">
                  <SearchableSelect value={d.trip_id} onChange={(v) => upd("trip_id", v)} options={[{ value: "", label: "— None —" }, ...(trips || []).map((t) => ({ value: t.id, label: t.title }))]} placeholder="— None —" ariaLabel="Linked trip" />
                </Fld>
              </Row2>
              <Row2>
                <Fld label="Customer">
                  <SearchableSelect value={d.customer_id} onChange={(v) => upd("customer_id", v)} options={[{ value: "", label: "— None —" }, ...customers.map((c) => ({ value: c.id, label: c.name }))]} placeholder="— None —" ariaLabel="Customer" />
                </Fld>
                <Fld label="Supplier">
                  <SearchableSelect value={d.supplier_id} onChange={(v) => upd("supplier_id", v)} options={[{ value: "", label: "— None —" }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]} placeholder="— None —" ariaLabel="Supplier" />
                </Fld>
              </Row2>
              <Row2>
                <Fld label="Channel">
                  <SearchableSelect value={d.channel} onChange={(v) => upd("channel", v)} options={[{ value: "", label: "—" }, ...CHANNELS.map((c) => ({ value: c, label: c }))]} placeholder="—" ariaLabel="Channel" />
                </Fld>
                <Fld label="Supplier ref"><input value={d.supplier_ref} onChange={(e) => upd("supplier_ref", e.target.value)} className="dash-input" placeholder="REF-12345" /></Fld>
              </Row2>
              <Fld label="Location"><input value={d.location} onChange={(e) => upd("location", e.target.value)} className="dash-input" placeholder="Seminyak, Bali" /></Fld>
              <Row2>
                <Fld label="Check-in"><input type="date" value={d.check_in} onChange={(e) => upd("check_in", e.target.value)} className="dash-input" /></Fld>
                <Fld label="Check-out"><input type="date" value={d.check_out} onChange={(e) => upd("check_out", e.target.value)} className="dash-input" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Guests"><input type="number" value={d.guests} onChange={(e) => upd("guests", e.target.value)} className="dash-input" placeholder="2" /></Fld>
                <Fld label="Price (IDR)"><input type="number" value={d.price} onChange={(e) => upd("price", e.target.value)} className="dash-input" placeholder="4200000" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Cost price (IDR)"><input type="number" value={d.cost_price} onChange={(e) => upd("cost_price", e.target.value)} className="dash-input" placeholder="3300000" /></Fld>
                <Fld label="Commission (IDR)"><input type="number" value={d.commission} onChange={(e) => upd("commission", e.target.value)} className="dash-input" placeholder="420000" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Payment status">
                  <SearchableSelect value={d.payment_status} onChange={(v) => upd("payment_status", v)} options={[{ value: "", label: "—" }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: cap1(s) }))]} placeholder="—" ariaLabel="Payment status" />
                </Fld>
                <Fld label="Confirmation code"><input value={d.confirmation_code} onChange={(e) => upd("confirmation_code", e.target.value)} className="dash-input" placeholder="AB-558210" /></Fld>
              </Row2>
              <Fld label="Image URL"><input value={d.image_url} onChange={(e) => upd("image_url", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
              <Fld label="Notes"><textarea value={d.notes} onChange={(e) => upd("notes", e.target.value)} className="dash-input !h-auto py-2" rows={2} /></Fld>
            </div>
          ) : (
            <div className="space-y-3">
              <Fld label="Title"><input value={d.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Bali Paradise Escape" /></Fld>
              <Row2>
                <Fld label="Destination"><input value={d.destination} onChange={(e) => upd("destination", e.target.value)} className="dash-input" placeholder="Bali, Indonesia" /></Fld>
                <Fld label="Status">
                  <SearchableSelect value={d.status} onChange={(v) => upd("status", v)} options={TRIP_STATUSES.map((s) => ({ value: s, label: cap1(s) }))} ariaLabel="Status" />
                </Fld>
              </Row2>
              <Row2>
                <Fld label="Customer">
                  <SearchableSelect value={d.customer_id} onChange={(v) => upd("customer_id", v)} options={[{ value: "", label: "— None —" }, ...customers.map((c) => ({ value: c.id, label: c.name }))]} placeholder="— None —" ariaLabel="Customer" />
                </Fld>
                <Fld label="Lead traveler"><input value={d.lead_traveler} onChange={(e) => upd("lead_traveler", e.target.value)} className="dash-input" placeholder="Jane Doe" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Start date"><input type="date" value={d.start_date} onChange={(e) => upd("start_date", e.target.value)} className="dash-input" /></Fld>
                <Fld label="End date"><input type="date" value={d.end_date} onChange={(e) => upd("end_date", e.target.value)} className="dash-input" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Travelers"><input type="number" value={d.travelers} onChange={(e) => upd("travelers", e.target.value)} className="dash-input" placeholder="2" /></Fld>
                <Fld label="Budget (IDR)"><input type="number" value={d.budget_total} onChange={(e) => upd("budget_total", e.target.value)} className="dash-input" placeholder="48000000" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Adults"><input type="number" value={d.adults} onChange={(e) => upd("adults", e.target.value)} className="dash-input" placeholder="2" /></Fld>
                <Fld label="Children"><input type="number" value={d.children} onChange={(e) => upd("children", e.target.value)} className="dash-input" placeholder="0" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Travel style">
                  <SearchableSelect value={d.travel_style} onChange={(v) => upd("travel_style", v)} options={[{ value: "", label: "—" }, ...TRAVEL_STYLES.map((s) => ({ value: s, label: cap1(s) }))]} placeholder="—" ariaLabel="Travel style" />
                </Fld>
                <Fld label="Accommodation preference">
                  <SearchableSelect value={d.accommodation_pref} onChange={(v) => upd("accommodation_pref", v)} options={[{ value: "", label: "—" }, ...ACCOMMODATION_PREFS.map((a) => ({ value: a, label: cap1(a) }))]} placeholder="—" ariaLabel="Accommodation preference" />
                </Fld>
              </Row2>
              <Fld label="Cover image URL"><input value={d.cover_image} onChange={(e) => upd("cover_image", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
              <Fld label="Special requests"><textarea value={d.special_requests} onChange={(e) => upd("special_requests", e.target.value)} className="dash-input !h-auto py-2" rows={2} placeholder="Dietary needs, accessibility, celebrations…" /></Fld>
              <Fld label="Notes"><textarea value={d.notes} onChange={(e) => upd("notes", e.target.value)} className="dash-input !h-auto py-2" rows={2} /></Fld>
            </div>
          )}

          <div className="flex gap-2 pt-5">
            <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <ReadOnlyBanner resource="bookings" />
          <div className="flex gap-2 mb-4">
            {["bookings", "trips"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${tab === t ? "bg-mora-gold/10 text-gold" : "text-mora-neutral hover:bg-mora-primary/5"}`}>
                {t} {t === "bookings" && bookings ? `(${bookings.length})` : t === "trips" && trips ? `(${trips.length})` : ""}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${tab}…`} className="dash-input pl-9" />
            </div>
            <SearchableSelect
              value={statusF}
              onChange={setStatusF}
              options={[{ value: "all", label: "All status" }, ...(tab === "bookings" ? BOOKING_STATUSES : TRIP_STATUSES).map((s) => ({ value: s, label: cap1(s) }))]}
              placeholder="All status"
              ariaLabel="Status filter"
              className="max-w-[170px]"
            />
            {tab === "bookings" && (
              <SearchableSelect value={typeF} onChange={setTypeF} options={[{ value: "all", label: "All types" }, ...BOOKING_TYPES.map((t) => ({ value: t, label: cap1(t) }))]} placeholder="All types" ariaLabel="Type filter" className="max-w-[150px]" />
            )}
            <DateRangeSelect value={range} onChange={setRange} />
            {(query || statusF !== "all" || typeF !== "all" || range !== "all") && (
              <button onClick={() => { setQuery(""); setStatusF("all"); setTypeF("all"); setRange("all"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
            {(tab === "bookings" ? bookings : trips) == null ? (
              <div className="p-5"><SkeletonRows rows={6} /></div>
            ) : tab === "bookings" ? (
              bookings.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No bookings yet"
                  hint="Add flights, hotels and activities to start building this trip board."
                  action={can(role, "bookings", "create") && (
                    <button onClick={startAddBooking} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press"><Plus className="w-4 h-4" /> New booking</button>
                  )}
                />
              ) : (<>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
                  <SortHead label="Title" field="title" active={bSort.key} dir={bSort.dir} onSort={toggleSort(setBSort)} />
                  <SortHead label="Type" field="type" active={bSort.key} dir={bSort.dir} onSort={toggleSort(setBSort)} />
                  <SortHead label="Date" field="check_in" active={bSort.key} dir={bSort.dir} onSort={toggleSort(setBSort)} />
                  <SortHead label="Status" field="status" active={bSort.key} dir={bSort.dir} onSort={toggleSort(setBSort)} />
                  <SortHead label="Price" field="price" active={bSort.key} dir={bSort.dir} onSort={toggleSort(setBSort)} className="text-right" />
                  <th className="px-5 py-3"></th>
                </tr></thead>
                <tbody className="stagger">
                  {bookingPg.pageItems.map((b) => (
                    <tr key={b.id} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]">
                      <td className="px-5 py-3 max-w-[240px]"><Link to={`/dashboard/bookings/${b.id}`} className="font-medium text-mora-primary hover:text-gold transition-colors truncate block">{b.title}</Link></td>
                      <td className="px-5 py-3 text-mora-neutral capitalize">{b.type}</td>
                      <td className="px-5 py-3 text-mora-neutral">{b.check_in ? moment(b.check_in).format("MMM D, YYYY") : "—"}</td>
                      <td className="px-5 py-3"><StatusCell value={b.status} options={BOOKING_STATUSES} editable={canEditBookings} onChange={(s) => setBookingStatus(b.id, s)} /></td>
                      <td className="px-5 py-3 text-right font-semibold text-gold">{b.price ? formatIDR(b.price) : "—"}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {canEditBookings && <button onClick={() => startEditBooking(b)} aria-label="Edit" className="text-mora-primary hover:text-gold hover:bg-mora-primary/5 w-9 h-9 rounded-lg inline-flex items-center justify-center press"><Pencil className="w-4 h-4" /></button>}
                        {canDelBookings && <button onClick={() => delBooking(b.id)} aria-label="Delete" className="text-red-600 hover:bg-red-50 w-9 h-9 rounded-lg inline-flex items-center justify-center press"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  ))}
                  {fBookings.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-mora-neutral/60">No bookings match your filters.</td></tr>}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-4 border-t border-mora-primary/5">
                <Pagination page={bookingPg.page} pageCount={bookingPg.pageCount} total={bookingPg.total} pageSize={bookingPg.pageSize} onPage={bookingPg.setPage} noun="bookings" />
              </div>
              </>)
            ) : (
              trips.length === 0 ? (
                <EmptyState
                  icon={Map}
                  title="No trips yet"
                  hint="Create a trip to group bookings, travelers and budgets in one place."
                  action={can(role, "trips", "create") && (
                    <button onClick={startAddTrip} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press"><Plus className="w-4 h-4" /> New trip</button>
                  )}
                />
              ) : (<>
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
                  <SortHead label="Trip" field="title" active={tSort.key} dir={tSort.dir} onSort={toggleSort(setTSort)} />
                  <SortHead label="Destination" field="destination" active={tSort.key} dir={tSort.dir} onSort={toggleSort(setTSort)} />
                  <SortHead label="Dates" field="start_date" active={tSort.key} dir={tSort.dir} onSort={toggleSort(setTSort)} />
                  <SortHead label="Status" field="status" active={tSort.key} dir={tSort.dir} onSort={toggleSort(setTSort)} />
                  <SortHead label="Budget" field="budget_total" active={tSort.key} dir={tSort.dir} onSort={toggleSort(setTSort)} className="text-right" />
                  <th className="px-5 py-3"></th>
                </tr></thead>
                <tbody className="stagger">
                  {tripPg.pageItems.map((t) => (
                    <tr key={t.id} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]">
                      <td className="px-5 py-3 max-w-[220px]"><Link to={`/dashboard/trips/${t.id}`} className="font-medium text-mora-primary hover:text-gold transition-colors truncate block">{t.title}</Link></td>
                      <td className="px-5 py-3 text-mora-neutral">{t.destination}</td>
                      <td className="px-5 py-3 text-mora-neutral">{t.start_date ? moment(t.start_date).format("MMM D") : "—"}{t.end_date ? ` – ${moment(t.end_date).format("MMM D")}` : ""}</td>
                      <td className="px-5 py-3"><StatusCell value={t.status} options={TRIP_STATUSES} editable={canEditTrips} onChange={(s) => setTripStatus(t.id, s)} /></td>
                      <td className="px-5 py-3 text-right font-semibold text-gold">{t.budget_total ? formatIDR(t.budget_total) : "—"}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {canEditTrips && <button onClick={() => startEditTrip(t)} aria-label="Edit" className="text-mora-primary hover:text-gold hover:bg-mora-primary/5 w-9 h-9 rounded-lg inline-flex items-center justify-center press"><Pencil className="w-4 h-4" /></button>}
                        {canDelTrips && <button onClick={() => delTrip(t.id)} aria-label="Delete" className="text-red-600 hover:bg-red-50 w-9 h-9 rounded-lg inline-flex items-center justify-center press"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  ))}
                  {fTrips.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-mora-neutral/60">No trips match your filters.</td></tr>}
                </tbody>
              </table>
              </div>
              <div className="px-5 py-4 border-t border-mora-primary/5">
                <Pagination page={tripPg.page} pageCount={tripPg.pageCount} total={tripPg.total} pageSize={tripPg.pageSize} onPage={tripPg.setPage} noun="trips" />
              </div>
              </>)
            )}
          </div>
        </>
      )}
    </div>
  );
}

const Row2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
const Fld = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
