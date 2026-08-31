import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { backend } from "@/api/backend";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { FileText, Plus, Pencil, Trash2, X, Loader2, Save, Search, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { confirmDialog } from "@/components/ConfirmDialog";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";
import SearchableSelect from "@/dashboard/SearchableSelect";


const EMPTY = { type: "page", status: "draft", title: "", slug: "", excerpt: "", body: "", cover_image: "", order: "" };

const TYPE_META = {
  page: { label: "Page", pill: "bg-ich-primary/10 text-ich-neutral" },
  faq: { label: "FAQ", pill: "bg-blue-500/15 text-blue-600" },
  announcement: { label: "Announcement", pill: "bg-ich-gold/10 text-gold" },
  hero: { label: "Hero", pill: "bg-indigo-500/15 text-indigo-600" },
};

const STATUS_META = {
  published: { label: "Published", pill: "bg-emerald-500/15 text-emerald-600" },
  draft: { label: "Draft", pill: "bg-ich-primary/10 text-ich-neutral" },
};

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function DashboardContent() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [range, setRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selected, setSelected] = useState(new Set());

  const load = async () => setItems(await backend.entities.Page.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (p) => setEditing({
    ...EMPTY, ...p,
    order: p.order ?? "",
  });
  const upd = (k, v) => setEditing((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!editing.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        type: editing.type || "page",
        status: editing.status || "draft",
        title: editing.title,
        slug: editing.slug?.trim() || slugify(editing.title),
        excerpt: editing.excerpt || "",
        body: editing.body || "",
        cover_image: editing.cover_image || "",
        order: editing.order === "" || editing.order == null ? 0 : Number(editing.order),
      };
      if (editing.id) await backend.entities.Page.update(editing.id, payload);
      else await backend.entities.Page.create(payload);
      toast.success(editing.id ? "Content saved" : "Content created");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save content"); }
    finally { setSaving(false); }
  };

  const remove = async (p) => {
    const ok = await confirmDialog({
      title: "Delete this content item?",
      body: `${p.title || "This item"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await backend.entities.Page.delete(p.id);
    toast.success("Removed");
    load();
  };

  const toggleSelect = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const deleteSelected = async () => {
    const ids = [...selected];
    const ok = await confirmDialog({
      title: ids.length === 1 ? "Delete this content item?" : `Delete ${ids.length} content items?`,
      body: `${ids.length} item${ids.length === 1 ? "" : "s"} will be permanently removed. This can't be undone.`,
      confirmLabel: ids.length === 1 ? "Delete" : "Delete all",
      destructive: true,
    });
    if (!ok) return;
    try {
      for (const id of ids) await backend.entities.Page.delete(id);
      toast.success(`${ids.length} item${ids.length === 1 ? "" : "s"} deleted`);
      setSelected(new Set());
      await load();
    } catch { toast.error("Couldn't delete selection"); }
  };

  // Date range scopes the whole view (charts & table); search/selects refine the table.
  const scoped = (items || []).filter((p) => inRange(p.created_date, range));

  const filtered = scoped.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || [p.title, p.slug, p.excerpt].some((v) => (v || "").toLowerCase().includes(q));
    const matchesType = typeF === "all" || (p.type || "page") === typeF;
    const matchesStatus = statusF === "all" || (p.status || "draft") === statusF;
    return matchesQ && matchesType && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "status") return (a.status || "draft").localeCompare(b.status || "draft");
    if (sortBy === "type") return (a.type || "page").localeCompare(b.type || "page");
    // newest
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  const pg = usePagination(sorted, 10, `${query}|${typeF}|${statusF}|${range}|${sortBy}`);

  const canDelete = can(role, "content", "delete");

  // Insight aggregations (date-scoped)
  const typeCount = {}, statusCount = {};
  scoped.forEach((p) => {
    const t = p.type || "page";
    const s = p.status || "draft";
    typeCount[t] = (typeCount[t] || 0) + 1;
    statusCount[s] = (statusCount[s] || 0) + 1;
  });
  const byType = Object.keys(TYPE_META)
    .map((t) => ({ name: TYPE_META[t].label, value: typeCount[t] || 0 }))
    .filter((d) => d.value);
  const STATUS_COLOR = { published: "#10B981", draft: "#C99A3F" };
  const byStatus = Object.keys(statusCount).map((s) => ({
    name: STATUS_META[s]?.label || (s ? s[0].toUpperCase() + s.slice(1) : s),
    value: statusCount[s],
    color: STATUS_COLOR[s],
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ich-primary">Content</h1>
          <p className="text-sm text-ich-neutral mt-0.5">Manage app pages, FAQs, announcements &amp; hero copy.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="content" data={items} />
            {can(role, "content", "create") && (
              <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> New page
              </button>
            )}
          </div>
        )}
      </header>

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCard title="Pages by type" subtitle="Content mix across sections."><CategoryBars data={byType} money={false} /></ChartCard>
          <ChartCard title="By status" subtitle="Published vs draft."><MixDonut data={byStatus} /></ChartCard>
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-ich-primary">{editing.id ? "Edit content" : "New content"}</h2>
            <button onClick={() => setEditing(null)} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-ich-primary/5 flex items-center justify-center text-ich-neutral press"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Type">
                <SearchableSelect
                  value={editing.type}
                  onChange={(v) => upd("type", v)}
                  options={[
                    { value: "page", label: "Page" },
                    { value: "faq", label: "FAQ" },
                    { value: "announcement", label: "Announcement" },
                    { value: "hero", label: "Hero" },
                  ]}
                  ariaLabel="Type"
                />
              </Fld>
              <Fld label="Status">
                <SearchableSelect
                  value={editing.status}
                  onChange={(v) => upd("status", v)}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                  ]}
                  ariaLabel="Status"
                />
              </Fld>
            </div>
            <Fld label="Title"><input value={editing.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Frequently Asked Questions" /></Fld>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Slug">
                <input
                  value={editing.slug}
                  onChange={(e) => upd("slug", e.target.value)}
                  onBlur={(e) => { if (!e.target.value.trim() && editing.title) upd("slug", slugify(editing.title)); }}
                  className="dash-input"
                  placeholder="auto from title"
                />
              </Fld>
              <Fld label="Order"><input type="number" value={editing.order} onChange={(e) => upd("order", e.target.value)} className="dash-input" placeholder="0" /></Fld>
            </div>
            <Fld label="Excerpt"><textarea value={editing.excerpt} onChange={(e) => upd("excerpt", e.target.value)} className="dash-input !h-auto py-2" rows={2} placeholder="Short summary shown in lists…" /></Fld>
            <Fld label="Cover image URL"><input value={editing.cover_image} onChange={(e) => upd("cover_image", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
            <Fld label="Body"><textarea value={editing.body} onChange={(e) => upd("body", e.target.value)} className="dash-input !h-auto py-2" rows={6} placeholder="Full content…" /></Fld>
            <div className="flex gap-2 pt-3">
              <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-ich-neutral hover:bg-ich-primary/5">Cancel</button>
            </div>
          </div>
        </div>
      ) : items == null ? (
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-4"><SkeletonRows rows={6} /></div>
      ) : (
        <div className="space-y-3">
          <ReadOnlyBanner resource="content" />
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ich-neutral/50" />
              <input
                className="dash-input pl-9"
                placeholder="Search content…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <SearchableSelect
              value={typeF}
              onChange={setTypeF}
              options={[
                { value: "all", label: "All types" },
                { value: "page", label: "Page" },
                { value: "faq", label: "FAQ" },
                { value: "announcement", label: "Announcement" },
                { value: "hero", label: "Hero" },
              ]}
              ariaLabel="Filter by type"
              className="max-w-[170px]"
            />
            <SearchableSelect
              value={statusF}
              onChange={setStatusF}
              options={[
                { value: "all", label: "All status" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
              ariaLabel="Filter by status"
              className="max-w-[150px]"
            />
            <DateRangeSelect value={range} onChange={setRange} />
            <SearchableSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest" },
                { value: "title", label: "Title A–Z" },
                { value: "status", label: "Status" },
                { value: "type", label: "Type" },
              ]}
              ariaLabel="Sort by"
              className="max-w-[160px]"
            />
            {(query || typeF !== "all" || statusF !== "all" || range !== "all" || sortBy !== "newest") && (
              <button onClick={() => { setQuery(""); setTypeF("all"); setStatusF("all"); setRange("all"); setSortBy("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-ich-primary/15 text-sm text-ich-neutral hover:bg-ich-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {selected.size > 0 && canDelete && (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-ich-primary/10 px-4 py-2.5 text-sm">
              <span className="font-medium text-ich-primary">{selected.size} selected</span>
              <span className="text-ich-neutral/40">·</span>
              <button onClick={deleteSelected} className="font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Delete selected
              </button>
            </div>
          )}

          <div className="space-y-3 stagger">
          {pg.pageItems.map((p) => {
            const meta = TYPE_META[p.type] || TYPE_META.page;
            const sm = STATUS_META[p.status] || STATUS_META.draft;
            const isSel = selected.has(p.id);
            return (
              <div key={p.id} onClick={() => navigate(`/dashboard/content/${p.id}`)} className="bg-white rounded-2xl border border-ich-primary/10 p-4 flex items-center gap-4 group hover:shadow-md transition-shadow cursor-pointer press">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(p.id); }}
                  className={`shrink-0 ${isSel ? "text-gold" : "text-ich-neutral/40 hover:text-ich-neutral"}`}
                  aria-label={isSel ? "Deselect" : "Select"}
                >
                  {isSel ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
                <div className="w-16 h-14 rounded-xl overflow-hidden bg-ich-primary/5 shrink-0 flex items-center justify-center">
                  {p.cover_image
                    ? <img src={p.cover_image} alt={p.title} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
                    : <FileText className="w-5 h-5 text-ich-neutral/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.pill}`}>{meta.label}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${sm.pill}`}>{sm.label}</span>
                  </div>
                  <h3 className="font-display font-semibold text-ich-primary truncate mt-1">{p.title}</h3>
                  {p.slug && <p className="text-xs font-mono text-ich-neutral/60 truncate">/{p.slug}</p>}
                  {p.excerpt && <p className="text-xs text-ich-neutral truncate">{p.excerpt}</p>}
                </div>
                <div className="text-right shrink-0 mr-2 hidden sm:block">
                  {p.created_date && <p className="text-[11px] text-ich-neutral/60">{moment(p.created_date).format("MMM D, YYYY")}</p>}
                </div>
                {(can(role, "content", "edit") || canDelete) && (
                  <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {can(role, "content", "edit") && (
                      <button onClick={(e) => { e.stopPropagation(); startEdit(p); }} aria-label="Edit" className="w-9 h-9 rounded-lg hover:bg-ich-primary/5 flex items-center justify-center text-ich-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                    )}
                    {canDelete && (
                      <button onClick={(e) => { e.stopPropagation(); remove(p); }} aria-label="Delete" className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="pages" />
          {items.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No content yet"
              hint="Create app pages, FAQs, announcements & hero copy."
              action={can(role, "content", "create") ? (
                <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New page
                </button>
              ) : null}
            />
          )}
          {items.length > 0 && filtered.length === 0 && (
            <EmptyState icon={Search} title="No matches" hint="No content matches your search or filters." />
          )}
        </div>
      )}
    </div>
  );
}

const Fld = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-ich-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
