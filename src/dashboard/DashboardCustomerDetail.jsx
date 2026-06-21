import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import OLMap from "@/components/OLMap";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ChevronLeft, Trash2, Wallet, CalendarClock, Award, Phone, Mail,
  MapPin, Globe, CalendarDays, StickyNote, MapPinned,
} from "lucide-react";

const TIER_BADGE = {
  platinum: "bg-indigo-100 text-indigo-700",
  gold: "bg-mora-gold/15 text-gold",
  silver: "bg-slate-200 text-slate-700",
  bronze: "bg-orange-100 text-orange-700",
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

export default function DashboardCustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [c, setC] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    base44.entities.Customer.filter({ id }).then((r) => setC(r[0] || null));
  }, [id]);

  const remove = async () => {
    try {
      await base44.entities.Customer.delete(id);
      toast.success("Customer removed");
      navigate("/dashboard/customers");
    } catch {
      toast.error("Couldn't delete customer");
    }
  };

  const back = (
    <Link to="/dashboard/customers" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-mora-primary mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to customers
    </Link>
  );

  if (c === undefined) {
    return (
      <div className="p-8 max-w-5xl">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="p-8 max-w-5xl">
        {back}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-10 text-center">
          <h1 className="text-xl font-display font-bold text-mora-primary">Customer not found</h1>
          <p className="text-sm text-mora-neutral mt-1">This customer may have been removed.</p>
        </div>
      </div>
    );
  }

  const tier = c.tier || "bronze";
  const status = c.status || "active";
  const tenure = c.joined_date ? `${moment().diff(moment(c.joined_date), "months")} months` : "—";

  return (
    <div className="p-8 max-w-5xl">
      {back}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-mora-gold/10 text-gold flex items-center justify-center font-display font-bold text-2xl shrink-0 uppercase">
          {(c.name || "?").trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-bold text-mora-primary truncate">{c.name || "Unnamed customer"}</h1>
          {c.email && <p className="text-sm text-mora-neutral mt-0.5 truncate">{c.email}</p>}
          <p className="text-sm text-mora-neutral/70 mt-0.5">{[c.city, c.country].filter(Boolean).join(" · ") || "No location"}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${TIER_BADGE[tier] || TIER_BADGE.bronze}`}>{tier}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{status}</span>
          </div>
        </div>
        {can(role, "customers", "delete") && (
          <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-red-600 hover:bg-red-50 shrink-0">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      {/* Insight KPI row */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <Kpi icon={Wallet} label="Lifetime spend" value={formatIDR(c.lifetime_spend)} />
        <Kpi
          icon={CalendarClock}
          label="Member since"
          value={c.joined_date ? moment(c.joined_date).format("MMM YYYY") : "—"}
          sub={tenure}
        />
        <Kpi icon={Award} label="Tier" value={cap(tier)} />
      </div>

      {/* Detail grid */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Contact & details */}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Contact &amp; details</h2>
          <div className="space-y-1">
            <DetailRow icon={Phone} label="Phone" value={c.phone} />
            <DetailRow icon={Mail} label="Email" value={c.email} />
            <DetailRow icon={MapPin} label="City" value={c.city} />
            <DetailRow icon={Globe} label="Country" value={c.country} />
            <DetailRow icon={CalendarDays} label="Joined date" value={c.joined_date ? moment(c.joined_date).format("D MMM YYYY") : null} />
            {c.notes && <DetailRow icon={StickyNote} label="Notes" value={c.notes} />}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6">
          <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Location</h2>
          {c.lat != null && c.lng != null ? (
            <div className="rounded-xl overflow-hidden border border-mora-primary/10 h-64">
              <OLMap center={[c.lng, c.lat]} zoom={6} markers={[{ id: c.id, lng: c.lng, lat: c.lat }]} interactive={false} />
            </div>
          ) : (
            <div className="h-64 rounded-xl border border-dashed border-mora-primary/15 flex flex-col items-center justify-center text-mora-neutral/60">
              <MapPinned className="w-6 h-6 mb-2" />
              <span className="text-sm">No location set</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
      <div className="text-xs text-mora-neutral uppercase tracking-wider">{label}</div>
    </div>
    <div className="text-xl font-display font-bold text-mora-primary mt-3 truncate">{value}</div>
    {sub && <div className="text-xs text-mora-neutral/70 mt-0.5">{sub}</div>}
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
