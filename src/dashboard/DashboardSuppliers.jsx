import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { openWhatsApp } from "@/lib/whatsapp";
import { Plus, Pencil, Trash2, X, Loader2, Save, Building2, CheckCircle2, Percent, Star, Globe, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { SkeletonStat, SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";

const EMPTY = {
  name: "", type: "flight", country: "", contact_email: "", contact_phone: "",
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
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [typeF, setTypeF] = useState("all");
  const [statusF, setStatusF] = useState("all");

  const load = async () => setItems(await base44.entities.Supplier.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (s) => setEditing({
    ...EMPTY, ...s,
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
        country: editing.country, contact_email: editing.contact_email,
        contact_phone: editing.contact_phone,
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
    await base44.entities.Supplier.delete(s.id);
    toast.success("Supplier removed");
    load();
  };

  const total = items?.length || 0;
  const activeCount = items?.filter((s) => s.status === "active").length || 0;
  const avgCommission = total
    ? Math.round((items.reduce((sum, s) => sum + (Number(s.commission_rate) || 0), 0) / total) * 10) / 10
    : 0;

  const q = query.trim().toLowerCase();
  const filtered = (items || []).filter((s) => {
    const matchesQ = !q || [s.name, s.country].some((v) => (v || "").toLowerCase().includes(q));
    const matchesType = typeF === "all" || s.type === typeF;
    const matchesStatus = statusF === "all" || (s.status || "active") === statusF;
    return matchesQ && matchesType && matchesStatus;
  });

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Suppliers</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage partner airlines, hotels, DMCs & their commissions.</p>
        </div>
        {!editing && can(role, "suppliers", "create") && (
          <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add supplier
          </button>
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

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit supplier" : "New supplier"}</h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>

          <div className="space-y-3 max-w-2xl">
            <Row2>
              <FieldD label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Garuda Indonesia" /></FieldD>
              <FieldD label="Type">
                <select value={editing.type} onChange={(e) => upd("type", e.target.value)} className="dash-input">
                  {TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
                </select>
              </FieldD>
            </Row2>
            <Row2>
              <FieldD label="Country"><input value={editing.country} onChange={(e) => upd("country", e.target.value)} className="dash-input" placeholder="Indonesia" /></FieldD>
              <FieldD label="Contact email"><input type="email" value={editing.contact_email} onChange={(e) => upd("contact_email", e.target.value)} className="dash-input" placeholder="partners@example.com" /></FieldD>
            </Row2>
            <Row2>
              <FieldD label="Contact phone"><input value={editing.contact_phone} onChange={(e) => upd("contact_phone", e.target.value)} className="dash-input" placeholder="+62…" /></FieldD>
              <FieldD label="Commission %"><input type="number" value={editing.commission_rate} onChange={(e) => upd("commission_rate", e.target.value)} className="dash-input" placeholder="10" /></FieldD>
            </Row2>
            <Row2>
              <FieldD label="Rating"><input type="number" step="0.1" min="0" max="5" value={editing.rating} onChange={(e) => upd("rating", e.target.value)} className="dash-input" placeholder="4.5" /></FieldD>
              <FieldD label="Status">
                <select value={editing.status} onChange={(e) => upd("status", e.target.value)} className="dash-input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search suppliers…" />
          </div>
          <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="dash-input max-w-[150px]">
            <option value="all">All types</option>
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="activity">Activity</option>
            <option value="transport">Transport</option>
            <option value="dmc">DMC</option>
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="dash-input max-w-[150px]">
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {filtered.map((s) => (
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
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(s); }} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                    )}
                    {can(role, "suppliers", "delete") && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(s); }} className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
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
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); openWhatsApp(s.contact_phone, `Hi ${s.name}, this is MORA Travel…`); }}
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
          {items.length > 0 && filtered.length === 0 && <p className="text-mora-neutral/60 text-center py-10 col-span-full">No suppliers match your filters.</p>}
        </div>
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

const Row2 = ({ children }) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const FieldD = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
