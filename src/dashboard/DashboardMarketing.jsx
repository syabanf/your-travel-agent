import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { Plus, Pencil, Trash2, X, Loader2, Save, Send, Megaphone, CheckCircle2, Users, CalendarClock, Mail, MessageCircle, Bell, Search } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

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
  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null); // form object or null
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [channelF, setChannelF] = useState("all");
  const [statusF, setStatusF] = useState("all");

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

  const total = items?.length || 0;
  const sentCount = items?.filter((c) => c.status === "sent").length || 0;
  const reached = items?.reduce((s, c) => s + (Number(c.sent_count) || 0), 0) || 0;
  const scheduledCount = items?.filter((c) => c.status === "scheduled").length || 0;

  const q = query.trim().toLowerCase();
  const filtered = (items || []).filter((c) => {
    const matchesQ = !q || [c.name, c.promo_code].some((v) => (v || "").toLowerCase().includes(q));
    const matchesChannel = channelF === "all" || c.channel === channelF;
    const matchesStatus = statusF === "all" || c.status === statusF;
    return matchesQ && matchesChannel && matchesStatus;
  });

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Marketing Campaigns</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Plan and send email, WhatsApp & push campaigns to traveler segments.</p>
        </div>
        {!editing && can(role, "marketing", "create") && (
          <button onClick={startAdd} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New campaign
          </button>
        )}
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi icon={Megaphone} label="Total campaigns" value={total} />
        <Kpi icon={CheckCircle2} label="Sent" value={sentCount} />
        <Kpi icon={Users} label="Recipients reached" value={reached} />
        <Kpi icon={CalendarClock} label="Scheduled" value={scheduledCount} />
      </div>

      {editing ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-mora-primary">{editing.id ? "Edit campaign" : "New campaign"}</h2>
            <button onClick={() => setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <Fld label="Name"><input value={editing.name} onChange={(e) => upd("name", e.target.value)} className="dash-input" placeholder="Platinum Bali Flash Sale" /></Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Channel">
                <select value={editing.channel} onChange={(e) => upd("channel", e.target.value)} className="dash-input">
                  {CHANNELS.map((ch) => <option key={ch} value={ch}>{CHANNEL_META[ch].label}</option>)}
                </select>
              </Fld>
              <Fld label="Segment">
                <select value={editing.segment} onChange={(e) => upd("segment", e.target.value)} className="dash-input">
                  {SEGMENTS.map((s) => <option key={s} value={s}>{cap(s)} ({segmentCount(s)})</option>)}
                </select>
              </Fld>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Promo code"><input value={editing.promo_code} onChange={(e) => upd("promo_code", e.target.value)} className="dash-input" placeholder="MORA20" /></Fld>
              <Fld label="Discount %"><input type="number" value={editing.discount} onChange={(e) => upd("discount", e.target.value)} className="dash-input" placeholder="20" /></Fld>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Status">
                <select value={editing.status} onChange={(e) => upd("status", e.target.value)} className="dash-input">
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="sent">Sent</option>
                </select>
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
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-mora-neutral absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="dash-input pl-9" placeholder="Search campaigns…" />
            </div>
            <select value={channelF} onChange={(e) => setChannelF(e.target.value)} className="dash-input max-w-[150px]">
              <option value="all">All channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="push">Push</option>
            </select>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="dash-input max-w-[150px]">
              <option value="all">All status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          {filtered.map((c) => {
            const meta = CHANNEL_META[c.channel] || CHANNEL_META.email;
            const ChIcon = meta.icon;
            const recipients = segmentCount(c.segment);
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-mora-primary/10 p-4 flex items-center gap-4 group hover:shadow-md transition-shadow">
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
                      <button onClick={() => sendNow(c)} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-mora-gold/10 text-gold hover:bg-mora-gold/20 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" /> Send now
                      </button>
                    )}
                    <div className="flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {can(role, "marketing", "edit") && (
                        <button onClick={() => startEdit(c)} className="w-8 h-8 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary hover:text-gold"><Pencil className="w-4 h-4" /></button>
                      )}
                      {can(role, "marketing", "delete") && (
                        <button onClick={() => remove(c)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-600"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && <p className="text-mora-neutral/60 text-center py-10">No campaigns yet — create your first one.</p>}
          {items.length > 0 && filtered.length === 0 && <p className="text-mora-neutral/60 text-center py-10">No campaigns match your filters.</p>}
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
