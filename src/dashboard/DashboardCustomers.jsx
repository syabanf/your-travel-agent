import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OLMap from "@/components/OLMap";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { downloadCSV } from "@/lib/csv";
import { Plus, Pencil, Trash2, MapPin, Search, X, Loader2, Save, Users, UserCheck, Wallet, Mail, Download } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { SkeletonStat, SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";
import ViewToggle from "@/dashboard/ViewToggle";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";

const EMPTY = {
  name: "", email: "", phone: "", city: "", country: "",
  lat: null, lng: null, tier: "bronze", status: "active",
  lifetime_spend: "", joined_date: moment().format("YYYY-MM-DD"), notes: "",
};

const TIERS = ["bronze", "silver", "gold", "platinum"];
const TIER_BADGE = {
  bronze: "bg-amber-100 text-amber-700",
  silver: "bg-slate-200 text-slate-700",
  gold: "bg-mora-gold/15 text-gold",
  platinum: "bg-indigo-100 text-indigo-700",
};

export default function DashboardCustomers() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState("table");
  const [countryF, setCountryF] = useState("all");
  const [range, setRange] = useState("all");
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [listQuery, setListQuery] = useState(searchParams.get("q") || "");
  const [tierF, setTierF] = useState(searchParams.get("tier") || "all");
  const [statusF, setStatusF] = useState(searchParams.get("status") || "all");
  const [sort, setSort] = useState("newest");
  const searchRef = useRef(null);

  const load = async () => setItems(await base44.entities.Customer.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (c) => setEditing({
    ...EMPTY, ...c,
    lifetime_spend: c.lifetime_spend ?? "",
    joined_date: c.joined_date || moment().format("YYYY-MM-DD"),
  });
  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const geocode = async () => {
    if (!query.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const d = await r.json();
      if (d.length) {
        const lat = parseFloat(d[0].lat), lng = parseFloat(d[0].lon);
        const city = d[0].display_name.split(",")[0];
        const country = d[0].display_name.split(",").slice(-1)[0].trim();
        setEditing((p) => ({ ...p, lat, lng, city: p.city || city, country: p.country || country }));
      } else toast.error("Location not found");
    } catch { toast.error("Search failed"); }
  };

  const save = async () => {
    if (!editing.name || !editing.email) { toast.error("Name and email are required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: editing.name, email: editing.email, phone: editing.phone,
        city: editing.city, country: editing.country,
        lat: editing.lat, lng: editing.lng,
        tier: editing.tier || "bronze", status: editing.status || "active",
        lifetime_spend: editing.lifetime_spend ? Number(editing.lifetime_spend) : 0,
        joined_date: editing.joined_date || moment().format("YYYY-MM-DD"),
        notes: editing.notes || "",
      };
      if (editing.id) await base44.entities.Customer.update(editing.id, payload);
      else await base44.entities.Customer.create(payload);
      toast.success(editing.id ? "Customer updated" : "Customer added");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save customer"); }
    finally { setSaving(false); }
  };

  const remove = async (c) => {
    await base44.entities.Customer.delete(c.id);
    toast.success("Customer removed");
    load();
  };

  // Date range scopes the whole view (KPIs, charts & table); search/selects refine the table.
  const scoped = (items || []).filter((c) => inRange(c.created_date, range));
  const countryOptions = [...new Set((items || []).map((c) => c.country).filter(Boolean))].sort();

  const filtered = scoped.filter((c) => {
    const q = listQuery.trim().toLowerCase();
    const matchesQ = !q || [c.name, c.email, c.city, c.country].some((v) => (v || "").toLowerCase().includes(q));
    const matchesTier = tierF === "all" || (c.tier || "bronze") === tierF;
    const matchesStatus = statusF === "all" || (c.status || "active") === statusF;
    const matchesCountry = countryF === "all" || c.country === countryF;
    return matchesQ && matchesTier && matchesStatus && matchesCountry;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return (a.name || "").localeCompare(b.name || "");
    if (sort === "spend") return (Number(b.lifetime_spend) || 0) - (Number(a.lifetime_spend) || 0);
    return moment(b.joined_date || 0).valueOf() - moment(a.joined_date || 0).valueOf();
  });
  const pg = usePagination(sorted, 10, `${listQuery}|${tierF}|${statusF}|${countryF}|${range}|${sort}`);

  const exportCSV = () => downloadCSV(
    "mora-customers",
    ["Name", "Email", "Phone", "City", "Country", "Tier", "Status", "Lifetime spend"],
    sorted.map((c) => [
      c.name, c.email, c.phone, c.city, c.country,
      c.tier || "bronze", c.status || "active", Number(c.lifetime_spend) || 0,
    ]),
  );

  const total = scoped.length;
  const activeCount = scoped.filter((c) => c.status === "active").length;
  const ltv = scoped.reduce((s, c) => s + (Number(c.lifetime_spend) || 0), 0);

  // Insight aggregations (date-scoped)
  const TIER_COLOR = { bronze: "#C99A3F", silver: "#94A3B8", gold: "#AD1F23", platinum: "#6366F1" };
  const tierCount = {}, tierLtv = {};
  scoped.forEach((c) => { const t = c.tier || "bronze"; tierCount[t] = (tierCount[t] || 0) + 1; tierLtv[t] = (tierLtv[t] || 0) + (Number(c.lifetime_spend) || 0); });
  const cap1 = (s) => s[0].toUpperCase() + s.slice(1);
  const byTier = TIERS.map((t) => ({ name: cap1(t), value: tierCount[t] || 0, color: TIER_COLOR[t] }));
  const ltvByTier = TIERS.map((t) => ({ name: cap1(t), value: tierLtv[t] || 0, color: TIER_COLOR[t] })).filter((d) => d.value);
  const statusMix = [
    { name: "Active", value: scoped.filter((c) => c.status === "active").length, color: "#10B981" },
    { name: "Inactive", value: scoped.filter((c) => c.status !== "active").length, color: "#94A3B8" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Customers</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage travelers, their tiers, spend & home locations.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="customers" data={items} />
            <button onClick={exportCSV} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {can(role, "customers", "create") && (
              <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add customer
              </button>
            )}
          </div>
        )}
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 stagger">
        {items == null ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (<>
          <Kpi icon={Users} label="Total customers" value={total} />
          <Kpi icon={UserCheck} label="Active customers" value={activeCount} />
          <Kpi icon={Wallet} label="Total lifetime value" value={formatIDR(ltv)} />
        </>)}
      </div>

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ChartCard title="Customers by tier" subtitle="Loyalty mix."><MixDonut data={byTier} /></ChartCard>
          <ChartCard title="Lifetime value by tier" subtitle="Where value concentrates."><CategoryBars data={ltvByTier} /></ChartCard>
          <ChartCard title="Active vs inactive" subtitle="Engagement."><MixDonut data={statusMix} /></ChartCard>
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit customer" : "New customer"}</h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-3">
              <Row2>
                <FieldD label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Jane Traveler" /></FieldD>
                <FieldD label="Email"><input type="email" value={editing.email} onChange={(e) => upd("email", e.target.value)} className="dash-input" placeholder="jane@example.com" /></FieldD>
              </Row2>
              <Row2>
                <FieldD label="Phone"><input value={editing.phone} onChange={(e) => upd("phone", e.target.value)} className="dash-input" placeholder="+62…" /></FieldD>
                <FieldD label="City"><input value={editing.city} onChange={(e) => upd("city", e.target.value)} className="dash-input" placeholder="Jakarta" /></FieldD>
              </Row2>
              <Row2>
                <FieldD label="Country"><input value={editing.country} onChange={(e) => upd("country", e.target.value)} className="dash-input" placeholder="Indonesia" /></FieldD>
                <FieldD label="Tier">
                  <select value={editing.tier} onChange={(e) => upd("tier", e.target.value)} className="dash-input">
                    {TIERS.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </FieldD>
              </Row2>
              <Row2>
                <FieldD label="Status">
                  <select value={editing.status} onChange={(e) => upd("status", e.target.value)} className="dash-input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FieldD>
                <FieldD label="Lifetime spend (IDR)"><input type="number" value={editing.lifetime_spend} onChange={(e) => upd("lifetime_spend", e.target.value)} className="dash-input" placeholder="25000000" /></FieldD>
              </Row2>
              <FieldD label="Joined date"><input type="date" value={editing.joined_date} onChange={(e) => upd("joined_date", e.target.value)} className="dash-input" /></FieldD>
              <FieldD label="Notes"><textarea value={editing.notes} onChange={(e) => upd("notes", e.target.value)} className="dash-input" rows={3} placeholder="Preferences, VIP notes…" /></FieldD>
              <div className="flex items-center gap-2 text-sm text-mora-neutral pt-1">
                <MapPin className="w-4 h-4 text-gold" />
                {editing.lat != null ? <span>{editing.lat.toFixed(4)}, {editing.lng.toFixed(4)}</span> : <span className="text-mora-neutral/60">Click the map or search to set location</span>}
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
              <div className="rounded-xl overflow-hidden border border-mora-primary/10" style={{ height: 300 }}>
                <OLMap
                  center={editing.lat != null ? [editing.lng, editing.lat] : [110, -2]}
                  zoom={editing.lat != null ? 6 : 4}
                  markers={editing.lat != null ? [{ id: "sel", lng: editing.lng, lat: editing.lat }] : []}
                  onClick={(lng, lat) => setEditing((p) => ({ ...p, lat, lng }))}
                />
              </div>
            </div>
          </div>
        </div>
      ) : items == null ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-5"><SkeletonRows rows={6} /></div>
      ) : (
        <div className="space-y-3">
          <ReadOnlyBanner resource="customers" />
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
              <input
                className="dash-input pl-9"
                placeholder="Search customers…"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
              />
            </div>
            <select value={tierF} onChange={(e) => setTierF(e.target.value)} className="dash-input max-w-[150px]">
              <option value="all">All tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="dash-input max-w-[150px]">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {countryOptions.length > 1 && (
              <select value={countryF} onChange={(e) => setCountryF(e.target.value)} className="dash-input max-w-[170px]">
                <option value="all">All countries</option>
                {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <DateRangeSelect value={range} onChange={setRange} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="dash-input max-w-[160px]">
              <option value="newest">Newest</option>
              <option value="name">Name A–Z</option>
              <option value="spend">Lifetime spend</option>
            </select>
            {(listQuery || tierF !== "all" || statusF !== "all" || countryF !== "all" || range !== "all" || sort !== "newest") && (
              <button onClick={() => { setListQuery(""); setTierF("all"); setStatusF("all"); setCountryF("all"); setRange("all"); setSort("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <ViewToggle value={view} onChange={setView} />
          </div>
          {view === "table" ? (
            <DataTable
              columns={[
                { key: "name", label: "Customer", className: "font-medium text-mora-primary", render: (c) => (
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-mora-gold/10 text-gold flex items-center justify-center text-xs font-display font-semibold uppercase shrink-0">{(c.name || "?").trim().charAt(0)}</span>
                    <span className="min-w-0"><span className="block truncate">{c.name}</span><span className="block text-[11px] text-mora-neutral/60 truncate">{c.email}</span></span>
                  </span>
                ) },
                { key: "tier", label: "Tier", render: (c) => <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${TIER_BADGE[c.tier] || TIER_BADGE.bronze}`}>{c.tier || "bronze"}</span> },
                { key: "status", label: "Status", render: (c) => <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.status || "active"}</span> },
                { key: "location", label: "Location", render: (c) => [c.city, c.country].filter(Boolean).join(", ") || "—" },
                { key: "spend", label: "Lifetime", align: "right", className: "text-right font-semibold text-gold", render: (c) => formatIDR(Number(c.lifetime_spend) || 0) },
              ]}
              rows={pg.pageItems}
              onRowClick={(c) => navigate(`/dashboard/customers/${c.id}`)}
              empty="No customers match your filters."
            />
          ) : (
          <div className="space-y-3 stagger">
          {pg.pageItems.map((c) => (
            <Link key={c.id} to={`/dashboard/customers/${c.id}`} className="bg-white rounded-2xl border border-mora-primary/10 p-4 flex items-center gap-3 sm:gap-4 group hover:shadow-md transition-shadow press">
              <div className="w-11 h-11 rounded-full bg-mora-gold/10 text-gold flex items-center justify-center font-display font-semibold shrink-0 uppercase">
                {(c.name || "?").trim().charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-mora-primary truncate">{c.name}</h3>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${TIER_BADGE[c.tier] || TIER_BADGE.bronze}`}>{c.tier || "bronze"}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.status || "active"}</span>
                </div>
                <p className="text-xs text-mora-neutral mt-0.5 flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 shrink-0" /> {c.email}
                </p>
                <p className="text-xs text-mora-neutral/70 mt-0.5">
                  {[c.city, c.country].filter(Boolean).join(" · ") || "No location"}
                  {c.joined_date ? ` · joined ${moment(c.joined_date).format("MMM YYYY")}` : ""}
                </p>
                <p className="text-sm font-semibold text-gold mt-1 sm:hidden">
                  {formatIDR(Number(c.lifetime_spend) || 0)} <span className="text-[10px] text-mora-neutral/60 uppercase tracking-wider font-normal">lifetime</span>
                </p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-sm font-semibold text-gold">{formatIDR(Number(c.lifetime_spend) || 0)}</div>
                <div className="text-[10px] text-mora-neutral/60 uppercase tracking-wider">lifetime</div>
              </div>
              {(can(role, "customers", "edit") || can(role, "customers", "delete")) && (
                <div className="flex gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {can(role, "customers", "edit") && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(c); }} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                  )}
                  {can(role, "customers", "delete") && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(c); }} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              )}
            </Link>
          ))}
          </div>
          )}
          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="customers" />
          {items.length === 0 && (
            <EmptyState
              icon={Users}
              title="No customers yet"
              hint="Add your first traveler to track tiers, spend and home locations."
              action={can(role, "customers", "create") && (
                <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press"><Plus className="w-4 h-4" /> Add customer</button>
              )}
            />
          )}
          {items.length > 0 && sorted.length === 0 && <p className="text-mora-neutral/60 text-center py-10">No customers match your filters.</p>}
        </div>
      )}
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 flex items-center gap-4 min-w-0">
    <div className="w-11 h-11 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
    <div className="min-w-0">
      <div className="text-xs text-mora-neutral uppercase tracking-wider">{label}</div>
      <div className="stat-value text-xl font-display font-bold text-mora-primary">{value}</div>
    </div>
  </div>
);

const Row2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
const FieldD = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
