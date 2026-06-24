import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { openWhatsApp } from "@/lib/whatsapp";
import { Plus, Pencil, Trash2, X, Loader2, Save, MessageCircle, UserPlus, Users, Flame, Wallet, Trophy, Search } from "lucide-react";
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

const SOURCES = ["website", "referral", "instagram", "whatsapp", "walk-in"];
const STATUSES = ["new", "contacted", "quoted", "won", "lost"];
const PIPELINE = ["new", "contacted", "quoted"];

const STATUS_DOT = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  quoted: "bg-indigo-500",
  won: "bg-emerald-500",
  lost: "bg-red-500",
};

const STATUS_BADGE = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  quoted: "bg-indigo-100 text-indigo-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

const EMPTY = {
  name: "", email: "", phone: "", source: "website", destination: "",
  budget: "", expected_travel_date: "", party_size: "", priority: "medium",
  status: "new", assigned_to: "", notes: "",
};

const PRIORITIES = ["low", "medium", "high"];

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function DashboardLeads() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [view, setView] = useState("table");
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceF, setSourceF] = useState("all");
  const [agentF, setAgentF] = useState("all");
  const [range, setRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const load = async () => setItems(await base44.entities.Lead.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (l) => setEditing({
    ...EMPTY, ...l,
    budget: l.budget ?? "",
    expected_travel_date: l.expected_travel_date ?? "",
    party_size: l.party_size ?? "",
    priority: l.priority || "medium",
    source: l.source || "website",
    status: l.status || "new",
  });
  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const canEdit = can(role, "leads", "edit");
  const canDelete = can(role, "leads", "delete");
  const canCreate = can(role, "leads", "create");
  const canConvert = can(role, "customers", "create");

  const save = async () => {
    if (!editing.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: editing.name, email: editing.email, phone: editing.phone,
        source: editing.source || "website", destination: editing.destination,
        budget: editing.budget ? Number(editing.budget) : 0,
        expected_travel_date: editing.expected_travel_date || "",
        party_size: editing.party_size !== "" ? Number(editing.party_size) : "",
        priority: editing.priority || "medium",
        status: editing.status || "new",
        assigned_to: editing.assigned_to || "",
        notes: editing.notes || "",
      };
      if (editing.id) await base44.entities.Lead.update(editing.id, payload);
      else await base44.entities.Lead.create(payload);
      toast.success(editing.id ? "Lead updated" : "Lead added");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save lead"); }
    finally { setSaving(false); }
  };

  const setStatus = async (id, status) => {
    if (!canEdit) return;
    try {
      await base44.entities.Lead.update(id, { status });
      toast.success("Stage updated");
      await load();
    } catch { toast.error("Couldn't update stage"); }
  };

  const remove = async (l) => {
    try {
      await base44.entities.Lead.delete(l.id);
      toast.success("Lead removed");
      await load();
    } catch { toast.error("Couldn't remove lead"); }
  };

  const convert = async (l) => {
    try {
      await base44.entities.Customer.create({
        name: l.name, email: l.email, phone: l.phone,
        city: "", country: "", tier: "bronze", status: "active",
        lifetime_spend: 0, joined_date: moment().format("YYYY-MM-DD"),
        notes: `Converted from lead. ${l.notes || ""}`.trim(),
      });
      await base44.entities.Lead.update(l.id, { status: "won" });
      toast.success("Converted to customer");
      await load();
    } catch { toast.error("Couldn't convert lead"); }
  };

  // Date range scopes the whole view (KPIs, charts & table); search/selects refine the table.
  const scoped = (items || []).filter((l) => inRange(l.created_date, range));

  const total = scoped.length;
  const open = scoped.filter((l) => l.status !== "won" && l.status !== "lost").length;
  const pipeline = scoped.filter((l) => PIPELINE.includes(l.status)).reduce((s, l) => s + (Number(l.budget) || 0), 0);
  const won = scoped.filter((l) => l.status === "won").length;

  // Insight aggregations (date-scoped)
  const STATUS_COLOR = { new: "#3B82F6", contacted: "#C99A3F", qualified: "#0EA5E9", quoted: "#0EA5E9", proposal: "#9333EA", won: "#10B981", lost: "#94A3B8" };
  const stageCount = {}, stageValue = {};
  scoped.forEach((l) => { const s = l.status || "new"; stageCount[s] = (stageCount[s] || 0) + 1; stageValue[s] = (stageValue[s] || 0) + (Number(l.budget) || 0); });
  const byStage = STATUSES.map((s) => ({ name: cap(s), value: stageCount[s] || 0, color: STATUS_COLOR[s] }));
  const valueByStage = STATUSES.map((s) => ({ name: cap(s), value: stageValue[s] || 0, color: STATUS_COLOR[s] })).filter((d) => d.value);
  const bySrc = {};
  scoped.forEach((l) => { const k = l.source || "—"; if (!bySrc[k]) bySrc[k] = { name: cap(k), value: 0 }; bySrc[k].value += 1; });
  const dataSrc = Object.values(bySrc).sort((a, b) => b.value - a.value);

  const sourceOptions = [...new Set((items || []).map((l) => l.source).filter(Boolean))].sort();
  const agentOptions = [...new Set((items || []).map((l) => l.assigned_to).filter(Boolean))].sort();

  const q = query.trim().toLowerCase();
  const filtered = scoped.filter((l) => {
    const matchesQ = !q || [l.name, l.email, l.destination].some((f) => (f || "").toLowerCase().includes(q));
    const matchesSource = sourceF === "all" || l.source === sourceF;
    const matchesAgent = agentF === "all" || l.assigned_to === agentF;
    return matchesQ && matchesSource && matchesAgent;
  });

  // Reorders cards within each status column; KPIs stay on the full set.
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "budget") return (Number(b.budget) || 0) - (Number(a.budget) || 0);
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });
  const pg = usePagination(sorted, 10, `${query}|${sourceF}|${agentF}|${range}|${sortBy}`);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="leads" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Leads</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Track enquiries through the sales pipeline.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="leads" data={items} />
            {canCreate && (
              <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> New lead
              </button>
            )}
          </div>
        )}
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        {items == null ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (<>
          <Kpi icon={Users} label="Total leads" value={total} />
          <Kpi icon={Flame} label="Open" value={open} />
          <Kpi icon={Wallet} label="Pipeline value" value={formatIDR(pipeline)} />
          <Kpi icon={Trophy} label="Won" value={won} />
        </>)}
      </div>

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ChartCard title="Leads by stage" subtitle="Pipeline distribution."><MixDonut data={byStage} /></ChartCard>
          <ChartCard title="Leads by source" subtitle="Where enquiries come from."><CategoryBars data={dataSrc} money={false} /></ChartCard>
          <ChartCard title="Pipeline value by stage" subtitle="Budget by stage."><CategoryBars data={valueByStage} money={true} /></ChartCard>
        </div>
      )}

      {editing && (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 mb-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit lead" : "New lead"}</h2>
            <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <Row2>
              <Fld label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Jane Traveler" /></Fld>
              <Fld label="Email"><input type="email" value={editing.email} onChange={(e) => upd("email", e.target.value)} className="dash-input" placeholder="jane@example.com" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Phone"><input value={editing.phone} onChange={(e) => upd("phone", e.target.value)} className="dash-input" placeholder="+62…" /></Fld>
              <Fld label="Source">
                <select value={editing.source} onChange={(e) => upd("source", e.target.value)} className="dash-input capitalize">
                  {SOURCES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
              </Fld>
            </Row2>
            <Row2>
              <Fld label="Destination"><input value={editing.destination} onChange={(e) => upd("destination", e.target.value)} className="dash-input" placeholder="Bali, Indonesia" /></Fld>
              <Fld label="Budget (IDR)"><input type="number" value={editing.budget} onChange={(e) => upd("budget", e.target.value)} className="dash-input" placeholder="25000000" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Expected travel date"><input type="date" value={editing.expected_travel_date} onChange={(e) => upd("expected_travel_date", e.target.value)} className="dash-input" /></Fld>
              <Fld label="Party size"><input type="number" min="1" value={editing.party_size} onChange={(e) => upd("party_size", e.target.value)} className="dash-input" placeholder="2" /></Fld>
            </Row2>
            <Row2>
              <Fld label="Priority">
                <select value={editing.priority} onChange={(e) => upd("priority", e.target.value)} className="dash-input capitalize">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{cap(p)}</option>)}
                </select>
              </Fld>
              <Fld label="Status">
                <select value={editing.status} onChange={(e) => upd("status", e.target.value)} className="dash-input capitalize">
                  {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
              </Fld>
            </Row2>
            <Row2>
              <Fld label="Assigned to"><input value={editing.assigned_to} onChange={(e) => upd("assigned_to", e.target.value)} className="dash-input" placeholder="Staff name" /></Fld>
            </Row2>
            <Fld label="Notes"><textarea value={editing.notes} onChange={(e) => upd("notes", e.target.value)} className="dash-input !h-auto py-2" rows={3} placeholder="Enquiry details, preferences…" /></Fld>
          </div>
          <div className="flex gap-2 pt-5">
            <button onClick={save} disabled={saving} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
          </div>
        </div>
      )}

      {items == null ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-5"><SkeletonRows rows={6} /></div>
      ) : (
        <>
          {!editing && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="dash-input pl-9"
                  placeholder="Search leads…"
                />
              </div>
              <select value={sourceF} onChange={(e) => setSourceF(e.target.value)} className="dash-input max-w-[160px]">
                <option value="all">All sources</option>
                {sourceOptions.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
              </select>
              <select value={agentF} onChange={(e) => setAgentF(e.target.value)} className="dash-input max-w-[170px]">
                <option value="all">All agents</option>
                {agentOptions.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <DateRangeSelect value={range} onChange={setRange} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="dash-input max-w-[170px]">
                <option value="newest">Newest</option>
                <option value="budget">Budget high–low</option>
                <option value="name">Name</option>
              </select>
              {(query || sourceF !== "all" || agentF !== "all" || range !== "all" || sortBy !== "newest") && (
                <button onClick={() => { setQuery(""); setSourceF("all"); setAgentF("all"); setRange("all"); setSortBy("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <ViewToggle value={view} onChange={setView} />
            </div>
          )}
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-mora-primary/10">
              <EmptyState
                icon={Users}
                title="No leads yet"
                hint="Capture an enquiry to start moving it through the sales pipeline."
                action={canCreate && (
                  <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press"><Plus className="w-4 h-4" /> New lead</button>
                )}
              />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-mora-neutral/60 text-center py-10">No leads match your filters.</p>
          ) : (
          <>
          {view === "table" ? (
            <DataTable
              columns={[
                { key: "name", label: "Name", className: "font-medium text-mora-primary", render: (l) => l.name },
                { key: "status", label: "Status", render: (l) => <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[l.status] || STATUS_BADGE.new}`}>{l.status || "new"}</span> },
                { key: "source", label: "Source", render: (l) => cap(l.source || "—") },
                { key: "assigned_to", label: "Assigned to", render: (l) => l.assigned_to || "—" },
                { key: "budget", label: "Budget", align: "right", className: "text-right font-semibold text-gold", render: (l) => formatIDR(Number(l.budget) || 0) },
                { key: "created", label: "Created", render: (l) => l.created_date ? moment(l.created_date).format("MMM D, YYYY") : "—" },
              ]}
              rows={pg.pageItems}
              onRowClick={(l) => navigate(`/dashboard/leads/${l.id}`)}
              empty="No leads match your filters."
            />
          ) : (
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex gap-4 min-w-max stagger">
              {STATUSES.map((status) => {
                const col = pg.pageItems.filter((l) => (l.status || "new") === status);
              return (
                <div key={status} className="w-72 shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
                    <h3 className="font-display font-semibold text-mora-primary">{cap(status)}</h3>
                    <span className="text-xs text-mora-neutral/60">{col.length}</span>
                  </div>
                  <div className="space-y-3">
                    {col.map((l) => (
                      <Link key={l.id} to={`/dashboard/leads/${l.id}`} className="block bg-white rounded-xl border border-mora-primary/10 p-3 hover:shadow-md transition-shadow press">
                        <div className="font-medium text-mora-primary truncate">{l.name}</div>
                        <div className="text-xs text-mora-neutral mt-0.5 truncate">
                          {[l.destination, l.source].filter(Boolean).join(" · ") || "—"}
                        </div>
                        <div className="text-sm font-semibold text-gold mt-1">{formatIDR(Number(l.budget) || 0)}</div>
                        {l.assigned_to && <div className="text-[10px] text-mora-neutral/60 uppercase tracking-wider mt-1">{l.assigned_to}</div>}

                        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-mora-primary/5">
                          {canEdit && (
                            <select
                              value={l.status || "new"}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              onChange={(e) => { e.preventDefault(); e.stopPropagation(); setStatus(l.id, e.target.value); }}
                              className="text-[11px] rounded-lg border border-mora-primary/15 bg-white px-2 py-1 text-mora-primary capitalize outline-none focus:border-mora-gold/50 flex-1 min-w-0"
                              title="Move stage"
                            >
                              {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                            </select>
                          )}
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openWhatsApp(l.phone, `Hi ${l.name}, this is MORA Travel following up on your ${l.destination} enquiry…`); }}
                            className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {canConvert && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); convert(l); }}
                              className="w-7 h-7 rounded-lg hover:bg-mora-gold/10 flex items-center justify-center text-gold shrink-0"
                              title="Convert to customer"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(l); }}
                              className="w-7 h-7 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold shrink-0"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(l); }}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 shrink-0"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </Link>
                    ))}
                    {col.length === 0 && (
                      <p className="text-xs text-mora-neutral/50 text-center py-6 border border-dashed border-mora-primary/10 rounded-xl">No leads</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          )}
          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="leads" />
          </>
          )}
        </>
      )}
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
    <div className="min-w-0">
      <div className="text-xs text-mora-neutral uppercase tracking-wider">{label}</div>
      <div className="text-xl font-display font-bold text-mora-primary truncate">{value}</div>
    </div>
  </div>
);

const Row2 = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
const Fld = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
