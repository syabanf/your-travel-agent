import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { Plus, Pencil, Trash2, X, Loader2, Save, Send, Megaphone, CheckCircle2, Users, CalendarClock, Mail, MessageCircle, Bell, Search } from "lucide-react";
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
import SearchableSelect from "@/dashboard/SearchableSelect";

const EMPTY = { name: "", channel: "email", segment: "all", promo_code: "", discount: "", status: "draft", scheduled_date: "" };

const CHANNELS = ["email", "whatsapp", "push"];
const CHANNEL_META = {
  email: { label: "Email", icon: Mail, badge: "bg-blue-500/15 text-blue-600" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, badge: "bg-emerald-500/15 text-emerald-600" },
  push: { label: "Push", icon: Bell, badge: "bg-indigo-500/15 text-indigo-600" },
};

const SEGMENTS = ["all", "platinum", "gold", "silver", "bronze", "active", "inactive"];

const STATUS_BADGE = {
  draft: "bg-mora-primary/10 text-mora-neutral",
  scheduled: "bg-mora-gold/10 text-gold",
  sent: "bg-emerald-100 text-emerald-700",
};

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function DashboardMarketing() {
  const { role } = useRole();
  const navigate = useNavigate();
  const [view, setView] = useState("table");
  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [channelF, setChannelF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [range, setRange] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const load = async () => {
    const [campaigns, custs] = await Promise.all([
      base44.entities.Campaign.list("-created_date", 500),
      base44.entities.Customer.list("-created_date", 500),
    ]);
    setCustomers(custs || []);
    setItems(campaigns || []);
  };
  useEffect(() => { load(); }, []);

  // How many recipients a segment resolves to, against the customer base.
  const segmentCount = (segment) => {
    if (segment === "all") return customers.length;
    if (["platinum", "gold", "silver", "bronze"].includes(segment)) return customers.filter((c) => c.tier === segment).length;
    if (["active", "inactive"].includes(segment)) return customers.filter((c) => c.status === segment).length;
    return 0;
  };

  const startAdd = () => setEditing({ ...EMPTY });
  const startEdit = (c) => setEditing({ ...EMPTY, ...c, discount: c.discount ?? "" });
  const upd = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!editing.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        channel: editing.channel || "email",
        segment: editing.segment || "all",
        promo_code: editing.promo_code || "",
        discount: editing.discount ? Number(editing.discount) : 0,
        status: editing.status || "draft",
        scheduled_date: editing.scheduled_date || "",
        sent_count: editing.sent_count || 0,
      };
      if (editing.id) await base44.entities.Campaign.update(editing.id, payload);
      else await base44.entities.Campaign.create(payload);
      toast.success(editing.id ? "Campaign updated" : "Campaign created");
      setEditing(null);
      await load();
    } catch { toast.error("Couldn't save campaign"); }
    finally { setSaving(false); }
  };

  const remove = async (c) => {
    await base44.entities.Campaign.delete(c.id);
    toast.success("Campaign removed");
    load();
  };

  // Simulated send — flips status to sent and records how many recipients it reached.
  const sendNow = async (c) => {
    const n = segmentCount(c.segment);
    await base44.entities.Campaign.update(c.id, { status: "sent", sent_count: n, scheduled_date: moment().format("YYYY-MM-DD") });
    toast.success(`Campaign sent to ${n} recipients`);
    load();
  };

  // Date range scopes the whole view (KPIs, charts & table); search/selects refine the table.
  const scoped = (items || []).filter((c) => inRange(c.created_date, range));

  const total = scoped.length;
  const sentCount = scoped.filter((c) => c.status === "sent").length;
  const reached = scoped.reduce((s, c) => s + (Number(c.sent_count) || 0), 0);
  const scheduledCount = scoped.filter((c) => c.status === "scheduled").length;

  const q = query.trim().toLowerCase();
  const filtered = scoped.filter((c) => {
    const matchesQ = !q || [c.name, c.promo_code].some((v) => (v || "").toLowerCase().includes(q));
    const matchesChannel = channelF === "all" || c.channel === channelF;
    const matchesStatus = statusF === "all" || c.status === statusF;
    return matchesQ && matchesChannel && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
    if (sortBy === "status") return (a.status || "draft").localeCompare(b.status || "draft");
    return new Date(b.created_date || 0) - new Date(a.created_date || 0);
  });
  const pg = usePagination(sorted, 12, `${query}|${channelF}|${statusF}|${range}|${sortBy}`);

  // Insight aggregations (date-scoped)
  const channelCount = {}, channelSent = {}, statusCount = {};
  scoped.forEach((c) => {
    const ch = c.channel || "email";
    channelCount[ch] = (channelCount[ch] || 0) + 1;
    channelSent[ch] = (channelSent[ch] || 0) + (Number(c.sent_count) || 0);
    const st = c.status || "draft";
    statusCount[st] = (statusCount[st] || 0) + 1;
  });
  const byChannel = CHANNELS.map((ch) => ({ name: CHANNEL_META[ch].label, value: channelCount[ch] || 0 })).filter((d) => d.value);
  const sentByChannel = CHANNELS.map((ch) => ({ name: CHANNEL_META[ch].label, value: channelSent[ch] || 0 })).filter((d) => d.value);
  const STATUS_COLOR = { draft: "#94A3B8", scheduled: "#C99A3F", sent: "#10B981" };
  const byStatus = Object.entries(statusCount).map(([k, value]) => ({ name: cap(k), value, color: STATUS_COLOR[k] }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="marketing" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Marketing Campaigns</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Plan and send email, WhatsApp & push campaigns to traveler segments.</p>
        </div>
        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <DashboardAiStub resource="marketing" data={items} />
            {can(role, "marketing", "create") && (
              <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" /> New campaign
              </button>
            )}
          </div>
        )}
      </header>

      {/* KPI row */}
      {items == null ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
          <Kpi icon={Megaphone} label="Total campaigns" value={total} />
          <Kpi icon={CheckCircle2} label="Sent" value={sentCount} />
          <Kpi icon={Users} label="Recipients reached" value={reached} />
          <Kpi icon={CalendarClock} label="Scheduled" value={scheduledCount} />
        </div>
      )}

      {!editing && items && items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ChartCard title="Campaigns by channel" subtitle="Where you reach travelers."><CategoryBars data={byChannel} money={false} /></ChartCard>
          <ChartCard title="Campaigns by status" subtitle="Pipeline state."><MixDonut data={byStatus} /></ChartCard>
          <ChartCard title="Messages sent by channel" subtitle="Recipients reached."><CategoryBars data={sentByChannel} money={false} /></ChartCard>
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit campaign" : "New campaign"}</h2>
            <button onClick={() => setEditing(null)} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <Fld label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Platinum Bali Flash Sale" /></Fld>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Channel">
                <SearchableSelect
                  value={editing.channel}
                  onChange={(v) => upd("channel", v)}
                  options={CHANNELS.map((ch) => ({ value: String(ch), label: CHANNEL_META[ch].label }))}
                  ariaLabel="Channel"
                />
              </Fld>
              <Fld label="Segment">
                <SearchableSelect
                  value={editing.segment}
                  onChange={(v) => upd("segment", v)}
                  options={SEGMENTS.map((s) => ({ value: String(s), label: `${cap(s)} (${segmentCount(s)})` }))}
                  ariaLabel="Segment"
                />
              </Fld>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Promo code"><input value={editing.promo_code} onChange={(e) => upd("promo_code", e.target.value)} className="dash-input" placeholder="MORA20" /></Fld>
              <Fld label="Discount %"><input type="number" value={editing.discount} onChange={(e) => upd("discount", e.target.value)} className="dash-input" placeholder="20" /></Fld>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fld label="Status">
                <SearchableSelect
                  value={editing.status}
                  onChange={(v) => upd("status", v)}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "sent", label: "Sent" },
                  ]}
                  ariaLabel="Status"
                />
              </Fld>
              <Fld label="Scheduled date"><input type="date" value={editing.scheduled_date} onChange={(e) => upd("scheduled_date", e.target.value)} className="dash-input" /></Fld>
            </div>
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
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-mora-neutral absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search campaigns…" />
            </div>
            <SearchableSelect
              value={channelF}
              onChange={setChannelF}
              options={[
                { value: "all", label: "All channels" },
                { value: "email", label: "Email" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "push", label: "Push" },
              ]}
              ariaLabel="Filter by channel"
              className="max-w-[150px]"
            />
            <SearchableSelect
              value={statusF}
              onChange={setStatusF}
              options={[
                { value: "all", label: "All status" },
                { value: "draft", label: "Draft" },
                { value: "scheduled", label: "Scheduled" },
                { value: "sent", label: "Sent" },
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
                { value: "name", label: "Name A–Z" },
                { value: "status", label: "Status" },
              ]}
              ariaLabel="Sort by"
              className="max-w-[160px]"
            />
            {(query || channelF !== "all" || statusF !== "all" || range !== "all" || sortBy !== "newest") && (
              <button onClick={() => { setQuery(""); setChannelF("all"); setStatusF("all"); setRange("all"); setSortBy("newest"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <ViewToggle value={view} onChange={setView} />
          </div>
          {view === "table" ? (
            <DataTable
              columns={[
                { key: "name", label: "Name", className: "font-medium text-mora-primary", render: (c) => c.name },
                { key: "channel", label: "Channel", render: (c) => {
                  const meta = CHANNEL_META[c.channel] || CHANNEL_META.email;
                  return <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>;
                } },
                { key: "segment", label: "Segment", render: (c) => cap(c.segment || "all") },
                { key: "promo_code", label: "Promo code", render: (c) => c.promo_code ? <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-mora-primary/5 text-mora-primary">{c.promo_code}</span> : "—" },
                { key: "discount", label: "Discount", align: "right", className: "text-right font-semibold text-gold", render: (c) => `${Number(c.discount) || 0}%` },
                { key: "status", label: "Status", render: (c) => <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] || STATUS_BADGE.draft}`}>{c.status || "draft"}</span> },
                { key: "sent_count", label: "Sent", align: "right", className: "text-right", render: (c) => Number(c.sent_count) || 0 },
              ]}
              rows={pg.pageItems}
              onRowClick={(c) => navigate(`/dashboard/marketing/${c.id}`)}
              empty="No campaigns match your search or filters."
            />
          ) : (
          <div className="space-y-3 stagger">
          {pg.pageItems.map((c) => {
            const meta = CHANNEL_META[c.channel] || CHANNEL_META.email;
            const ChIcon = meta.icon;
            const recipients = segmentCount(c.segment);
            return (
              <Link key={c.id} to={`/dashboard/marketing/${c.id}`} className="bg-white rounded-2xl border border-mora-primary/10 p-4 flex items-center gap-4 group hover:shadow-md transition-shadow press">
                <div className="w-11 h-11 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><ChIcon className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-mora-primary truncate">{c.name}</h3>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] || STATUS_BADGE.draft}`}>{c.status || "draft"}</span>
                  </div>
                  <p className="text-xs text-mora-neutral mt-0.5">
                    {cap(c.segment || "all")} <span className="text-mora-neutral/70">({recipients} recipients)</span>
                    {c.scheduled_date ? ` · ${moment(c.scheduled_date).format("MMM D, YYYY")}` : ""}
                    {c.status === "sent" ? ` · ${Number(c.sent_count) || 0} sent` : ""}
                  </p>
                  {c.promo_code ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-mora-primary/5 text-mora-primary">{c.promo_code}</span>
                      {c.discount ? <span className="text-[11px] font-semibold text-gold">{c.discount}% off</span> : null}
                    </div>
                  ) : c.discount ? (
                    <p className="text-[11px] font-semibold text-gold mt-1.5">{c.discount}% off</p>
                  ) : null}
                </div>
                {(can(role, "marketing", "edit") || can(role, "marketing", "delete")) && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.status !== "sent" && can(role, "marketing", "edit") && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); sendNow(c); }} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-mora-gold/10 text-gold hover:bg-mora-gold/20 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Send now
                      </button>
                    )}
                    <div className="flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {can(role, "marketing", "edit") && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(c); }} aria-label="Edit" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold press"><Pencil className="w-4 h-4" /></button>
                      )}
                      {can(role, "marketing", "delete") && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(c); }} aria-label="Delete" className="w-9 h-9 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600 press"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
          </div>
          )}
          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="campaigns" />
          {items.length === 0 && (
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              hint="Plan and send email, WhatsApp & push campaigns to traveler segments."
              action={can(role, "marketing", "create") ? (
                <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New campaign
                </button>
              ) : null}
            />
          )}
          {items.length > 0 && filtered.length === 0 && (
            <EmptyState icon={Search} title="No matches" hint="No campaigns match your search or filters." />
          )}
        </div>
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

const Fld = ({ label, children }) => (
  <div>
    <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">{label}</label>
    {children}
  </div>
);
