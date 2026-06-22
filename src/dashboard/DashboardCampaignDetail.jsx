import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import EmptyState from "@/components/EmptyState";
import {
  ChevronLeft, Trash2, Send, Users, CheckCircle2, Ticket, CalendarClock,
  Layers, Tag, Radio, CalendarDays, Mail, MessageCircle, Bell,
} from "lucide-react";

const CHANNEL_META = {
  email: { label: "Email", icon: Mail, badge: "bg-blue-500/15 text-blue-600" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, badge: "bg-emerald-500/15 text-emerald-600" },
  push: { label: "Push", icon: Bell, badge: "bg-indigo-500/15 text-indigo-600" },
};

const STATUS_BADGE = {
  draft: "bg-mora-primary/10 text-mora-neutral",
  scheduled: "bg-mora-gold/10 text-gold",
  sent: "bg-emerald-100 text-emerald-700",
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function DashboardCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [campaign, setCampaign] = useState(undefined); // undefined = loading, null = not found
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    base44.entities.Campaign.filter({ id }).then((r) => setCampaign(r[0] || null));
    base44.entities.Customer.list("", 500).then((r) => setCustomers(r || []));
  }, [id]);

  // How many recipients a segment resolves to, against the customer base.
  const segmentCount = (segment) => {
    if (segment === "all") return customers.length;
    if (["platinum", "gold", "silver", "bronze"].includes(segment)) return customers.filter((c) => c.tier === segment).length;
    if (["active", "inactive"].includes(segment)) return customers.filter((c) => c.status === segment).length;
    return 0;
  };

  // Simulated send — flips status to sent and records how many recipients it reached.
  const sendNow = async () => {
    const n = segmentCount(campaign.segment);
    try {
      const patch = { status: "sent", sent_count: n, scheduled_date: moment().format("YYYY-MM-DD") };
      await base44.entities.Campaign.update(id, patch);
      setCampaign((p) => ({ ...p, ...patch }));
      toast.success(`Campaign sent to ${n} recipients`);
    } catch { toast.error("Couldn't send campaign"); }
  };

  const remove = async () => {
    try {
      await base44.entities.Campaign.delete(id);
      toast.success("Campaign removed");
      navigate("/dashboard/marketing");
    } catch { toast.error("Couldn't delete campaign"); }
  };

  const back = (
    <Link to="/dashboard/marketing" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-mora-primary mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to campaigns
    </Link>
  );

  if (campaign === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="bg-white rounded-2xl border border-mora-primary/10">
          <EmptyState icon={Send} title="Campaign not found" hint="This campaign may have been removed." />
        </div>
      </div>
    );
  }

  const channel = campaign.channel || "email";
  const meta = CHANNEL_META[channel] || CHANNEL_META.email;
  const status = campaign.status || "draft";
  const segment = campaign.segment || "all";
  const recipients = segmentCount(segment);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0">
          <meta.icon className="w-7 h-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-bold text-mora-primary truncate">{campaign.name || "Untitled campaign"}</h1>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[status] || STATUS_BADGE.draft}`}>{status}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status !== "sent" && can(role, "marketing", "edit") && (
            <button onClick={sendNow} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 bg-mora-gold/10 text-gold hover:bg-mora-gold/20">
              <Send className="w-4 h-4" /> Send now
            </button>
          )}
          {can(role, "marketing", "delete") && (
            <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Kpi icon={Users} label="Audience" value={`${recipients} recipients`} />
        <Kpi icon={CheckCircle2} label="Sent" value={Number(campaign.sent_count) || 0} />
        <Kpi icon={Ticket} label="Discount" value={campaign.discount ? `${campaign.discount}% off` : (campaign.promo_code || "—")} />
        <Kpi icon={CalendarClock} label="Scheduled" value={campaign.scheduled_date ? moment(campaign.scheduled_date).format("MMM D, YYYY") : "—"} />
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 mt-6">
        <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Campaign details</h2>
        <div className="space-y-1">
          <DetailRow icon={Layers} label="Segment" value={`${cap(segment)} (${recipients} recipients)`} />
          <DetailRow icon={Tag} label="Promo code" value={campaign.promo_code} />
          <DetailRow icon={Radio} label="Channel" value={meta.label} />
          <DetailRow icon={CalendarDays} label="Created" value={campaign.created_date ? moment(campaign.created_date).format("D MMM YYYY") : null} />
        </div>
      </div>
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
      <div className="text-xs text-mora-neutral uppercase tracking-wider">{label}</div>
    </div>
    <div className="stat-value text-xl font-display font-bold text-mora-primary mt-3 min-w-0 truncate">{value}</div>
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2 border-b border-mora-primary/5 last:border-0">
    <Icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[11px] text-mora-neutral uppercase tracking-wider">{label}</div>
      <div className="text-sm text-mora-primary break-words">{value || <span className="text-mora-neutral/50">Not set</span>}</div>
    </div>
  </div>
);
