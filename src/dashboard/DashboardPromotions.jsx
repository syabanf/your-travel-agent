import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { Plus, Pencil, Trash2, X, Loader2, Save, Megaphone, CalendarDays, Newspaper, Search, Star } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { useRole } from "./RoleContext";
import { can } from "./rbac";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";
import ViewToggle from "@/dashboard/ViewToggle";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";
import SearchableSelect from "@/dashboard/SearchableSelect";

const EMPTY = { type: "promo", title: "", description: "", image: "", discount: "", price: "", valid_until: "", date: "", location: "", cta: "Learn more", featured: false, terms: "", promo_code: "", max_redemptions: "", audience: "all" };
const TYPE_META = {
  promo: { label: "Promotion", icon: Megaphone, pill: "bg-mora-gold/10 text-gold" },
  event: { label: "Event", icon: CalendarDays, pill: "bg-blue-500/15 text-blue-600" },
  news: { label: "News", icon: Newspaper, pill: "bg-emerald-500/15 text-emerald-600" },
};

export default function DashboardPromotions() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [view, setView] = useState("table");
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [range, setRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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
        terms: editing.terms, promo_code: editing.promo_code,
        max_redemptions: editing.max_redemptions !== "" && editing.max_redemptions != null ? Number(editing.max_redemptions) : undefined,
        audience: editing.audience || "all",
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

  // Date range scopes the whole view (KPIs, charts & table); search/selects refine the table.
  const scoped = (items || []).filter((p) => inRange(p.created_date, range));

  const filtered = scoped.filter((p) => {
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

  const pg = usePagination(sorted, 12, `${query}|${typeF}|${range}|${sortBy}`);

  // Insight aggregations (date-scoped)
  const typeCount = { promo: 0, event: 0, news: 0 };
  scoped.forEach((p) => { const t = p.type || "promo"; typeCount[t] = (typeCount[t] || 0) + 1; });
  const byType = [
    { name: "Promotion", value: typeCount.promo, color: "#AD1F23" },
    { name: "Event", value: typeCount.event, color: "#C99A3F" },
    { name: "News", value: typeCount.news, color: "#05308C" },
  ];
  const featuredMix = [
    { name: "Featured", value: scoped.filter((p) => p.featured).length, color: "#AD1F23" },
    { name: "Standard", value: scoped.filter((p) => !p.featured).length, color: "#94A3B8" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="promotions" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Promotions & Events</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Publish the offers, events and news shown in the app's "What's New".</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="promotions" data={items} />
            {can(role, "promotions", "create") && (
              <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> New entry
              </button>
            )}
          </div>
        )}
      </header>

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCard title="By type" subtitle="Promotions, events & news."><MixDonut data={byType} /></ChartCard>
          <ChartCard title="Featured vs standard" subtitle="Hero-banner share."><MixDonut data={featuredMix} /></ChartCard>
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit entry" : "New entry"}</h2>
            <button onClick={() => setEditing(null)} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <Fld label="Type">
              <SearchableSelect
                value={editing.type}
                onChange={(v) => upd("type", v)}
                options={[
                  { value: "promo", label: "Promotion" },
                  { value: "event", label: "Event" },
                  { value: "news", label: "News" },
                ]}
                ariaLabel="Type"
              />
            </Fld>
            <Fld label="Title"><input value={editing.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Flash Sale: Bali Villas" /></Fld>
            <Fld label="Description"><textarea value={editing.description} onChange={(e) => upd("description", e.target.value)} className="dash-input !h-auto py-2" rows={2} /></Fld>
            <Fld label="Image URL"><input value={editing.image} onChange={(e) => upd("image", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Promo code"><input value={editing.promo_code ?? ""} onChange={(e) => upd("promo_code", e.target.value)} className="dash-input" placeholder="SUMMER25" /></Fld>
              <Fld label="Max redemptions"><input type="number" value={editing.max_redemptions ?? ""} onChange={(e) => upd("max_redemptions", e.target.value)} className="dash-input" placeholder="500" /></Fld>
            </div>
            <Fld label="Audience">
              <SearchableSelect
                value={editing.audience ?? "all"}
                onChange={(v) => upd("audience", v)}
                options={[
                  { value: "all", label: "All users" },
                  { value: "platinum", label: "Platinum" },
                  { value: "gold", label: "Gold" },
                  { value: "new", label: "New users" },
                  { value: "inactive", label: "Inactive" },
                ]}
                ariaLabel="Audience"
              />
            </Fld>
            <Fld label="Terms & conditions"><textarea value={editing.terms ?? ""} onChange={(e) => upd("terms", e.target.value)} className="dash-input !h-auto py-2" rows={3} placeholder="Terms that apply to this offer…" /></Fld>
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mora-neutral pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search entries…" />
            </div>
            <SearchableSelect
              value={typeF}
              onChange={setTypeF}
              options={[
                { value: "all", label: "All types" },
                { value: "promo", label: "Promotion" },
                { value: "event", label: "Event" },
                { value: "news", label: "News" },
              ]}
              ariaLabel="Filter by type"
              className="max-w-[160px]"
            />
            <DateRangeSelect value={range} onChange={setRange} />
            <SearchableSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest" },
                { value: "title", label: "Title A–Z" },
                { value: "type", label: "Type" },
              ]}
              ariaLabel="Sort by"
              className="max-w-[160px]"
            />
            {(query || typeF !== "all" || range !== "all" || sortBy !== "newest") && (
              <button onClick={() => { setQuery(""); setTypeF("all"); setRange("all"); setSortBy("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <ViewToggle value={view} onChange={setView} />
          </div>
          {view === "table" ? (
            <DataTable
              columns={[
                { key: "title", label: "Title", className: "font-medium text-mora-primary", render: (p) => (
                  <span className="block min-w-0"><span className="block truncate">{p.title}</span>{p.description ? <span className="block text-[11px] text-mora-neutral/60 truncate">{p.description}</span> : null}</span>
                ) },
                { key: "type", label: "Type", render: (p) => { const meta = TYPE_META[p.type] || TYPE_META.promo; return <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.pill}`}>{p.type || "promo"}</span>; } },
                { key: "value", label: "Discount / Price", align: "right", className: "text-right font-semibold text-gold", render: (p) => p.discount ? `${p.discount}% off` : (p.price ? formatIDR(p.price) : "—") },
                { key: "date", label: "Date", render: (p) => p.valid_until ? `Until ${moment(p.valid_until).format("MMM D")}` : (p.date ? moment(p.date).format("MMM D, YYYY") : "—") },
                { key: "featured", label: "Featured", render: (p) => p.featured ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mora-gold/15 text-gold"><Star className="w-3 h-3 fill-gold" /> Featured</span> : <span className="text-mora-neutral/40">—</span> },
              ]}
              rows={pg.pageItems}
              onRowClick={(p) => navigate(`/dashboard/promotions/${p.id}`)}
              empty="No entries match your filters."
            />
          ) : (
          <div className="space-y-3 stagger">
          {pg.pageItems.map((p) => {
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
                  {can(role, "promotions", "edit") && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditing(p); }} aria-label="Edit" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>}
                  {can(role, "promotions", "delete") && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(p); }} aria-label="Delete" className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </Link>
            );
          })}
          </div>
          )}
          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="promotions" />
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
