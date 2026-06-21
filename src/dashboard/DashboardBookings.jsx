import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { Trash2 } from "lucide-react";
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

export default function DashboardBookings() {
  const { role } = useRole();
  const [tab, setTab] = useState("bookings");
  const [trips, setTrips] = useState(null);
  const [bookings, setBookings] = useState(null);

  const load = async () => {
    setTrips(await base44.entities.Trip.list("-created_date", 500));
    setBookings(await base44.entities.Booking.list("-created_date", 500));
  };
  useEffect(() => { load(); }, []);

  const delTrip = async (id) => { await base44.entities.Trip.delete(id); toast.success("Trip deleted"); load(); };
  const delBooking = async (id) => { await base44.entities.Booking.delete(id); toast.success("Booking deleted"); load(); };
  const setBookingStatus = async (id, status) => { await base44.entities.Booking.update(id, { status }); toast.success("Status updated"); load(); };
  const setTripStatus = async (id, status) => { await base44.entities.Trip.update(id, { status }); toast.success("Status updated"); load(); };

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

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-mora-primary">Trips & Bookings</h1>
        <p className="text-sm text-mora-neutral mt-0.5">Review and manage everything travelers have created.</p>
      </header>

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
                  <td className="px-5 py-3 font-medium text-mora-primary truncate max-w-[240px]">{b.title}</td>
                  <td className="px-5 py-3 text-mora-neutral capitalize">{b.type}</td>
                  <td className="px-5 py-3 text-mora-neutral">{b.check_in ? moment(b.check_in).format("MMM D, YYYY") : "—"}</td>
                  <td className="px-5 py-3"><StatusCell value={b.status} options={BOOKING_STATUSES} editable={canEditBookings} onChange={(s) => setBookingStatus(b.id, s)} /></td>
                  <td className="px-5 py-3 text-right font-semibold text-gold">{b.price ? formatIDR(b.price) : "—"}</td>
                  <td className="px-5 py-3 text-right">{canDelBookings && <button onClick={() => delBooking(b.id)} className="text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg inline-flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>}</td>
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
                  <td className="px-5 py-3 font-medium text-mora-primary truncate max-w-[220px]">{t.title}</td>
                  <td className="px-5 py-3 text-mora-neutral">{t.destination}</td>
                  <td className="px-5 py-3 text-mora-neutral">{t.start_date ? moment(t.start_date).format("MMM D") : "—"}{t.end_date ? ` – ${moment(t.end_date).format("MMM D")}` : ""}</td>
                  <td className="px-5 py-3"><StatusCell value={t.status} options={TRIP_STATUSES} editable={canEditTrips} onChange={(s) => setTripStatus(t.id, s)} /></td>
                  <td className="px-5 py-3 text-right font-semibold text-gold">{t.budget_total ? formatIDR(t.budget_total) : "—"}</td>
                  <td className="px-5 py-3 text-right">{canDelTrips && <button onClick={() => delTrip(t.id)} className="text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg inline-flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>}</td>
                </tr>
              ))}
              {trips.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-mora-neutral/60">No trips.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
