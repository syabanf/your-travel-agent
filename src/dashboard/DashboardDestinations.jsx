import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OLMap from "@/components/OLMap";
import { formatIDR } from "@/lib/currency";
import { Plus, Pencil, Trash2, MapPin, Search, X, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "./RoleContext";
import { can } from "./rbac";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import Skeleton from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";
import ViewToggle from "@/dashboard/ViewToggle";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars, MixDonut } from "@/dashboard/charts";

const EMPTY = { name: "", country: "", tagline: "", images: [""], emoji: "🌍", fromPrice: "", vibes: "", lat: null, lng: null, gradient: ["#0EA5E9", "#14B8A6"], active: true };

export default function DashboardDestinations() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [view, setView] = useState("table");
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const searchRef = useRef(null);

  const load = async () => setItems(await base44.entities.Destination.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (d) => setEditing({
    ...d,
    vibes: Array.isArray(d.vibes) ? d.vibes.join(", ") : (d.vibes || ""),
    images: (Array.isArray(d.images) && d.images.length) ? d.images : (d.image ? [d.image] : [""]),
  });
  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));
  const updImage = (i, v) => setEditing((p) => { const images = [...(p.images || [])]; images[i] = v; return { ...p, images }; });
  const addImage = () => setEditing((p) => ({ ...p, images: [...(p.images || []), ""] }));
  const removeImage = (i) => setEditing((p) => { const images = (p.images || []).filter((_, idx) => idx !== i); return { ...p, images: images.length ? images : [""] }; });

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
      const images = (editing.images || []).map((s) => String(s).trim()).filter(Boolean);
      const payload = {
        name: editing.name, country: editing.country, tagline: editing.tagline,
        image: images[0] || "", images, emoji: editing.emoji || "🌍",
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

  const filtered = (items || []).filter((d) => {
    const q = query.trim().toLowerCase();
    const mq = !q || [d.name, d.country, d.tagline].some((v) => (v || "").toLowerCase().includes(q));
    const ms = statusF === "all" || (statusF === "active" ? d.active !== false : d.active === false);
    return mq && ms;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "price") return (Number(b.fromPrice) || 0) - (Number(a.fromPrice) || 0);
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });
  const pg = usePagination(sorted, 12, `${query}|${statusF}|${sortBy}`);

  // Insight aggregations
  const countryCount = {};
  (items || []).forEach((d) => { const c = d.country || "—"; countryCount[c] = (countryCount[c] || 0) + 1; });
  const byCountry = Object.entries(countryCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const statusMix = [
    { name: "Active", value: (items || []).filter((d) => d.active !== false).length, color: "#10B981" },
    { name: "Inactive", value: (items || []).filter((d) => d.active === false).length, color: "#94A3B8" },
  ];
  const priceByDest = (items || [])
    .map((d) => ({ name: d.name || "—", value: Number(d.fromPrice) || 0 }))
    .filter((d) => d.value)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="destinations" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Destinations</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage the places travelers discover & swipe in the app.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="destinations" />
            {can(role, "destinations", "create") && (
              <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add destination
              </button>
            )}
          </div>
        )}
      </header>

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ChartCard title="Destinations by country" subtitle="Where the catalog concentrates."><CategoryBars data={byCountry} money={false} /></ChartCard>
          <ChartCard title="Active vs inactive" subtitle="Catalog visibility."><MixDonut data={statusMix} /></ChartCard>
          <ChartCard title="Starting price by destination" subtitle="Top 8 by from-price."><CategoryBars data={priceByDest} money={true} /></ChartCard>
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit destination" : "New destination"}</h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-3">
              <Row2>
                <FieldD label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Bali" /></FieldD>
                <FieldD label="Country"><input value={editing.country} onChange={(e) => upd("country", e.target.value)} className="dash-input" placeholder="Indonesia" /></FieldD>
              </Row2>
              <FieldD label="Tagline"><input value={editing.tagline} onChange={(e) => upd("tagline", e.target.value)} className="dash-input" placeholder="Island Paradise" /></FieldD>
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Images <span className="text-mora-neutral/50 normal-case tracking-normal">· first is the cover</span></label>
                <div className="space-y-2">
                  {(editing.images || [""]).map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-mora-primary/5 shrink-0 flex items-center justify-center">
                        {url ? <img src={url} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-mora-neutral/40" />}
                      </div>
                      <input value={url} onChange={(e) => updImage(i, e.target.value)} className="dash-input flex-1" placeholder="https://…" />
                      {(editing.images || []).length > 1 && (
                        <button type="button" onClick={() => removeImage(i)} className="w-9 h-9 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addImage} className="mt-2 text-xs text-gold font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add image</button>
              </div>
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
                <OLMap
                  center={editing.lat != null ? [editing.lng, editing.lat] : [100, 5]}
                  zoom={editing.lat != null ? 5 : 2}
                  markers={editing.lat != null ? [{ id: "sel", lng: editing.lng, lat: editing.lat }] : []}
                  onClick={(lng, lat) => setEditing((p) => ({ ...p, lat, lng }))}
                />
              </div>
            </div>
          </div>
        </div>
      ) : items == null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
              <Skeleton className="h-28 rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (() => {
        return (
        <>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search destinations…" />
          </div>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="dash-input max-w-[160px]">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="dash-input max-w-[160px]">
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="price">Price</option>
          </select>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {view === "table" ? (
          <DataTable
            columns={[
              { key: "name", label: "Destination", className: "font-medium text-mora-primary", render: (d) => (
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-mora-gold/10 flex items-center justify-center text-base shrink-0">{d.emoji || "🌍"}</span>
                  <span className="min-w-0"><span className="block truncate">{d.name}</span>{d.tagline ? <span className="block text-[11px] text-mora-neutral/60 truncate">{d.tagline}</span> : null}</span>
                </span>
              ) },
              { key: "country", label: "Country", render: (d) => d.country || "—" },
              { key: "vibes", label: "Vibes", render: (d) => (Array.isArray(d.vibes) ? d.vibes.slice(0, 3).join(", ") : "") || "—" },
              { key: "status", label: "Status", render: (d) => <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${d.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{d.active !== false ? "active" : "inactive"}</span> },
              { key: "fromPrice", label: "From", align: "right", className: "text-right font-semibold text-gold", render: (d) => d.fromPrice > 0 ? formatIDR(d.fromPrice) : "—" },
            ]}
            rows={pg.pageItems}
            onRowClick={(d) => navigate(`/dashboard/destinations/${d.id}`)}
            empty="No destinations match your filters."
          />
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {pg.pageItems.map((d) => (
            <Link key={d.id} to={`/dashboard/destinations/${d.id}`} className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden group hover:shadow-md transition-shadow block press">
              <div className="h-28 relative bg-mora-primary">
                {d.image && <img src={d.image} alt={d.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />}
                {d.images?.length > 1 && (
                  <span className="absolute bottom-2 left-2 z-10 text-[10px] bg-black/55 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> {d.images.length}
                  </span>
                )}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can(role, "destinations", "edit") && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(d); }} className="w-9 h-9 rounded-lg bg-white/90 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>}
                  {can(role, "destinations", "delete") && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(d); }} className="w-9 h-9 rounded-lg bg-white/90 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>}
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
            </Link>
          ))}
          {items.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={MapPin}
                title="No destinations yet"
                hint="Add the places travelers discover and swipe in the app."
                action={can(role, "destinations", "create") ? (
                  <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add destination
                  </button>
                ) : null}
              />
            </div>
          )}
          {items.length > 0 && filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Search} title="No matches" hint="No destinations match your search or filters." />
            </div>
          )}
        </div>
        )}
        <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="destinations" />
        </>
        );
      })()}
    </div>
  );
}

const Row2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
const FieldD = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
