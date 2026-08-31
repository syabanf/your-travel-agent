import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { backend } from "@/api/backend";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";
import moment from "moment";
import EmptyState from "@/components/EmptyState";
import {
  ChevronLeft, Trash2, Target, Wallet, Activity, UserCog, Mail, Phone,
  MapPin, Compass, CalendarDays, StickyNote, MessageCircle, UserPlus, Users, Flag,
} from "lucide-react";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { confirmDialog } from "@/components/ConfirmDialog";

const STATUS_BADGE = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-ich-gold/10 text-gold",
  quoted: "bg-indigo-100 text-indigo-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

const PRIORITY_BADGE = { low: "bg-slate-100 text-slate-500", medium: "bg-ich-gold/15 text-gold", high: "bg-red-100 text-red-700" };

const STATUSES = ["new", "contacted", "quoted", "won", "lost"];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function DashboardLeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [lead, setLead] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    backend.entities.Lead.filter({ id }).then((r) => setLead(r[0] || null));
  }, [id]);

  const setStatus = async (status) => {
    if (!can(role, "leads", "edit")) return;
    try {
      await backend.entities.Lead.update(id, { status });
      setLead((p) => ({ ...p, status }));
      toast.success("Stage updated");
    } catch { toast.error("Couldn't update stage"); }
  };

  const convert = async () => {
    try {
      await backend.entities.Customer.create({
        name: lead.name, email: lead.email, phone: lead.phone,
        city: "", country: "", tier: "bronze", status: "active",
        lifetime_spend: 0, joined_date: moment().format("YYYY-MM-DD"),
        notes: `Converted from lead. ${lead.notes || ""}`.trim(),
      });
      await backend.entities.Lead.update(id, { status: "won" });
      toast.success("Converted to customer");
      navigate("/dashboard/customers");
    } catch { toast.error("Couldn't convert lead"); }
  };

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this lead?",
      body: `${lead?.name || "This lead"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await backend.entities.Lead.delete(id);
      toast.success("Lead removed");
      navigate("/dashboard/leads");
    } catch { toast.error("Couldn't delete lead"); }
  };

  const back = (
    <Link to="/dashboard/leads" className="inline-flex items-center gap-1.5 text-sm text-ich-neutral hover:text-ich-primary mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to leads
    </Link>
  );

  if (lead === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="bg-white rounded-2xl border border-ich-primary/10">
          <EmptyState icon={Target} title="Lead not found" hint="This lead may have been removed or converted." />
        </div>
      </div>
    );
  }

  const status = lead.status || "new";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-ich-gold/10 text-gold flex items-center justify-center font-display font-bold text-2xl shrink-0 uppercase">
          {(lead.name || "?").trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-bold text-ich-primary truncate">{lead.name || "Unnamed lead"}</h1>
          <p className="text-sm text-ich-neutral/70 mt-0.5">{[lead.source && cap(lead.source), lead.destination].filter(Boolean).join(" · ") || "No source or destination"}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[status] || STATUS_BADGE.new}`}>{status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lead.phone && (
            <button onClick={() => openWhatsApp(lead.phone, `Hi ${lead.name}, this is Icon Holiday Travel following up on your ${lead.destination} enquiry…`)} className="rounded-xl px-3.5 py-2.5 text-sm font-medium flex items-center gap-2 text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/15">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </button>
          )}
          {can(role, "leads", "delete") && (
            <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <Kpi icon={Wallet} label="Budget" value={formatIDR(Number(lead.budget) || 0)} />
        <Kpi icon={Activity} label="Status" value={cap(status)} />
        <Kpi icon={UserCog} label="Assigned to" value={lead.assigned_to || "—"} />
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mt-6">
        <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">Enquiry details</h2>
        <div className="space-y-1">
          <DetailRow icon={Mail} label="Email" value={lead.email} />
          <DetailRow icon={Phone} label="Phone" value={lead.phone} />
          <DetailRow icon={MapPin} label="Source" value={lead.source ? cap(lead.source) : null} />
          <DetailRow icon={Compass} label="Destination" value={lead.destination} />
          <DetailRow icon={CalendarDays} label="Expected travel date" value={lead.expected_travel_date ? moment(lead.expected_travel_date).format("D MMM YYYY") : null} />
          <DetailRow icon={Users} label="Party size" value={lead.party_size ? `${lead.party_size} ${Number(lead.party_size) > 1 ? "travellers" : "traveller"}` : null} />
          <DetailRow icon={Flag} label="Priority" value={lead.priority ? <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_BADGE[lead.priority] || "bg-slate-100 text-slate-500"}`}>{lead.priority}</span> : null} />
          <DetailRow icon={CalendarDays} label="Created" value={lead.created_date ? moment(lead.created_date).format("D MMM YYYY") : null} />
          {lead.notes && <DetailRow icon={StickyNote} label="Notes" value={lead.notes} />}
        </div>
      </div>

      {/* Actions card */}
      {(can(role, "leads", "edit") || can(role, "customers", "create")) && (
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mt-6">
          <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">Actions</h2>
          <div className="flex flex-wrap items-end gap-4">
            {can(role, "leads", "edit") && (
              <div>
                <label className="text-[11px] text-ich-neutral uppercase tracking-wider mb-1 block">Stage</label>
                <SearchableSelect
                  value={status}
                  onChange={(v) => setStatus(v)}
                  options={STATUSES.map((s) => ({ value: s, label: cap(s) }))}
                  ariaLabel="Stage"
                  className="max-w-xs"
                />
              </div>
            )}
            {can(role, "customers", "create") && (
              <button onClick={convert} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 bg-ich-gold/10 text-gold hover:bg-ich-gold/20">
                <UserPlus className="w-4 h-4" /> Convert to customer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-ich-primary/10 p-5 min-w-0">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-ich-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
      <div className="text-xs text-ich-neutral uppercase tracking-wider">{label}</div>
    </div>
    <div className="stat-value text-xl font-display font-bold text-ich-primary mt-3 min-w-0 truncate">{value}</div>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2 border-b border-ich-primary/5 last:border-0">
    <Icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[11px] text-ich-neutral uppercase tracking-wider">{label}</div>
      <div className="text-sm text-ich-primary break-words">{value || <span className="text-ich-neutral/50">Not set</span>}</div>
    </div>
  </div>
);
