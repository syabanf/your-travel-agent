import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { backend } from "@/api/backend";
import OLMap from "@/components/OLMap";
import { formatIDR } from "@/lib/currency";
import { destImages } from "@/lib/destinationImages";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import { ArrowLeft, Trash2, MapPin, Plane, Receipt, Wallet, Sparkles, Sun, Coins, Clock, Languages, FileText } from "lucide-react";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { confirmDialog } from "@/components/ConfirmDialog";

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-ich-gold/10 text-gold",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
  active: "bg-emerald-500/15 text-emerald-600",
  planned: "bg-blue-500/15 text-blue-600",
  draft: "bg-ich-primary/10 text-ich-neutral",
};

export default function DashboardDestinationDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();

  const [dest, setDest] = useState(undefined); // undefined = loading, null = not found
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [imgIdx, setImgIdx] = useState(0);
  const [tripQ, setTripQ] = useState("");
  const [tripStatus, setTripStatus] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, t, b] = await Promise.all([
          backend.entities.Destination.filter({ id }),
          backend.entities.Trip.list("-created_at", 500),
          backend.entities.Booking.list("-created_at", 500),
        ]);
        if (!alive) return;
        setDest((Array.isArray(d) ? d[0] : d) || null);
        setTrips(Array.isArray(t) ? t : []);
        setBookings(Array.isArray(b) ? b : []);
      } catch {
        if (alive) setDest(null);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // Loading
  if (dest === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not found
  if (dest === null) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-ich-neutral">Destination not found.</p>
        <Link to="/dashboard/destinations" className="inline-flex items-center gap-1.5 text-sm text-gold mt-3 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to destinations
        </Link>
      </div>
    );
  }

  // Derived insights (case-insensitive)
  const name = dest.name || "";
  const needle = name.toLowerCase();
  const matchTrips = trips.filter((t) => (t.destination || "").toLowerCase().includes(needle));
  const matchBookings = bookings.filter((b) => `${b.location || ""} ${b.title || ""}`.toLowerCase().includes(needle));
  const revenue = matchBookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + (b.price || 0), 0);

  const tripNeedle = tripQ.trim().toLowerCase();
  const tripStatuses = [...new Set(matchTrips.map((t) => t.status).filter(Boolean))];
  const filteredTrips = matchTrips.filter((t) => {
    if (tripStatus && t.status !== tripStatus) return false;
    return !tripNeedle || `${t.title || ""} ${t.destination || ""}`.toLowerCase().includes(tripNeedle);
  });

  const vibes = Array.isArray(dest.vibes) ? dest.vibes : String(dest.vibes || "").split(",").map((v) => v.trim()).filter(Boolean);
  const hasCoords = dest.lat != null && dest.lng != null;
  const gallery = destImages(dest);

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this destination?",
      body: `${name || "This destination"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await backend.entities.Destination.delete(id);
      toast.success("Destination removed");
      navigate("/dashboard/destinations");
    } catch {
      toast.error("Couldn't delete destination");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link to="/dashboard/destinations" className="inline-flex items-center gap-1.5 text-sm text-ich-neutral hover:text-gold mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to destinations
      </Link>

      {/* 1. Header */}
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-ich-primary flex items-center gap-2">
            <span>{dest.emoji || "🌍"}</span> {name}
          </h1>
          <p className="text-sm text-ich-neutral mt-1">
            {dest.country}{dest.tagline ? ` · ${dest.tagline}` : ""}
          </p>
          {dest.fromPrice > 0 && (
            <span className="inline-flex items-center mt-3 text-xs font-semibold text-gold bg-ich-gold/10 border border-ich-gold/20 rounded-full px-3 py-1">
              from {formatIDR(dest.fromPrice)}
            </span>
          )}
        </div>
        {can(role, "destinations", "delete") && (
          <button
            onClick={remove}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-red-600 bg-red-500/10 hover:bg-red-500/15 shrink-0"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </header>

      {/* 2. Insight KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Kpi icon={Plane} label="Trips here" value={matchTrips.length} />
        <Kpi icon={Receipt} label="Related bookings" value={matchBookings.length} />
        <Kpi icon={Wallet} label="Est. revenue" value={formatIDR(revenue)} />
      </div>

      {/* 3. Two-column grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Left — Details */}
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-6">
          <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">Details</h2>
          {gallery.length > 0 && (
            <div className="mb-4">
              <img
                src={gallery[Math.min(imgIdx, gallery.length - 1)]}
                alt={name}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="w-full h-44 object-cover rounded-xl"
              />
              {gallery.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {gallery.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIdx(i)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 ${i === imgIdx ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={url} alt={url || "Destination image"} onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {vibes.map((v) => (
                <span key={v} className="text-xs text-gold bg-ich-gold/10 border border-ich-gold/20 rounded-full px-2.5 py-1">{v}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-ich-neutral">
            <MapPin className="w-4 h-4 text-gold" />
            {hasCoords ? <span>{dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}</span> : <span className="text-ich-neutral/60">No coordinates</span>}
          </div>
          <div className="mt-4 pt-4 border-t border-ich-primary/5 space-y-1">
            <InfoRow icon={Sun} label="Best season" value={dest.best_season} />
            <InfoRow icon={Coins} label="Currency" value={dest.currency} />
            <InfoRow icon={Clock} label="Timezone" value={dest.timezone} />
            <InfoRow icon={Languages} label="Languages" value={dest.languages} />
            <InfoRow icon={FileText} label="Visa note" value={dest.visa_note} multiline />
          </div>
        </div>

        {/* Right — On the map */}
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-6">
          <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">On the map</h2>
          {hasCoords ? (
            <div className="rounded-xl overflow-hidden border border-ich-primary/10 h-64">
              <OLMap
                center={[dest.lng, dest.lat]}
                zoom={6}
                markers={[{ id: dest.id, lng: dest.lng, lat: dest.lat }]}
                interactive={false}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-xl bg-ich-primary/5 text-ich-neutral/60 text-sm">
              No coordinates
            </div>
          )}
        </div>
      </div>

      {/* 4. Trips to {name} */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6">
        <h2 className="font-display font-semibold text-lg text-ich-primary mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" /> Trips to {name}
        </h2>
        {matchTrips.length === 0 ? (
          <p className="text-ich-neutral/60 text-sm py-4">No trips yet.</p>
        ) : (
          <>
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              value={tripQ}
              onChange={(e) => setTripQ(e.target.value)}
              className="dash-input flex-1 min-w-[140px]"
              placeholder="Search trips…"
            />
            {tripStatuses.length > 0 && (
              <SearchableSelect
                value={tripStatus}
                onChange={setTripStatus}
                options={[{ value: "", label: "All statuses" }, ...tripStatuses.map((st) => ({ value: String(st), label: cap(st) }))]}
                placeholder="All statuses"
                ariaLabel="Filter by status"
                className="max-w-[150px]"
              />
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-ich-neutral border-b border-ich-primary/10">
                  <th className="py-2 pr-4 font-medium">Trip</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Dates</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((t) => (
                  <tr key={t.id} className="border-b border-ich-primary/5 last:border-0">
                    <td className="py-3 pr-4 font-medium text-ich-primary">{t.title}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[t.status] || statusPill.draft}`}>{t.status}</span>
                    </td>
                    <td className="py-3 text-ich-neutral">
                      {t.start_date ? moment(t.start_date).format("MMM D, YYYY") : "—"}
                      {t.end_date ? ` – ${moment(t.end_date).format("MMM D, YYYY")}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTrips.length === 0 && (
              <p className="text-ich-neutral/60 text-sm py-4">No trips match your filter.</p>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, multiline }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-ich-primary/5 last:border-0">
      <Icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] text-ich-neutral uppercase tracking-wider">{label}</div>
        <div className={`text-sm text-ich-primary break-words ${multiline ? "whitespace-pre-line" : ""}`}>{value || "—"}</div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-ich-primary/10 p-5 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-ich-gold/10 text-gold flex items-center justify-center mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <div className="stat-value text-xl font-display font-bold text-ich-primary">{value}</div>
      <div className="text-xs text-ich-neutral mt-0.5">{label}</div>
    </div>
  );
}
