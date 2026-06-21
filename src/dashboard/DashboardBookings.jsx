import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { Plus, Pencil, Trash2, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { useRole } from "./RoleContext";
import { can } from "./rbac";

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

const EMPTY_BOOKING = { type: "hotel", title: "", provider: "", status: "pending", trip_id: "", customer_id: "", supplier_id: "", location: "", check_in: "", check_out: "", guests: "", price: "", cost_price: "", confirmation_code: "", image_url: "", notes: "" };
const EMPTY_TRIP = { title: "", destination: "", customer_id: "", status: "draft", start_date: "", end_date: "", travelers: "", budget_total: "", travel_style: "", cover_image: "", notes: "" };

export default function DashboardBookings() {
  const { role } = useRole();
  const [tab, setTab] = useState("bookings");
  const [trips, setTrips] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [editing, setEditing] = useState(null); // { kind: 'booking'|'trip', data } | null
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

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
    trip_id: b.trip_id || "", customer_id: b.customer_id || "", supplier_id: b.supplier_id || "",
    check_in: b.check_in ? moment(b.check_in).format("YYYY-MM-DD") : "",
    check_out: b.check_out ? moment(b.check_out).format("YYYY-MM-DD") : "",
    guests: b.guests ?? "", price: b.price ?? "", cost_price: b.cost_price ?? "",
    confirmation_code: b.confirmation_code || "", image_url: b.image_url || "", notes: b.notes || "",
  } });
  const startEditTrip = (t) => setEditing({ kind: "trip", data: {
    ...EMPTY_TRIP, ...t,
    customer_id: t.customer_id || "",
    start_date: t.start_date ? moment(t.start_date).format("YYYY-MM-DD") : "",
    end_date: t.end_date ? moment(t.end_date).format("YYYY-MM-DD") : "",
    travelers: t.travelers ?? "", budget_total: t.budget_total ?? "",
    travel_style: t.travel_style || "", cover_image: t.cover_image || "", notes: t.notes || "",
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
          trip_id: data.trip_id || undefined, customer_id: data.customer_id || undefined, supplier_id: data.supplier_id || undefined,
          location: data.location,
          check_in: data.check_in || undefined, check_out: data.check_out || undefined,
          guests: data.guests ? Number(data.guests) : undefined,
          price: data.price ? Number(data.price) : 0,
          cost_price: data.cost_price ? Number(data.cost_price) : 0, currency: "IDR",
          confirmation_code: data.confirmation_code || undefined,
          image_url: data.image_url || undefined, notes: data.notes || "",
        };
        if (data.id) await base44.entities.Booking.update(data.id, payload);
        else await base44.entities.Booking.create(payload);
      } else {
        const payload = {
          title: data.title, destination: data.destination, customer_id: data.customer_id || undefined, status: data.status || "draft",
          start_date: data.start_date || undefined, end_date: data.end_date || undefined,
          travelers: data.travelers ? Number(data.travelers) : undefined,
          budget_total: data.budget_total ? Number(data.budget_total) : 0, budget_currency: "IDR",
          travel_style: data.travel_style || undefined,
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className="text-[11px] rounded-lg border border-mora-primary/15 bg-white px-2 py-1 text-mora-primary capitalize outline-none focus:border-mora-gold/50">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : <Pill s={value} />;

  const canEditBookings = can(role, "bookings", "edit");
  const canDelBookings = can(role, "bookings", "delete");
  const canEditTrips = can(role, "trips", "edit");
  const canDelTrips = can(role, "trips", "delete");
  const d = editing?.data;

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Trips & Bookings</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Create, review and manage every trip and booking.</p>
        </div>
        {!editing && (tab === "bookings"
          ? can(role, "bookings", "create") && (
            <button onClick={startAddBooking} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> New booking</button>
          )
          : can(role, "trips", "create") && (
            <button onClick={startAddTrip} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> New trip</button>
          ))}
      </header>

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">
              {d.id ? "Edit" : "New"} {editing.kind === "booking" ? "booking" : "trip"}
            </h2>
            <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral"><X className="w-4 h-4" /></button>
          </div>

          {editing.kind === "booking" ? (
            <div className="space-y-3">
              <Row2>
                <Fld label="Type">
                  <select value={d.type} onChange={(e) => upd("type", e.target.value)} className="dash-input capitalize">
                    {BOOKING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Fld>
                <Fld label="Status">
                  <select value={d.status} onChange={(e) => upd("status", e.target.value)} className="dash-input capitalize">
                    {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Fld>
              </Row2>
              <Fld label="Title"><input value={d.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Garuda Indonesia — SIN → DPS" /></Fld>
              <Row2>
                <Fld label="Provider"><input value={d.provider} onChange={(e) => upd("provider", e.target.value)} className="dash-input" placeholder="Garuda Indonesia" /></Fld>
                <Fld label="Linked trip">
                  <select value={d.trip_id} onChange={(e) => upd("trip_id", e.target.value)} className="dash-input">
                    <option value="">— None —</option>
                    {(trips || []).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </Fld>
              </Row2>
              <Row2>
                <Fld label="Customer">
                  <select value={d.customer_id} onChange={(e) => upd("customer_id", e.target.value)} className="dash-input">
                    <option value="">— None —</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Fld>
                <Fld label="Supplier">
                  <select value={d.supplier_id} onChange={(e) => upd("supplier_id", e.target.value)} className="dash-input">
                    <option value="">— None —</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Fld>
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
                  <select value={d.status} onChange={(e) => upd("status", e.target.value)} className="dash-input capitalize">
                    {TRIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Fld>
              </Row2>
              <Fld label="Customer">
                <select value={d.customer_id} onChange={(e) => upd("customer_id", e.target.value)} className="dash-input">
                  <option value="">— None —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Fld>
              <Row2>
                <Fld label="Start date"><input type="date" value={d.start_date} onChange={(e) => upd("start_date", e.target.value)} className="dash-input" /></Fld>
                <Fld label="End date"><input type="date" value={d.end_date} onChange={(e) => upd("end_date", e.target.value)} className="dash-input" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Travelers"><input type="number" value={d.travelers} onChange={(e) => upd("travelers", e.target.value)} className="dash-input" placeholder="2" /></Fld>
                <Fld label="Budget (IDR)"><input type="number" value={d.budget_total} onChange={(e) => upd("budget_total", e.target.value)} className="dash-input" placeholder="48000000" /></Fld>
              </Row2>
              <Row2>
                <Fld label="Travel style">
                  <select value={d.travel_style} onChange={(e) => upd("travel_style", e.target.value)} className="dash-input capitalize">
                    <option value="">—</option>
                    {TRAVEL_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Fld>
                <Fld label="Cover image URL"><input value={d.cover_image} onChange={(e) => upd("cover_image", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
              </Row2>
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
          <div className="flex gap-2 mb-4">
            {["bookings", "trips"].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${tab === t ? "bg-mora-gold/10 text-gold" : "text-mora-neutral hover:bg-mora-primary/5"}`}>
                {t} {t === "bookings" && bookings ? `(${bookings.length})` : t === "trips" && trips ? `(${trips.length})` : ""}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
            {(tab === "bookings" ? bookings : trips) == null ? (
              <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
            ) : tab === "bookings" ? (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
                  <th className="px-5 py-3 font-medium">Title</th><th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Price</th><th className="px-5 py-3"></th>
                </tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]">
                      <td className="px-5 py-3 max-w-[240px]"><Link to={`/dashboard/bookings/${b.id}`} className="font-medium text-mora-primary hover:text-gold transition-colors truncate block">{b.title}</Link></td>
                      <td className="px-5 py-3 text-mora-neutral capitalize">{b.type}</td>
                      <td className="px-5 py-3 text-mora-neutral">{b.check_in ? moment(b.check_in).format("MMM D, YYYY") : "—"}</td>
                      <td className="px-5 py-3"><StatusCell value={b.status} options={BOOKING_STATUSES} editable={canEditBookings} onChange={(s) => setBookingStatus(b.id, s)} /></td>
                      <td className="px-5 py-3 text-right font-semibold text-gold">{b.price ? formatIDR(b.price) : "—"}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {canEditBookings && <button onClick={() => startEditBooking(b)} className="text-mora-primary hover:text-gold hover:bg-mora-primary/5 w-8 h-8 rounded-lg inline-flex items-center justify-center"><Pencil className="w-4 h-4" /></button>}
                        {canDelBookings && <button onClick={() => delBooking(b.id)} className="text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg inline-flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-mora-neutral/60">No bookings.</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
                  <th className="px-5 py-3 font-medium">Trip</th><th className="px-5 py-3 font-medium">Destination</th>
                  <th className="px-5 py-3 font-medium">Dates</th><th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Budget</th><th className="px-5 py-3"></th>
                </tr></thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]">
                      <td className="px-5 py-3 max-w-[220px]"><Link to={`/dashboard/trips/${t.id}`} className="font-medium text-mora-primary hover:text-gold transition-colors truncate block">{t.title}</Link></td>
                      <td className="px-5 py-3 text-mora-neutral">{t.destination}</td>
                      <td className="px-5 py-3 text-mora-neutral">{t.start_date ? moment(t.start_date).format("MMM D") : "—"}{t.end_date ? ` – ${moment(t.end_date).format("MMM D")}` : ""}</td>
                      <td className="px-5 py-3"><StatusCell value={t.status} options={TRIP_STATUSES} editable={canEditTrips} onChange={(s) => setTripStatus(t.id, s)} /></td>
                      <td className="px-5 py-3 text-right font-semibold text-gold">{t.budget_total ? formatIDR(t.budget_total) : "—"}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {canEditTrips && <button onClick={() => startEditTrip(t)} className="text-mora-primary hover:text-gold hover:bg-mora-primary/5 w-8 h-8 rounded-lg inline-flex items-center justify-center"><Pencil className="w-4 h-4" /></button>}
                        {canDelTrips && <button onClick={() => delTrip(t.id)} className="text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg inline-flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>}
                      </td>
                    </tr>
                  ))}
                  {trips.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-mora-neutral/60">No trips.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const Row2 = ({ children }) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const Fld = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
