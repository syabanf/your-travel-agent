import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { Image as ImageIcon, Plus, Trash2, X, Loader2, Save, Search, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import Skeleton from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";
import ViewToggle from "@/dashboard/ViewToggle";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";

const EMPTY = { title: "", url: "", tags: "" };

export default function DashboardMedia() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [view, setView] = useState("table");
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const load = async () => setItems(await base44.entities.MediaAsset.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (m) => setEditing({
    ...EMPTY, ...m,
    tags: Array.isArray(m.tags) ? m.tags.join(", ") : (m.tags || ""),
  });
  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!editing.title || !editing.url) { toast.error("Title and image URL are required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: editing.title,
        url: editing.url,
        tags: String(editing.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editing.id) await base44.entities.MediaAsset.update(editing.id, payload);
      else await base44.entities.MediaAsset.create(payload);
      toast.success(editing.id ? "Media updated" : "Media added");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save media"); }
    finally { setSaving(false); }
  };

  const remove = async (m) => {
    await base44.entities.MediaAsset.delete(m.id);
    toast.success("Media removed");
    load();
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied");
    } catch { toast.error("Couldn't copy URL"); }
  };

  // Date range scopes the whole view (chart & table); search refines the table.
  const scoped = (items || []).filter((m) => inRange(m.created_date, range));

  const filtered = scoped.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const inTitle = (m.title || "").toLowerCase().includes(q);
    const inTags = (Array.isArray(m.tags) ? m.tags : []).some((t) => (t || "").toLowerCase().includes(q));
    return inTitle || inTags;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    // newest
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  const pg = usePagination(sorted, 12, `${query}|${range}|${sortBy}`);

  // Insight aggregations (date-scoped)
  const tagCount = {};
  scoped.forEach((m) => {
    (Array.isArray(m.tags) ? m.tags : []).forEach((t) => {
      const k = (t || "").trim();
      if (k) tagCount[k] = (tagCount[k] || 0) + 1;
    });
  });
  const byTag = Object.entries(tagCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Media Library</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Reusable images for destinations, promotions &amp; content.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="media" data={items} />
            {can(role, "media", "create") && (
              <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add media
              </button>
            )}
          </div>
        )}
      </header>

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit media" : "New media"}</h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-3">
              <FieldD label="Title"><input value={editing.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Bali beach sunset" /></FieldD>
              <FieldD label="Image URL"><input value={editing.url} onChange={(e) => upd("url", e.target.value)} className="dash-input" placeholder="https://…" /></FieldD>
              <FieldD label="Tags (comma separated)"><input value={editing.tags} onChange={(e) => upd("tags", e.target.value)} className="dash-input" placeholder="beach, sunset, hero" /></FieldD>
              <div className="flex gap-2 pt-3">
                <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Preview</label>
              <div className="rounded-xl overflow-hidden border border-mora-primary/10 bg-mora-primary/5 aspect-video flex items-center justify-center">
                {editing.url
                  ? <img src={editing.url} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
                  : <ImageIcon className="w-8 h-8 text-mora-neutral/40" />}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-6">
          <ChartCard title="Assets by tag" subtitle="Most-used tags across the library."><CategoryBars data={byTag} money={false} /></ChartCard>
        </div>
      )}

      {items == null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
              <Skeleton className="aspect-square rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <ReadOnlyBanner resource="media" />
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search media…" />
            </div>
            <DateRangeSelect value={range} onChange={setRange} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="dash-input max-w-[160px]">
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
            </select>
            {(query || range !== "all" || sortBy !== "newest") && (
              <button onClick={() => { setQuery(""); setRange("all"); setSortBy("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <ViewToggle value={view} onChange={setView} />
          </div>

          <div className="text-xs text-mora-neutral uppercase tracking-wider mb-3">{sorted.length} {sorted.length === 1 ? "asset" : "assets"}</div>

          {view === "table" ? (
            <DataTable
              columns={[
                { key: "thumb", label: "", render: (a) => a.url ? <img src={a.url} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-10 h-10 rounded-lg object-cover" /> : <span className="w-10 h-10 rounded-lg bg-mora-primary/5 flex items-center justify-center text-mora-neutral/40"><ImageIcon className="w-4 h-4" /></span> },
                { key: "title", label: "Title", className: "font-medium text-mora-primary", render: (a) => a.title },
                { key: "type", label: "Tags", render: (a) => Array.isArray(a.tags) && a.tags.length ? (
                  <span className="flex flex-wrap gap-1">{a.tags.map((t, i) => <span key={i} className="text-[10px] bg-mora-primary/5 text-mora-neutral rounded-full px-1.5 py-0.5">{t}</span>)}</span>
                ) : "—" },
                { key: "url", label: "URL", render: (a) => <span className="text-mora-neutral/70 truncate block max-w-[280px]">{a.url}</span> },
              ]}
              rows={pg.pageItems}
              onRowClick={(a) => navigate(`/dashboard/media/${a.id}`)}
              empty="No media matches your search."
            />
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
            {pg.pageItems.map((m) => (
              <div key={m.id} onClick={() => navigate(`/dashboard/media/${m.id}`)} className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow press">
                <div className="aspect-square bg-mora-primary/5 relative">
                  {m.url && <img src={m.url} alt={m.title} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }} className="w-full h-full object-cover rounded-t-2xl" />}
                  <div className="absolute inset-0 items-center justify-center text-mora-neutral/40" style={{ display: m.url ? "none" : "flex" }}>
                    <ImageIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <div className="truncate font-medium text-sm text-mora-primary" title={m.title}>{m.title}</div>
                  {m.created_date && <div className="text-[10px] text-mora-neutral/60 mt-0.5">{moment(m.created_date).format("MMM D, YYYY")}</div>}
                  {Array.isArray(m.tags) && m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.tags.map((t, i) => (
                        <span key={i} className="text-[10px] bg-mora-primary/5 text-mora-neutral rounded-full px-1.5">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-auto pt-2">
                    <button onClick={(e) => { e.stopPropagation(); copyUrl(m.url); }} className="flex items-center gap-1 text-[11px] font-medium text-mora-neutral hover:text-gold">
                      <Copy className="w-3.5 h-3.5" /> Copy URL
                    </button>
                    <div className="flex gap-1 ml-auto">
                      {can(role, "media", "edit") && (
                        <button onClick={(e) => { e.stopPropagation(); startEdit(m); }} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-3.5 h-3.5" /></button>
                      )}
                      {can(role, "media", "delete") && (
                        <button onClick={(e) => { e.stopPropagation(); remove(m); }} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={ImageIcon}
                  title="No media yet"
                  hint="Add reusable images for destinations, promotions & content."
                  action={can(role, "media", "create") ? (
                    <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add media
                    </button>
                  ) : null}
                />
              </div>
            )}
            {items.length > 0 && filtered.length === 0 && (
              <div className="col-span-full">
                <EmptyState icon={Search} title="No matches" hint="No media matches your search." />
              </div>
            )}
          </div>
          )}
          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="assets" />
        </>
      )}
    </div>
  );
}

const FieldD = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
