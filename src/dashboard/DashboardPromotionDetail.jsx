import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ChevronLeft, Pencil, Trash2, Megaphone, CalendarDays, Newspaper,
  Percent, Wallet, CalendarClock, MapPin, MousePointerClick, Clock,
  Tag, Hash, Users, FileText,
} from "lucide-react";
import { confirmDialog } from "@/components/ConfirmDialog";

const AUDIENCE_META = {
  all: { label: "All users", pill: "bg-ich-primary/10 text-ich-primary" },
  platinum: { label: "Platinum", pill: "bg-slate-500/15 text-slate-600" },
  gold: { label: "Gold", pill: "bg-ich-gold/15 text-gold" },
  new: { label: "New users", pill: "bg-emerald-500/15 text-emerald-600" },
  inactive: { label: "Inactive", pill: "bg-blue-500/15 text-blue-600" },
};

const TYPE_META = {
  promo: { label: "Promotion", pill: "bg-ich-gold/10 text-gold", icon: Megaphone },
  event: { label: "Event", pill: "bg-blue-500/15 text-blue-600", icon: CalendarDays },
  news: { label: "News", pill: "bg-emerald-500/15 text-emerald-600", icon: Newspaper },
};

export default function DashboardPromotionDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();
  const [item, setItem] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    base44.entities.Promotion.filter({ id }).then((r) => setItem(r[0] || null));
  }, [id]);

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this entry?",
      body: `${item?.title || "This entry"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await base44.entities.Promotion.delete(id);
      toast.success("Entry removed");
      navigate("/dashboard/promotions");
    } catch {
      toast.error("Couldn't delete entry");
    }
  };

  const back = (
    <Link to="/dashboard/promotions" className="inline-flex items-center gap-1.5 text-sm text-ich-neutral hover:text-gold mb-5">
      <ChevronLeft className="w-4 h-4" /> Back to promotions
    </Link>
  );

  if (item === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-10 text-center">
          <h1 className="text-xl font-display font-bold text-ich-primary">Entry not found</h1>
          <p className="text-sm text-ich-neutral mt-1">This entry may have been removed.</p>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[item.type] || TYPE_META.promo;
  const isPromo = item.type === "promo";
  const days = item.valid_until ? moment(item.valid_until).diff(moment("2026-06-21"), "days") : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* Banner */}
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          className="w-full h-56 object-cover rounded-2xl mb-6"
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 flex items-start gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.pill}`}>{meta.label}</span>
            {item.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-ich-primary/10 text-ich-primary">Featured</span>}
          </div>
          <h1 className="text-2xl font-display font-bold text-ich-primary mt-2">{item.title}</h1>
          {item.description && <p className="text-sm text-ich-neutral leading-relaxed mt-2">{item.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {can(role, "promotions", "edit") && (
            <button onClick={() => navigate(`/dashboard/promotions?edit=${id}`)} className="text-ich-primary bg-ich-primary/5 hover:bg-ich-primary/10 rounded-xl px-3.5 py-2 text-sm font-medium inline-flex items-center gap-1.5">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          {can(role, "promotions", "delete") && (
            <button onClick={remove} className="text-red-600 bg-red-500/10 hover:bg-red-500/15 rounded-xl px-3.5 py-2 text-sm font-medium inline-flex items-center gap-1.5">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Info KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <Kpi icon={meta.icon} label="Type" value={meta.label} />
        {isPromo && item.discount ? <Kpi icon={Percent} label="Discount" value={`${item.discount}% off`} /> : null}
        {isPromo && item.price ? <Kpi icon={Wallet} label="Price" value={formatIDR(item.price)} /> : null}
        {isPromo && item.valid_until ? (
          <Kpi
            icon={CalendarClock}
            label="Valid until"
            value={moment(item.valid_until).format("MMM D, YYYY")}
            sub={days >= 0 ? `${days} days left` : "Expired"}
          />
        ) : null}
        {!isPromo && item.date ? <Kpi icon={CalendarDays} label="Date" value={moment(item.date).format("MMM D, YYYY")} /> : null}
        {item.location ? <Kpi icon={MapPin} label="Location" value={item.location} /> : null}
      </div>

      {/* Details card */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mt-6">
        <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">Details</h2>
        <div className="space-y-1">
          {item.location && <DetailRow icon={MapPin} label="Location" value={item.location} />}
          {item.cta && <DetailRow icon={MousePointerClick} label="Call-to-action button" value={item.cta} />}
          <DetailRow icon={Tag} label="Promo code" value={item.promo_code ? <span className="font-mono text-xs bg-ich-primary/5 border border-ich-primary/10 rounded-md px-2 py-0.5 inline-block">{item.promo_code}</span> : "—"} />
          <DetailRow icon={Hash} label="Max redemptions" value={item.max_redemptions != null && item.max_redemptions !== "" ? Number(item.max_redemptions).toLocaleString() : "—"} />
          <DetailRow icon={Users} label="Audience" value={item.audience ? <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${(AUDIENCE_META[item.audience] || AUDIENCE_META.all).pill}`}>{(AUDIENCE_META[item.audience] || AUDIENCE_META.all).label}</span> : "—"} />
          {isPromo && item.valid_until && <DetailRow icon={CalendarClock} label="Valid until" value={moment(item.valid_until).format("MMM D, YYYY")} />}
          {!isPromo && item.date && <DetailRow icon={CalendarDays} label="Date" value={moment(item.date).format("MMM D, YYYY")} />}
          {item.created_date && <DetailRow icon={Clock} label="Created" value={moment(item.created_date).format("MMM D, YYYY")} />}
          <DetailRow icon={FileText} label="Terms & conditions" value={item.terms ? <span className="whitespace-pre-line">{item.terms}</span> : "—"} />
        </div>
      </div>
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-ich-primary/10 p-5">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-ich-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-4.5 h-4.5" /></div>
      <div className="text-xs text-ich-neutral uppercase tracking-wider">{label}</div>
    </div>
    <div className="text-xl font-display font-bold text-ich-primary mt-3 truncate">{value}</div>
    {sub && <div className="text-xs text-ich-neutral/70 mt-0.5">{sub}</div>}
  </div>
);

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2 border-b border-ich-primary/5 last:border-0">
    <Icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[11px] text-ich-neutral uppercase tracking-wider">{label}</div>
      <div className="text-sm text-ich-primary break-words">{value}</div>
    </div>
  </div>
);
