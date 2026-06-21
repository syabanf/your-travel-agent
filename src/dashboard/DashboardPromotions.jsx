import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { Plus, Pencil, Trash2, X, Loader2, Save, Megaphone, CalendarDays, Newspaper, Search } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { useRole } from "./RoleContext";
import { can } from "./rbac";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";

const EMPTY = { type: "promo", title: "", description: "", image: "", discount: "", price: "", valid_until: "", date: "", location: "", cta: "Learn more", featured: false };
const TYPE_META = {
  promo: { label: "Promotion", icon: Megaphone, pill: "bg-mora-gold/10 text-gold" },
  event: { label: "Event", icon: CalendarDays, pill: "bg-blue-500/15 text-blue-600" },
  news: { label: "News", icon: Newspaper, pill: "bg-emerald-500/15 text-emerald-600" },
};

export default function DashboardPromotions() {
  const { role } = useRole();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [visible, setVisible] = useState(12);

  const [searchParams, setSearchParams] = useSearchParams();
  const load = async () => setItems(await base44.entities.Promotion.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  // Open the editor when arriving from a detail page (?edit=<id>).
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && items) {
      const it = items.find((p) => p.id === editId);
      if (it) setEditing(it);
      setSearchParams({}, { replace: true });
    }
  }, [items, searchParams, setSearchParams]);

  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!editing.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = {
        type: editing.type, title: editing.title, description: editing.description, image: editing.image,
        discount: editing.discount ? Number(editing.discount) : undefined,
        price: editing.price ? Number(editing.price) : undefined,
        valid_until: editing.valid_until || undefined, date: editing.date || undefined,
        location: editing.location, cta: editing.cta || "Learn more", featured: !!editing.featured,
      };
      if (editing.id) await base44.entities.Promotion.update(editing.id, payload);
      else await base44.entities.Promotion.create(payload);
      toast.success(editing.id ? "Saved" : "Created");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save"); }
    finally { setSaving(false); }
  };

  const remove = async (p) => { await base44.entities.Promotion.delete(p.id); toast.success("Removed"); load(); };

  const filtered = (items || []).filter((p) => {
    const q = query.trim().toLowerCase();
    const mq = !q || [p.title, p.description, p.location].some((v) => (v || "").toLowerCase().includes(q));
    const mt = typeF === "all" || (p.type || "promo") === typeF;
    return mq && mt;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "type") return (a.type || "promo").localeCompare(b.type || "promo");
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  // Reset pagination whenever the filter/sort inputs change.
  useEffect(() => { setVisible(12); }, [query, typeF, sortBy]);

  return (
    <div className="p-8 max-w-6xl">
      <ReadOnlyBanner resource="promotions" />
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Promotions & Events</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Publish the offers, events and news shown in the app's "What's New".</p>
        </div>
        {!editing && can(role, "promotions", "create") && (
          <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New entry
          </button>
        )}
      </header>

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit entry" : "New entry"}</h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <Fld label="Type">
              <select value={editing.type} onChange={(e) => upd("type", e.target.value)} className="dash-input">
                <option value="promo">Promotion</option>
                <option value="event">Event</option>
                <option value="news">News</option>
              </select>
            </Fld>
            <Fld label="Title"><input value={editing.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Flash Sale: Bali Villas" /></Fld>
            <Fld label="Description"><textarea value={editing.description} onChange={(e) => upd("description", e.target.value)} className="dash-input !h-auto py-2" rows={2} /></Fld>
            <Fld label="Image URL"><input value={editing.image} onChange={(e) => upd("image", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
            <div className="grid grid-cols-2 gap-3">
              {editing.type === "promo" ? (
                <>
                  <Fld label="Discount %"><input type="number" value={editing.discount} onChange={(e) => upd("discount", e.target.value)} className="dash-input" /></Fld>
                  <Fld label="Price (IDR)"><input type="number" value={editing.price} onChange={(e) => upd("price", e.target.value)} className="dash-input" /></Fld>
                  <Fld label="Valid until"><input type="date" value={editing.valid_until} onChange={(e) => upd("valid_until", e.target.value)} className="dash-input" /></Fld>
                  <Fld label="Location"><input value={editing.location} onChange={(e) => upd("location", e.target.value)} className="dash-input" /></Fld>
                </>
              ) : (
                <>
                  <Fld label="Date"><input type="date" value={editing.date} onChange={(e) => upd("date", e.target.value)} className="dash-input" /></Fld>
                  <Fld label="Location"><input value={editing.location} onChange={(e) => upd("location", e.target.value)} className="dash-input" /></Fld>
                </>
              )}
            </div>
            <Fld label="Button label"><input value={editing.cta} onChange={(e) => upd("cta", e.target.value)} className="dash-input" /></Fld>
            <label className="flex items-center gap-2 text-sm text-mora-neutral pt-1">
              <input type="checkbox" checked={!!editing.featured} onChange={(e) => upd("featured", e.target.checked)} className="accent-[#AD1F23] w-4 h-4" />
              Feature this as the hero banner
            </label>
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
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mora-neutral pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search entries…" />
            </div>
            <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="dash-input max-w-[160px]">
              <option value="all">All types</option>
              <option value="promo">Promotion</option>
              <option value="event">Event</option>
              <option value="news">News</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="dash-input max-w-[160px]">
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
              <option value="type">Type</option>
            </select>
          </div>
          <div className="space-y-3 stagger">
          {sorted.slice(0, visible).map((p) => {
            const meta = TYPE_META[p.type] || TYPE_META.promo;
            return (
              <Link key={p.id} to={`/dashboard/promotions/${p.id}`} className="bg-white rounded-2xl border border-mora-primary/10 p-4 flex items-center gap-4 group hover:shadow-md transition-shadow press">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-mora-primary shrink-0">
                  {p.image && <img src={p.image} alt={p.title} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.pill}`}>{meta.label}</span>
                    {p.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-mora-primary/10 text-mora-primary">Featured</span>}
                  </div>
                  <h3 className="font-display font-semibold text-mora-primary truncate mt-1">{p.title}</h3>
                  <p className="text-xs text-mora-neutral truncate">{p.description}</p>
                </div>
                <div className="text-right shrink-0 mr-2">
                  {p.discount ? <p className="text-sm font-semibold text-gold">{p.discount}% off</p> : null}
                  {p.price ? <p className="text-xs text-mora-neutral">{formatIDR(p.price)}</p> : null}
                  {p.date ? <p className="text-xs text-mora-neutral">{moment(p.date).format("MMM D")}</p> : null}
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {can(role, "promotions", "edit") && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(p); }} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>}
                  {can(role, "promotions", "delete") && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(p); }} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </Link>
            );
          })}
          </div>
          {sorted.length > visible && (
            <div className="flex justify-center pt-1">
              <button onClick={() => setVisible((v) => v + 12)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-mora-primary border border-mora-primary/15 hover:bg-mora-primary/5 press">Show more</button>
            </div>
          )}
          {items.length === 0 && (
            <EmptyState
              icon={Megaphone}
              title="No entries yet"
              hint="Publish offers, events and news to show in the app's What's New."
              action={can(role, "promotions", "create") ? (
                <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New entry
                </button>
              ) : null}
            />
          )}
          {items.length > 0 && filtered.length === 0 && (
            <EmptyState icon={Search} title="No matches" hint="No entries match your search or filters." />
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
