import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OLMap from "@/components/OLMap";
import { formatIDR } from "@/lib/currency";
import { destImages } from "@/lib/destinationImages";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import { ArrowLeft, Trash2, MapPin, Plane, Receipt, Wallet, Sparkles } from "lucide-react";

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-mora-gold/10 text-gold",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
  active: "bg-emerald-500/15 text-emerald-600",
  planned: "bg-blue-500/15 text-blue-600",
  draft: "bg-mora-primary/10 text-mora-neutral",
};

export default function DashboardDestinationDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();

  const [dest, setDest] = useState(undefined); // undefined = loading, null = not found
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, t, b] = await Promise.all([
          base44.entities.Destination.filter({ id }),
          base44.entities.Trip.list("-created_date", 500),
          base44.entities.Booking.list("-created_date", 500),
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
      <div className="p-8 max-w-5xl">
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not found
  if (dest === null) {
    return (
      <div className="p-8 max-w-5xl">
        <p className="text-mora-neutral">Destination not found.</p>
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

  const vibes = Array.isArray(dest.vibes) ? dest.vibes : String(dest.vibes || "").split(",").map((v) => v.trim()).filter(Boolean);
  const hasCoords = dest.lat != null && dest.lng != null;
  const gallery = destImages(dest);

  const remove = async () => {
    try {
      await base44.entities.Destination.delete(id);
      toast.success("Destination removed");
      navigate("/dashboard/destinations");
    } catch {
      toast.error("Couldn't delete destination");
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/dashboard/destinations" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-gold mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to destinations
      </Link>

      {/* 1. Header */}
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary flex items-center gap-2">
            <span>{dest.emoji || "🌍"}</span> {name}
          </h1>
          <p className="text-sm text-mora-neutral mt-1">
            {dest.country}{dest.tagline ? ` · ${dest.tagline}` : ""}
          </p>
          {dest.fromPrice > 0 && (
            <span className="inline-flex items-center mt-3 text-xs font-semibold text-gold bg-mora-gold/10 border border-mora-gold/20 rounded-full px-3 py-1">
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Kpi icon={Plane} label="Trips here" value={matchTrips.length} />
        <Kpi icon={Receipt} label="Related bookings" value={matchBookings.length} />
        <Kpi icon={Wallet} label="Est. revenue" value={formatIDR(revenue)} />
      </div>

      {/* 3. Two-column grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Left — Details */}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Details</h2>
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
                      <img src={url} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {vibes.map((v) => (
                <span key={v} className="text-xs text-gold bg-mora-gold/10 border border-mora-gold/20 rounded-full px-2.5 py-1">{v}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-mora-neutral">
            <MapPin className="w-4 h-4 text-gold" />
            {hasCoords ? <span>{dest.lat.toFixed(4)}, {dest.lng.toFixed(4)}</span> : <span className="text-mora-neutral/60">No coordinates</span>}
          </div>
        </div>

        {/* Right — On the map */}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">On the map</h2>
          {hasCoords ? (
            <div className="rounded-xl overflow-hidden border border-mora-primary/10 h-64">
              <OLMap
                center={[dest.lng, dest.lat]}
                zoom={6}
                markers={[{ id: dest.id, lng: dest.lng, lat: dest.lat }]}
                interactive={false}
              />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-xl bg-mora-primary/5 text-mora-neutral/60 text-sm">
              No coordinates
            </div>
          )}
        </div>
      </div>

      {/* 4. Trips to {name} */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
        <h2 className="font-display font-semibold text-lg text-mora-primary mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" /> Trips to {name}
        </h2>
        {matchTrips.length === 0 ? (
          <p className="text-mora-neutral/60 text-sm py-4">No trips yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral border-b border-mora-primary/10">
                  <th className="py-2 pr-4 font-medium">Trip</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Dates</th>
                </tr>
              </thead>
              <tbody>
                {matchTrips.map((t) => (
                  <tr key={t.id} className="border-b border-mora-primary/5 last:border-0">
                    <td className="py-3 pr-4 font-medium text-mora-primary">{t.title}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[t.status] || statusPill.draft}`}>{t.status}</span>
                    </td>
                    <td className="py-3 text-mora-neutral">
                      {t.start_date ? moment(t.start_date).format("MMM D, YYYY") : "—"}
                      {t.end_date ? ` – ${moment(t.end_date).format("MMM D, YYYY")}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-mora-gold/10 text-gold flex items-center justify-center mb-3">
        <Icon className="w-4 h-4" />
      </div>
      <div className="stat-value text-xl font-display font-bold text-mora-primary">{value}</div>
      <div className="text-xs text-mora-neutral mt-0.5">{label}</div>
    </div>
  );
}
