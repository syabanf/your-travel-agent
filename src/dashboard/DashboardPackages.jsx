import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { PACKAGE_CATEGORIES, categoryLabel, categoryIcon, packageDiscount } from "@/data/packageCategories";
import { Plus, Pencil, Trash2, X, Loader2, Save, Search, Package, CheckCircle2, Wallet, Users } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "./RoleContext";
import { can } from "./rbac";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { SkeletonRows, SkeletonStat } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { confirmDialog } from "@/components/ConfirmDialog";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";
import Drawer from "@/dashboard/Drawer";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";
import SearchableSelect from "@/dashboard/SearchableSelect";

// The editor keeps every array field as newline-separated text and converts on save.
const EMPTY = {
  title: "", destination: "", category: "honeymoon", summary: "", description: "",
  image: "", images: "", duration_days: "", duration_nights: "",
  price: "", price_before: "", currency: "IDR", min_dp_percent: "",
  min_pax: "", max_pax: "", slots_left: "",
  highlights: "", includes: "", excludes: "", itinerary: "", departure_dates: "",
  rating: "", reviews_count: "", status: "active", featured: false,
};

const CURRENCIES = [
  { value: "IDR", label: "IDR — Indonesian Rupiah" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

const STATUS_META = {
  active: { label: "Active", pill: "bg-emerald-500/15 text-emerald-600" },
  draft: { label: "Draft", pill: "bg-slate-500/15 text-slate-600" },
};

const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const numOr = (v, fallback = 0) => {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const blank = (v) => (v == null ? "" : v);

// "Day title :: detail" per line → [{ day, title, detail }]
const parseItinerary = (text) =>
  lines(text).map((line, i) => {
    const [head, ...rest] = line.split("::");
    return { day: i + 1, title: (head || "").trim(), detail: rest.join("::").trim() };
  });

const toForm = (p) => ({
  ...EMPTY,
  id: p.id,
  title: blank(p.title),
  destination: blank(p.destination),
  category: p.category || "honeymoon",
  summary: blank(p.summary),
  description: blank(p.description),
  image: blank(p.image),
  images: (p.images || []).join("\n"),
  duration_days: blank(p.duration_days),
  duration_nights: blank(p.duration_nights),
  price: blank(p.price),
  price_before: blank(p.price_before),
  currency: p.currency || "IDR",
  min_dp_percent: blank(p.min_dp_percent),
  min_pax: blank(p.min_pax),
  max_pax: blank(p.max_pax),
  slots_left: blank(p.slots_left),
  highlights: (p.highlights || []).join("\n"),
  includes: (p.includes || []).join("\n"),
  excludes: (p.excludes || []).join("\n"),
  itinerary: (p.itinerary || []).map((d) => `${d.title || ""} :: ${d.detail || ""}`).join("\n"),
  departure_dates: (p.departure_dates || []).join("\n"),
  rating: blank(p.rating),
  reviews_count: blank(p.reviews_count),
  status: p.status || "active",
  featured: !!p.featured,
});

export default function DashboardPackages() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [catF, setCatF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [range, setRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [searchParams, setSearchParams] = useSearchParams();
  const load = async () => setItems(await base44.entities.TourPackage.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  // Open the editor when arriving from a detail page (?edit=<id>).
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && items) {
      const it = items.find((p) => p.id === editId);
      if (it) setEditing(toForm(it));
      setSearchParams({}, { replace: true });
    }
  }, [items, searchParams, setSearchParams]);

  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const save = async () => {
    const title = (editing.title || "").trim();
    const destination = (editing.destination || "").trim();
    if (!title) { toast.error("Title is required"); return; }
    if (!destination) { toast.error("Destination is required"); return; }
    const price = numOr(editing.price, NaN);
    if (!Number.isFinite(price) || price < 0) { toast.error("Price must be a number of 0 or more"); return; }

    setSaving(true);
    try {
      const payload = {
        title,
        destination,
        category: editing.category || "honeymoon",
        summary: (editing.summary || "").trim(),
        description: (editing.description || "").trim(),
        image: (editing.image || "").trim(),
        images: lines(editing.images),
        duration_days: numOr(editing.duration_days, 0),
        duration_nights: numOr(editing.duration_nights, 0),
        price,
        price_before: editing.price_before === "" || editing.price_before == null ? undefined : numOr(editing.price_before, 0),
        currency: editing.currency || "IDR",
        // Blank means "use the platform default" rather than 0% down.
        min_dp_percent: editing.min_dp_percent === "" || editing.min_dp_percent == null ? undefined : numOr(editing.min_dp_percent, DEFAULT_MIN_DP_PERCENT),
        min_pax: numOr(editing.min_pax, 1),
        max_pax: numOr(editing.max_pax, 0),
        slots_left: numOr(editing.slots_left, 0),
        highlights: lines(editing.highlights),
        includes: lines(editing.includes),
        excludes: lines(editing.excludes),
        itinerary: parseItinerary(editing.itinerary),
        departure_dates: lines(editing.departure_dates),
        rating: numOr(editing.rating, 0),
        reviews_count: numOr(editing.reviews_count, 0),
        status: editing.status || "active",
        featured: !!editing.featured,
      };
      if (editing.id) await base44.entities.TourPackage.update(editing.id, payload);
      else await base44.entities.TourPackage.create(payload);
      toast.success(editing.id ? "Saved" : "Created");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save"); }
    finally { setSaving(false); }
  };

  const remove = async (p) => {
    const ok = await confirmDialog({
      title: "Delete this package?",
      body: `${p.title || "This package"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await base44.entities.TourPackage.delete(p.id);
      toast.success("Removed");
      load();
    } catch { toast.error("Couldn't delete package"); }
  };

  // Date range scopes the whole view (KPIs, charts & table); search/selects refine the table.
  const scoped = (items || []).filter((p) => inRange(p.created_date, range));

  const filtered = scoped.filter((p) => {
    const q = query.trim().toLowerCase();
    const mq = !q || [p.title, p.destination].some((v) => (v || "").toLowerCase().includes(q));
    const mc = catF === "all" || p.category === catF;
    const ms = statusF === "all" || (p.status || "active") === statusF;
    return mq && mc && ms;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
    if (sortBy === "price_low") return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === "price_high") return (Number(b.price) || 0) - (Number(a.price) || 0);
    if (sortBy === "seats") return (Number(b.slots_left) || 0) - (Number(a.slots_left) || 0);
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });

  const pg = usePagination(sorted, 12, `${query}|${catF}|${statusF}|${range}|${sortBy}`);

  // KPIs & insight aggregations (date-scoped)
  const total = scoped.length;
  const activeCount = scoped.filter((p) => (p.status || "active") === "active").length;
  const avgPrice = total ? Math.round(scoped.reduce((s, p) => s + (Number(p.price) || 0), 0) / total) : 0;
  const seatsLeft = scoped.reduce((s, p) => s + (Number(p.slots_left) || 0), 0);

  const catCount = {};
  const catSum = {};
  scoped.forEach((p) => {
    const c = p.category || "other";
    catCount[c] = (catCount[c] || 0) + 1;
    catSum[c] = (catSum[c] || 0) + (Number(p.price) || 0);
  });
  const catKeys = Object.keys(catCount);
  const byCategory = catKeys
    .map((c) => ({ name: categoryLabel(c), value: catCount[c] }))
    .sort((a, b) => b.value - a.value);
  const avgByCategory = catKeys
    .map((c) => ({ name: categoryLabel(c), value: Math.round(catSum[c] / catCount[c]) }))
    .sort((a, b) => b.value - a.value);

  const filtersDirty = query || catF !== "all" || statusF !== "all" || range !== "all" || sortBy !== "newest";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="promotions" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Catalog</p>
          <h1 className="text-2xl font-display font-bold text-ich-primary">Holiday Packages</h1>
          <p className="text-sm text-ich-neutral mt-0.5">Ready-made trips travellers can buy in the app. Drafts stay hidden until you publish them.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <DashboardAiStub resource="promotions" data={items} />
          {can(role, "promotions", "create") && (
            <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 press">
              <Plus className="w-4 h-4" /> New package
            </button>
          )}
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 stagger">
        {items == null ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (<>
          <Kpi icon={Package} label="Total packages" value={total} />
          <Kpi icon={CheckCircle2} label="Active (published)" value={activeCount} />
          <Kpi icon={Wallet} label="Average price" value={formatIDR(avgPrice)} />
          <Kpi icon={Users} label="Seats left" value={seatsLeft.toLocaleString()} />
        </>)}
      </div>

      {items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCard title="Packages by category" subtitle="Where the catalogue is concentrated.">
            <CategoryBars data={byCategory} money={false} />
          </ChartCard>
          <ChartCard title="Average price by category" subtitle="Per person, before any discount.">
            <CategoryBars data={avgByCategory} />
          </ChartCard>
        </div>
      )}

      {items == null ? (
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-4"><SkeletonRows rows={6} /></div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ich-neutral pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search title or destination…" />
            </div>
            <SearchableSelect
              value={catF}
              onChange={setCatF}
              options={[{ value: "all", label: "All categories" }, ...PACKAGE_CATEGORIES]}
              ariaLabel="Filter by category"
              className="min-w-[170px]"
            />
            <SearchableSelect
              value={statusF}
              onChange={setStatusF}
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "draft", label: "Draft" },
              ]}
              ariaLabel="Filter by status"
              className="min-w-[150px]"
            />
            <DateRangeSelect value={range} onChange={setRange} />
            <SearchableSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest" },
                { value: "title", label: "Title A–Z" },
                { value: "price_low", label: "Price low → high" },
                { value: "price_high", label: "Price high → low" },
                { value: "seats", label: "Most seats left" },
              ]}
              ariaLabel="Sort by"
              className="min-w-[170px]"
            />
            {filtersDirty && (
              <button onClick={() => { setQuery(""); setCatF("all"); setStatusF("all"); setRange("all"); setSortBy("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-ich-primary/15 text-sm text-ich-neutral hover:bg-ich-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          <DataTable
            minWidth={880}
            columns={[
              { key: "title", label: "Package", className: "font-medium text-ich-primary", render: (p) => (
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-12 h-10 rounded-lg overflow-hidden bg-ich-primary/5 shrink-0 block">
                    {p.image && <img src={p.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />}
                  </span>
                  <span className="block min-w-0">
                    <span className="block truncate">{p.title}</span>
                    <span className="block text-[11px] text-ich-neutral/60 truncate">{p.destination || "—"}</span>
                  </span>
                </span>
              ) },
              { key: "category", label: "Category", render: (p) => {
                const Icon = categoryIcon(p.category);
                return <span className="inline-flex items-center gap-1.5 text-ich-neutral"><Icon className="w-3.5 h-3.5 text-gold shrink-0" />{categoryLabel(p.category)}</span>;
              } },
              { key: "duration", label: "Duration", render: (p) => (p.duration_days ? `${p.duration_days}D / ${p.duration_nights || 0}N` : "—") },
              { key: "price", label: "Price", align: "right", className: "text-right", render: (p) => {
                const off = packageDiscount(p);
                return (
                  <span className="inline-flex flex-col items-end">
                    <span className="font-semibold text-gold">{formatIDR(p.price)}</span>
                    {off != null && (
                      <span className="inline-flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-ich-neutral/50 line-through">{formatIDR(p.price_before)}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ich-primary/10 text-ich-primary">-{off}%</span>
                      </span>
                    )}
                  </span>
                );
              } },
              { key: "status", label: "Status", render: (p) => {
                const meta = STATUS_META[p.status] || STATUS_META.active;
                return <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</span>;
              } },
              { key: "slots_left", label: "Seats left", align: "right", className: "text-right", render: (p) => (Number(p.slots_left) || 0) },
              { key: "actions", label: "", align: "right", className: "text-right", render: (p) => (
                <span className="inline-flex gap-1.5">
                  {can(role, "promotions", "edit") && (
                    <button onClick={(e) => { e.stopPropagation(); setEditing(toForm(p)); }} aria-label={`Edit ${p.title || "package"}`} className="w-9 h-9 rounded-lg hover:bg-ich-primary/5 inline-flex items-center justify-center text-ich-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                  )}
                  {can(role, "promotions", "delete") && (
                    <button onClick={(e) => { e.stopPropagation(); remove(p); }} aria-label={`Delete ${p.title || "package"}`} className="w-9 h-9 rounded-lg hover:bg-red-50 inline-flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
                  )}
                </span>
              ) },
            ]}
            rows={pg.pageItems}
            onRowClick={(p) => navigate(`/dashboard/packages/${p.id}`)}
            empty="No packages match your filters."
          />

          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="packages" />

          {items.length === 0 && (
            <EmptyState
              icon={Package}
              title="No packages yet"
              hint="Build a ready-made holiday travellers can buy straight from the app."
              action={can(role, "promotions", "create") ? (
                <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New package
                </button>
              ) : null}
            />
          )}
          {items.length > 0 && filtered.length === 0 && (
            <EmptyState icon={Search} title="No matches" hint="No packages match your search or filters." />
          )}
        </div>
      )}

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        icon={editing?.id ? Pencil : Plus}
        width="max-w-2xl"
        title={editing?.id ? "Edit package" : "New package"}
        subtitle="Sold in the mobile app's Holiday Packages tab"
      >
        {editing && (
          <div className="space-y-3">
            <Fld label="Title"><input autoFocus value={editing.title} onChange={(e) => upd("title", e.target.value)} className="dash-input" placeholder="Bali Honeymoon Escape" /></Fld>
            <Row2>
              <Fld label="Destination"><input value={editing.destination} onChange={(e) => upd("destination", e.target.value)} className="dash-input" placeholder="Bali, Indonesia" /></Fld>
              <Fld label="Category">
                <SearchableSelect value={editing.category} onChange={(v) => upd("category", v)} options={PACKAGE_CATEGORIES} ariaLabel="Category" />
              </Fld>
            </Row2>
            <Fld label="Summary"><input value={editing.summary} onChange={(e) => upd("summary", e.target.value)} className="dash-input" placeholder="One line shown on the package card" /></Fld>
            <Fld label="Description"><textarea value={editing.description} onChange={(e) => upd("description", e.target.value)} className="dash-input !h-auto py-2" rows={3} placeholder="The full pitch travellers read on the detail page…" /></Fld>
            <Fld label="Cover image URL"><input value={editing.image} onChange={(e) => upd("image", e.target.value)} className="dash-input" placeholder="https://…" /></Fld>
            <Fld label="Gallery image URLs">
              <textarea value={editing.images} onChange={(e) => upd("images", e.target.value)} className="dash-input !h-auto py-2 font-mono text-xs" rows={3} placeholder={"https://…\nhttps://…"} />
              <Hint>One image URL per line.</Hint>
            </Fld>

            <Row2>
              <Fld label="Duration (days)"><input type="number" min="0" value={editing.duration_days} onChange={(e) => upd("duration_days", e.target.value)} className="dash-input" placeholder="6" /></Fld>
              <Fld label="Duration (nights)"><input type="number" min="0" value={editing.duration_nights} onChange={(e) => upd("duration_nights", e.target.value)} className="dash-input" placeholder="5" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Price per person"><input type="number" min="0" value={editing.price} onChange={(e) => upd("price", e.target.value)} className="dash-input" placeholder="18500000" /></Fld>
              <Fld label="Price before discount"><input type="number" min="0" value={editing.price_before} onChange={(e) => upd("price_before", e.target.value)} className="dash-input" placeholder="22000000" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Currency">
                <SearchableSelect value={editing.currency} onChange={(v) => upd("currency", v)} options={CURRENCIES} ariaLabel="Currency" />
              </Fld>
              <Fld label="Min. down payment %">
                <input type="number" min="1" max="100" value={editing.min_dp_percent} onChange={(e) => upd("min_dp_percent", e.target.value)} className="dash-input" placeholder={String(DEFAULT_MIN_DP_PERCENT)} />
                <Hint>Smallest deposit a traveller may pay at checkout. Blank uses {DEFAULT_MIN_DP_PERCENT}%.</Hint>
              </Fld>
            </Row2>
            <Row2>
              <Fld label="Min pax"><input type="number" min="0" value={editing.min_pax} onChange={(e) => upd("min_pax", e.target.value)} className="dash-input" placeholder="2" /></Fld>
              <Fld label="Max pax"><input type="number" min="0" value={editing.max_pax} onChange={(e) => upd("max_pax", e.target.value)} className="dash-input" placeholder="12" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Seats left"><input type="number" min="0" value={editing.slots_left} onChange={(e) => upd("slots_left", e.target.value)} className="dash-input" placeholder="8" /></Fld>
              <Fld label="Rating"><input type="number" min="0" max="5" step="0.1" value={editing.rating} onChange={(e) => upd("rating", e.target.value)} className="dash-input" placeholder="4.8" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Reviews count"><input type="number" min="0" value={editing.reviews_count} onChange={(e) => upd("reviews_count", e.target.value)} className="dash-input" placeholder="120" /></Fld>
              <Fld label="Status">
                <SearchableSelect
                  value={editing.status}
                  onChange={(v) => upd("status", v)}
                  options={[{ value: "active", label: "Active (published)" }, { value: "draft", label: "Draft (hidden)" }]}
                  ariaLabel="Status"
                />
              </Fld>
            </Row2>

            <Fld label="Highlights">
              <textarea value={editing.highlights} onChange={(e) => upd("highlights", e.target.value)} className="dash-input !h-auto py-2" rows={4} placeholder={"Private pool villa\nFloating breakfast"} />
              <Hint>One highlight per line.</Hint>
            </Fld>
            <Fld label="What's included">
              <textarea value={editing.includes} onChange={(e) => upd("includes", e.target.value)} className="dash-input !h-auto py-2" rows={4} placeholder={"5 nights villa accommodation\nDaily breakfast"} />
              <Hint>One item per line.</Hint>
            </Fld>
            <Fld label="What's excluded">
              <textarea value={editing.excludes} onChange={(e) => upd("excludes", e.target.value)} className="dash-input !h-auto py-2" rows={3} placeholder={"Domestic flights\nTravel insurance"} />
              <Hint>One item per line.</Hint>
            </Fld>
            <Fld label="Itinerary">
              <textarea value={editing.itinerary} onChange={(e) => upd("itinerary", e.target.value)} className="dash-input !h-auto py-2" rows={5} placeholder={"Arrival & Seminyak sunset :: Private transfer to your villa, then a beach-club sunset.\nUbud rice terraces :: Tegallalang before the crowds, then a long lunch."} />
              <Hint>One day per line, in the format <span className="font-mono text-ich-primary">Day title :: detail</span>. Days are numbered automatically from the line order.</Hint>
            </Fld>
            <Fld label="Departure dates">
              <textarea value={editing.departure_dates} onChange={(e) => upd("departure_dates", e.target.value)} className="dash-input !h-auto py-2 font-mono text-xs" rows={3} placeholder={"2026-09-14\n2026-10-02"} />
              <Hint>One date per line, YYYY-MM-DD.</Hint>
            </Fld>

            <label className="flex items-center gap-2 text-sm text-ich-neutral pt-1">
              <input type="checkbox" checked={!!editing.featured} onChange={(e) => upd("featured", e.target.checked)} className="accent-[#AD1F23] w-4 h-4" />
              Feature this package at the top of the app
            </label>

            <div className="flex gap-2 pt-3">
              <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-ich-neutral hover:bg-ich-primary/5">Cancel</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-ich-primary/10 p-5 flex items-center gap-4 min-w-0">
    <div className="w-11 h-11 rounded-xl bg-ich-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
    <div className="min-w-0">
      <div className="text-xs text-ich-neutral uppercase tracking-wider">{label}</div>
      <div className="stat-value text-xl font-display font-bold text-ich-primary truncate">{value}</div>
    </div>
  </div>
);

const Row2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;

const Fld = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-ich-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);

const Hint = ({ children }) => <p className="text-[11px] text-ich-neutral/60 mt-1">{children}</p>;
