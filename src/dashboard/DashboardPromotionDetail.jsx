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
} from "lucide-react";

const TYPE_META = {
  promo: { label: "Promotion", pill: "bg-mora-gold/10 text-gold", icon: Megaphone },
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
    try {
      await base44.entities.Promotion.delete(id);
      toast.success("Entry removed");
      navigate("/dashboard/promotions");
    } catch {
      toast.error("Couldn't delete entry");
    }
  };

  const back = (
    <Link to="/dashboard/promotions" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-gold mb-5">
      <ChevronLeft className="w-4 h-4" /> Back to promotions
    </Link>
  );

  if (item === undefined) {
    return (
      <div className="p-8 max-w-4xl">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 max-w-4xl">
        {back}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-10 text-center">
          <h1 className="text-xl font-display font-bold text-mora-primary">Entry not found</h1>
          <p className="text-sm text-mora-neutral mt-1">This entry may have been removed.</p>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[item.type] || TYPE_META.promo;
  const isPromo = item.type === "promo";
  const days = item.valid_until ? moment(item.valid_until).diff(moment("2026-06-21"), "days") : null;

  return (
    <div className="p-8 max-w-4xl">
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
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 flex items-start gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.pill}`}>{meta.label}</span>
            {item.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-mora-primary/10 text-mora-primary">Featured</span>}
          </div>
          <h1 className="text-2xl font-display font-bold text-mora-primary mt-2">{item.title}</h1>
          {item.description && <p className="text-sm text-mora-neutral leading-relaxed mt-2">{item.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {can(role, "promotions", "edit") && (
            <button onClick={() => navigate(`/dashboard/promotions?edit=${id}`)} className="text-mora-primary bg-mora-primary/5 hover:bg-mora-primary/10 rounded-xl px-3.5 py-2 text-sm font-medium inline-flex items-center gap-1.5">
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
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 mt-6">
        <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Details</h2>
        <div className="space-y-1">
          {item.location && <DetailRow icon={MapPin} label="Location" value={item.location} />}
          {item.cta && <DetailRow icon={MousePointerClick} label="Call-to-action button" value={item.cta} />}
          {isPromo && item.valid_until && <DetailRow icon={CalendarClock} label="Valid until" value={moment(item.valid_until).format("MMM D, YYYY")} />}
          {!isPromo && item.date && <DetailRow icon={CalendarDays} label="Date" value={moment(item.date).format("MMM D, YYYY")} />}
          {item.created_date && <DetailRow icon={Clock} label="Created" value={moment(item.created_date).format("MMM D, YYYY")} />}
        </div>
      </div>
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-4.5 h-4.5" /></div>
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
      <div className="text-sm text-mora-primary break-words">{value}</div>
    </div>
  </div>
);
