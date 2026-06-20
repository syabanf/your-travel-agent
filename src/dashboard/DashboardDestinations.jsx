import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { Plus, Pencil, Trash2, MapPin, Search, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const EMPTY = { name: "", country: "", tagline: "", image: "", emoji: "🌍", fromPrice: "", vibes: "", lat: null, lng: null, gradient: ["#0EA5E9", "#14B8A6"], active: true };

function ClickCapture({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}
function Recenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, Math.max(map.getZoom(), 5)); }, [center, map]);
  return null;
}

export default function DashboardDestinations() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const load = async () => setItems(await base44.entities.Destination.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (d) => setEditing({ ...d, vibes: Array.isArray(d.vibes) ? d.vibes.join(", ") : (d.vibes || "") });
  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const geocode = async () => {
    if (!query.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (d.length) {
        const lat = parseFloat(d[0].lat), lng = parseFloat(d[0].lon);
        const name = d[0].display_name.split(",")[0];
        const country = d[0].display_name.split(",").slice(-1)[0].trim();
        setEditing((p) => ({ ...p, lat, lng, name: p.name || name, country: p.country || country }));
      } else toast.error("Location not found");
    } catch { toast.error("Search failed"); }
  };

  const save = async () => {
    if (!editing.name || !editing.country) { toast.error("Name and country are required"); return; }
    if (editing.lat == null || editing.lng == null) { toast.error("Pick a location on the map"); return; }
    setSaving(true);
    try {
      const payload = {
        name: editing.name, country: editing.country, tagline: editing.tagline,
        image: editing.image, emoji: editing.emoji || "🌍",
        fromPrice: editing.fromPrice ? Number(editing.fromPrice) : 0,
        vibes: String(editing.vibes || "").split(",").map((v) => v.trim()).filter(Boolean),
        lat: editing.lat, lng: editing.lng, gradient: editing.gradient || ["#0EA5E9", "#14B8A6"], active: editing.active !== false,
      };
      if (editing.id) await base44.entities.Destination.update(editing.id, payload);
      else await base44.entities.Destination.create(payload);
      toast.success(editing.id ? "Destination updated" : "Destination added");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save destination"); }
    finally { setSaving(false); }
  };

  const remove = async (d) => {
    await base44.entities.Destination.delete(d.id);
    toast.success("Destination removed");
    load();
  };

  const center = editing && editing.lat != null ? [editing.lat, editing.lng] : null;

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Destinations</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage the places travelers discover & swipe in the app.</p>
        </div>
        {!editing && (
          <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add destination
          </button>
        )}
      </header>

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit destination" : "New destination"}</h2>
            <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-3">
              <Row2>
                <FieldD label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Bali" /></FieldD>
                <FieldD label="Country"><input value={editing.country} onChange={(e) => upd("country", e.target.value)} className="dash-input" placeholder="Indonesia" /></FieldD>
              </Row2>
              <FieldD label="Tagline"><input value={editing.tagline} onChange={(e) => upd("tagline", e.target.value)} className="dash-input" placeholder="Island Paradise" /></FieldD>
              <FieldD label="Image URL"><input value={editing.image} onChange={(e) => upd("image", e.target.value)} className="dash-input" placeholder="https://…" /></FieldD>
              <Row2>
                <FieldD label="Emoji"><input value={editing.emoji} onChange={(e) => upd("emoji", e.target.value)} className="dash-input" placeholder="🏝️" /></FieldD>
                <FieldD label="From price (IDR)"><input type="number" value={editing.fromPrice} onChange={(e) => upd("fromPrice", e.target.value)} className="dash-input" placeholder="1500000" /></FieldD>
              </Row2>
              <FieldD label="Vibes (comma separated)"><input value={editing.vibes} onChange={(e) => upd("vibes", e.target.value)} className="dash-input" placeholder="Beach, Relax, Culture" /></FieldD>
              <div className="flex items-center gap-2 text-sm text-mora-neutral pt-1">
                <MapPin className="w-4 h-4 text-gold" />
                {editing.lat != null ? <span>{editing.lat.toFixed(4)}, {editing.lng.toFixed(4)}</span> : <span className="text-mora-neutral/60">Click the map or search to set coordinates</span>}
              </div>
              <div className="flex gap-2 pt-3">
                <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
              </div>
            </div>

            {/* Map */}
            <div>
              <div className="flex gap-2 mb-2">
                <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && geocode()} placeholder="Search a place…" className="dash-input flex-1" />
                <button onClick={geocode} className="w-11 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Search className="w-4 h-4" /></button>
              </div>
              <div className="rounded-xl overflow-hidden border border-mora-primary/10" style={{ height: 340 }}>
                <MapContainer center={center || [10, 80]} zoom={center ? 5 : 2} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                  <ClickCapture onPick={(lat, lng) => setEditing((p) => ({ ...p, lat, lng }))} />
                  <Recenter center={center} />
                  {center && <Marker position={center} />}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      ) : items == null ? (
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden group">
              <div className="h-28 relative bg-mora-primary">
                {d.image && <img src={d.image} alt={d.name} onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(d)} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-mora-primary hover:text-gold"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(d)} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span>{d.emoji}</span>
                  <h3 className="font-display font-semibold text-mora-primary">{d.name}</h3>
                </div>
                <p className="text-xs text-mora-neutral mt-0.5">{d.country}{d.tagline ? ` · ${d.tagline}` : ""}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-mora-neutral/70">{d.lat != null ? `${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}` : "No coords"}</span>
                  {d.fromPrice > 0 && <span className="text-sm font-semibold text-gold">{formatIDR(d.fromPrice)}</span>}
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-mora-neutral/60 col-span-full text-center py-10">No destinations yet — add your first one.</p>}
        </div>
      )}
    </div>
  );
}

const Row2 = ({ children }) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const FieldD = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
