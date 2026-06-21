import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { FileText, Plus, Pencil, Trash2, X, Loader2, Save, Search, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";

const PAGE_SIZE = 12;

const EMPTY = { type: "page", status: "draft", title: "", slug: "", excerpt: "", body: "", cover_image: "", order: "" };

const TYPE_META = {
  page: { label: "Page", pill: "bg-mora-primary/10 text-mora-neutral" },
  faq: { label: "FAQ", pill: "bg-blue-500/15 text-blue-600" },
  announcement: { label: "Announcement", pill: "bg-mora-gold/10 text-gold" },
  hero: { label: "Hero", pill: "bg-indigo-500/15 text-indigo-600" },
};

const STATUS_META = {
  published: { label: "Published", pill: "bg-emerald-500/15 text-emerald-600" },
  draft: { label: "Draft", pill: "bg-mora-primary/10 text-mora-neutral" },
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
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(new Set());

  const load = async () => setItems(await base44.entities.Page.list("-created_date", 500));
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
      if (editing.id) await base44.entities.Page.update(editing.id, payload);
      else await base44.entities.Page.create(payload);
      toast.success(editing.id ? "Content saved" : "Content created");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save content"); }
    finally { setSaving(false); }
  };

  const remove = async (p) => {
    await base44.entities.Page.delete(p.id);
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
    try {
      for (const id of ids) await base44.entities.Page.delete(id);
      toast.success(`${ids.length} item${ids.length === 1 ? "" : "s"} deleted`);
      setSelected(new Set());
      await load();
    } catch { toast.error("Couldn't delete selection"); }
  };

  const filtered = (items || []).filter((p) => {
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

  const shown = sorted.slice(0, visible);

  // Reset pagination whenever the filter/search/sort narrows the list.
  useEffect(() => { setVisible(PAGE_SIZE); }, [query, typeF, statusF, sortBy]);

  const canDelete = can(role, "content", "delete");

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Content</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage app pages, FAQs, announcements &amp; hero copy.</p>
        </div>
        {!editing && can(role, "content", "create") && (
          <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New page
          </button>
        )}
      </header>

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit content" : "New content"}</h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Type">
                <select value={editing.type} onChange={(e) => upd("type", e.target.value)} className="dash-input">
                  <option value="page">Page</option>
                  <option value="faq">FAQ</option>
                  <option value="announcement">Announcement</option>
                  <option value="hero">Hero</option>
                </select>
              </Fld>
              <Fld label="Status">
                <select value={editing.status} onChange={(e) => upd("status", e.target.value)} className="dash-input">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Fld>
            </div>
            <Fld label="Title"><input value={editing.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Frequently Asked Questions" /></Fld>
            <div className="grid grid-cols-2 gap-3">
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
              <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
            </div>
          </div>
        </div>
      ) : items == null ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-4"><SkeletonRows rows={6} /></div>
      ) : (
        <div className="space-y-3">
          <ReadOnlyBanner resource="content" />
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
              <input
                className="dash-input pl-9"
                placeholder="Search content…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="dash-input max-w-[170px]">
              <option value="all">All types</option>
              <option value="page">Page</option>
              <option value="faq">FAQ</option>
              <option value="announcement">Announcement</option>
              <option value="hero">Hero</option>
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="dash-input max-w-[150px]">
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="dash-input max-w-[160px]">
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
              <option value="status">Status</option>
              <option value="type">Type</option>
            </select>
          </div>

          {selected.size > 0 && canDelete && (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-mora-primary/10 px-4 py-2.5 text-sm">
              <span className="font-medium text-mora-primary">{selected.size} selected</span>
              <span className="text-mora-neutral/40">·</span>
              <button onClick={deleteSelected} className="font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Delete selected
              </button>
            </div>
          )}

          <div className="space-y-3 stagger">
          {shown.map((p) => {
            const meta = TYPE_META[p.type] || TYPE_META.page;
            const sm = STATUS_META[p.status] || STATUS_META.draft;
            const isSel = selected.has(p.id);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-mora-primary/10 p-4 flex items-center gap-4 group hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSelect(p.id)}
                  className={`shrink-0 ${isSel ? "text-gold" : "text-mora-neutral/40 hover:text-mora-neutral"}`}
                  aria-label={isSel ? "Deselect" : "Select"}
                >
                  {isSel ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
                <div className="w-16 h-14 rounded-xl overflow-hidden bg-mora-primary/5 shrink-0 flex items-center justify-center">
                  {p.cover_image
                    ? <img src={p.cover_image} alt={p.title} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
                    : <FileText className="w-5 h-5 text-mora-neutral/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.pill}`}>{meta.label}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${sm.pill}`}>{sm.label}</span>
                  </div>
                  <h3 className="font-display font-semibold text-mora-primary truncate mt-1">{p.title}</h3>
                  {p.slug && <p className="text-xs font-mono text-mora-neutral/60 truncate">/{p.slug}</p>}
                  {p.excerpt && <p className="text-xs text-mora-neutral truncate">{p.excerpt}</p>}
                </div>
                <div className="text-right shrink-0 mr-2 hidden sm:block">
                  {p.created_date && <p className="text-[11px] text-mora-neutral/60">{moment(p.created_date).format("MMM D, YYYY")}</p>}
                </div>
                {(can(role, "content", "edit") || canDelete) && (
                  <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {can(role, "content", "edit") && (
                      <button onClick={() => startEdit(p)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(p)} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
          {shown.length < sorted.length && (
            <div className="flex items-center justify-center pt-1">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-mora-primary hover:bg-mora-primary/5 border border-mora-primary/10 press"
              >
                Show more ({sorted.length - shown.length})
              </button>
            </div>
          )}
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
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
