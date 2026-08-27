import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { downloadCSV } from "@/lib/csv";
import { openWhatsApp } from "@/lib/whatsapp";
import { Plus, Pencil, Trash2, X, Loader2, Save, Building2, CheckCircle2, Percent, Star, Globe, MessageCircle, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { SkeletonStat, SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { confirmDialog } from "@/components/ConfirmDialog";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";
import ViewToggle from "@/dashboard/ViewToggle";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";
import SearchableSelect from "@/dashboard/SearchableSelect";

const EMPTY = {
  name: "", type: "flight", country: "", contact_person: "", contact_email: "", contact_phone: "",
  website: "", payment_terms: "", address: "",
  commission_rate: "", rating: "", status: "active", notes: "",
};

const TYPES = ["flight", "hotel", "activity", "transport", "dmc"];
const TYPE_BADGE = {
  flight: "bg-blue-100 text-blue-700",
  hotel: "bg-emerald-100 text-emerald-700",
  activity: "bg-mora-gold/10 text-gold",
  transport: "bg-indigo-100 text-indigo-700",
  dmc: "bg-slate-200 text-slate-700",
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function DashboardSuppliers() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [view, setView] = useState("table");
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = async () => setItems(await base44.entities.Supplier.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (s) => setEditing({
    ...EMPTY, ...s,
    contact_person: s.contact_person ?? "",
    website: s.website ?? "",
    payment_terms: s.payment_terms ?? "",
    address: s.address ?? "",
    commission_rate: s.commission_rate ?? "",
    rating: s.rating ?? "",
  });
  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!editing.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: editing.name, type: editing.type || "flight",
        country: editing.country, contact_person: editing.contact_person || "",
        contact_email: editing.contact_email,
        contact_phone: editing.contact_phone,
        website: editing.website || "",
        payment_terms: editing.payment_terms || "",
        address: editing.address || "",
        commission_rate: editing.commission_rate !== "" ? Number(editing.commission_rate) : 0,
        rating: editing.rating !== "" ? Number(editing.rating) : 0,
        status: editing.status || "active",
        notes: editing.notes || "",
      };
      if (editing.id) await base44.entities.Supplier.update(editing.id, payload);
      else await base44.entities.Supplier.create(payload);
      toast.success(editing.id ? "Supplier updated" : "Supplier added");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save supplier"); }
    finally { setSaving(false); }
  };

  const remove = async (s) => {
    const ok = await confirmDialog({
      title: "Delete this supplier?",
      body: `${s.name || "This supplier"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await base44.entities.Supplier.delete(s.id);
    toast.success("Supplier removed");
    load();
  };

  // Date range scopes the whole view (KPIs, charts & table); search/selects refine the table.
  const scoped = (items || []).filter((s) => inRange(s.created_date, range));

  const total = scoped.length;
  const activeCount = scoped.filter((s) => s.status === "active").length;
  const avgCommission = total
    ? Math.round((scoped.reduce((sum, s) => sum + (Number(s.commission_rate) || 0), 0) / total) * 10) / 10
    : 0;

  // Insight aggregations (date-scoped)
  const byType = {};
  scoped.forEach((s) => { const k = s.type || "dmc"; if (!byType[k]) byType[k] = { name: cap(k), value: 0 }; byType[k].value += 1; });
  const dataType = Object.values(byType).sort((a, b) => b.value - a.value);
  const statusMix = [
    { name: "Active", value: scoped.filter((s) => (s.status || "active") === "active").length, color: "#10B981" },
    { name: "Inactive", value: scoped.filter((s) => (s.status || "active") !== "active").length, color: "#94A3B8" },
  ];

  const q = query.trim().toLowerCase();
  const filtered = scoped.filter((s) => {
    const matchesQ = !q || [s.name, s.country].some((v) => (v || "").toLowerCase().includes(q));
    const matchesType = typeF === "all" || s.type === typeF;
    const matchesStatus = statusF === "all" || (s.status || "active") === statusF;
    return matchesQ && matchesType && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return (a.name || "").localeCompare(b.name || "");
    if (sort === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (sort === "commission") return (Number(b.commission_rate) || 0) - (Number(a.commission_rate) || 0);
    return String(b.created_date || "").localeCompare(String(a.created_date || ""));
  });
  const pg = usePagination(sorted, 12, `${query}|${typeF}|${statusF}|${range}|${sort}`);

  const exportCSV = () => downloadCSV(
    "mora-suppliers",
    ["Name", "Type", "Country", "Commission %", "Rating", "Status"],
    sorted.map((s) => [
      s.name, s.type || "dmc", s.country,
      Number(s.commission_rate) || 0, Number(s.rating) || 0, s.status || "active",
    ]),
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Suppliers</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage partner airlines, hotels, DMCs & their commissions.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="suppliers" data={items} />
            <button onClick={exportCSV} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {can(role, "suppliers", "create") && (
              <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add supplier
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
          <Kpi icon={Building2} label="Total suppliers" value={total} />
          <Kpi icon={CheckCircle2} label="Active suppliers" value={activeCount} />
          <Kpi icon={Percent} label="Avg commission" value={`${avgCommission}%`} />
        </>)}
      </div>

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ChartCard title="Suppliers by type" subtitle="Partner mix."><CategoryBars data={dataType} money={false} /></ChartCard>
          <ChartCard title="Suppliers by status" subtitle="Active vs inactive."><MixDonut data={statusMix} /></ChartCard>
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit supplier" : "New supplier"}</h2>
            <button onClick={() => setEditing(null)} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>

          <div className="space-y-3 max-w-2xl">
            <Row2>
              <FieldD label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Garuda Indonesia" /></FieldD>
              <FieldD label="Type">
                <SearchableSelect
                  value={editing.type}
                  onChange={(val) => upd("type", val)}
                  options={TYPES.map((t) => ({ value: t, label: cap(t) }))}
                  ariaLabel="Type"
                />
              </FieldD>
            </Row2>
            <Row2>
              <FieldD label="Country"><input value={editing.country} onChange={(e) => upd("country", e.target.value)} className="dash-input" placeholder="Indonesia" /></FieldD>
              <FieldD label="Contact person"><input value={editing.contact_person} onChange={(e) => upd("contact_person", e.target.value)} className="dash-input" placeholder="Account manager name" /></FieldD>
            </Row2>
            <Row2>
              <FieldD label="Contact email"><input type="email" value={editing.contact_email} onChange={(e) => upd("contact_email", e.target.value)} className="dash-input" placeholder="partners@example.com" /></FieldD>
              <FieldD label="Contact phone"><input value={editing.contact_phone} onChange={(e) => upd("contact_phone", e.target.value)} className="dash-input" placeholder="+62…" /></FieldD>
            </Row2>
            <Row2>
              <FieldD label="Website"><input value={editing.website} onChange={(e) => upd("website", e.target.value)} className="dash-input" placeholder="https://example.com" /></FieldD>
              <FieldD label="Payment terms"><input value={editing.payment_terms} onChange={(e) => upd("payment_terms", e.target.value)} className="dash-input" placeholder="Net 30" /></FieldD>
            </Row2>
            <FieldD label="Address"><input value={editing.address} onChange={(e) => upd("address", e.target.value)} className="dash-input" placeholder="Street, city, postal code" /></FieldD>
            <Row2>
              <FieldD label="Commission %"><input type="number" value={editing.commission_rate} onChange={(e) => upd("commission_rate", e.target.value)} className="dash-input" placeholder="10" /></FieldD>
              <FieldD label="Rating"><input type="number" step="0.1" min="0" max="5" value={editing.rating} onChange={(e) => upd("rating", e.target.value)} className="dash-input" placeholder="4.5" /></FieldD>
            </Row2>
            <Row2>
              <FieldD label="Status">
                <SearchableSelect
                  value={editing.status}
                  onChange={(val) => upd("status", val)}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  ariaLabel="Status"
                />
              </FieldD>
            </Row2>
            <FieldD label="Notes"><textarea value={editing.notes} onChange={(e) => upd("notes", e.target.value)} className="dash-input" rows={3} placeholder="Contract terms, account manager…" /></FieldD>
            <div className="flex gap-2 pt-3">
              <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
            </div>
          </div>
        </div>
      ) : items == null ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-5"><SkeletonRows rows={6} /></div>
      ) : (
        <>
        <ReadOnlyBanner resource="suppliers" />
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search suppliers…" />
          </div>
          <SearchableSelect
            value={typeF}
            onChange={setTypeF}
            options={[
              { value: "all", label: "All types" },
              { value: "flight", label: "Flight" },
              { value: "hotel", label: "Hotel" },
              { value: "activity", label: "Activity" },
              { value: "transport", label: "Transport" },
              { value: "dmc", label: "DMC" },
            ]}
            placeholder="All types"
            ariaLabel="Type filter"
            className="max-w-[150px]"
          />
          <SearchableSelect
            value={statusF}
            onChange={setStatusF}
            options={[
              { value: "all", label: "All status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="All status"
            ariaLabel="Status filter"
            className="max-w-[150px]"
          />
          <DateRangeSelect value={range} onChange={setRange} />
          <SearchableSelect
            value={sort}
            onChange={setSort}
            options={[
              { value: "newest", label: "Newest" },
              { value: "name", label: "Name A–Z" },
              { value: "rating", label: "Rating" },
              { value: "commission", label: "Commission" },
            ]}
            placeholder="Newest"
            ariaLabel="Sort"
            className="max-w-[160px]"
          />
          {(query || typeF !== "all" || statusF !== "all" || range !== "all" || sort !== "newest") && (
            <button onClick={() => { setQuery(""); setTypeF("all"); setStatusF("all"); setRange("all"); setSort("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <ViewToggle value={view} onChange={setView} />
        </div>
        {view === "table" ? (
          <DataTable
            columns={[
              { key: "name", label: "Supplier", className: "font-medium text-mora-primary", render: (s) => (
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-mora-gold/10 text-gold flex items-center justify-center text-xs font-display font-semibold uppercase shrink-0">{(s.name || "?").trim().charAt(0)}</span>
                  <span className="min-w-0"><span className="block truncate">{s.name}</span><span className="block text-[11px] text-mora-neutral/60 truncate">{s.country || "—"}</span></span>
                </span>
              ) },
              { key: "type", label: "Type", render: (s) => <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${TYPE_BADGE[s.type] || TYPE_BADGE.dmc}`}>{s.type || "dmc"}</span> },
              { key: "status", label: "Status", render: (s) => <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.status || "active"}</span> },
              { key: "contact", label: "Contact", render: (s) => s.contact_email || s.contact_phone || "—" },
              { key: "commission", label: "Commission", align: "right", className: "text-right font-semibold text-gold", render: (s) => `${Number(s.commission_rate || 0)}%` },
            ]}
            rows={pg.pageItems}
            onRowClick={(s) => navigate(`/dashboard/suppliers/${s.id}`)}
            empty="No suppliers match your filters."
          />
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {pg.pageItems.map((s) => (
            <Link key={s.id} to={`/dashboard/suppliers/${s.id}`} className="block bg-white rounded-2xl border border-mora-primary/10 p-5 group hover:shadow-md transition-shadow press">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-mora-primary truncate">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${TYPE_BADGE[s.type] || TYPE_BADGE.dmc}`}>{s.type || "dmc"}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{s.status || "active"}</span>
                  </div>
                </div>
                {(can(role, "suppliers", "edit") || can(role, "suppliers", "delete")) && (
                  <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {can(role, "suppliers", "edit") && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(s); }} aria-label="Edit" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                    )}
                    {can(role, "suppliers", "delete") && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(s); }} aria-label="Delete" className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-mora-neutral mt-3 flex items-center gap-1.5 truncate">
                <Globe className="w-3 h-3 shrink-0" /> {s.country || "No country"}
              </p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-mora-primary/5">
                <span className="text-sm text-mora-primary flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-gold fill-gold" /> {Number(s.rating || 0).toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-gold">{Number(s.commission_rate || 0)}% comm.</span>
              </div>

              {s.contact_phone && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); openWhatsApp(s.contact_phone, `Hi ${s.name}, this is Icon Holiday Travel…`); }}
                  className="mt-3 w-full rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold py-2 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
              )}
            </Link>
          ))}
          {items.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Building2}
                title="No suppliers yet"
                hint="Add partner airlines, hotels and DMCs to track their commissions."
                action={can(role, "suppliers", "create") && (
                  <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press"><Plus className="w-4 h-4" /> Add supplier</button>
                )}
              />
            </div>
          )}
          {items.length > 0 && sorted.length === 0 && <p className="text-mora-neutral/60 text-center py-10 col-span-full">No suppliers match your filters.</p>}
        </div>
        )}
        <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="suppliers" />
        </>
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
