import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { categoryLabel, categoryIcon, packageDiscount } from "@/data/packageCategories";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ChevronLeft, Pencil, Trash2, MapPin, Wallet, CalendarDays, Users, Star,
  Sparkles, Check, X, Route, CalendarClock, Clock,
} from "lucide-react";
import { confirmDialog } from "@/components/ConfirmDialog";

const STATUS_META = {
  active: { label: "Active", pill: "bg-emerald-500/15 text-emerald-600" },
  draft: { label: "Draft", pill: "bg-slate-500/15 text-slate-600" },
};

export default function DashboardPackageDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();
  const [item, setItem] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    base44.entities.TourPackage.filter({ id })
      .then((r) => setItem(r[0] || null))
      .catch(() => setItem(null));
  }, [id]);

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this package?",
      body: `${item?.title || "This package"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await base44.entities.TourPackage.delete(id);
      toast.success("Package removed");
      navigate("/dashboard/packages");
    } catch {
      toast.error("Couldn't delete package");
    }
  };

  const back = (
    <Link to="/dashboard/packages" className="inline-flex items-center gap-1.5 text-sm text-ich-neutral hover:text-gold mb-5">
      <ChevronLeft className="w-4 h-4" /> Back to packages
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
          <h1 className="text-xl font-display font-bold text-ich-primary">Package not found</h1>
          <p className="text-sm text-ich-neutral mt-1">This package may have been removed.</p>
        </div>
      </div>
    );
  }

  const CatIcon = categoryIcon(item.category);
  const status = STATUS_META[item.status] || STATUS_META.active;
  const off = packageDiscount(item);
  const highlights = item.highlights || [];
  const includes = item.includes || [];
  const excludes = item.excludes || [];
  const itinerary = item.itinerary || [];
  const departures = item.departure_dates || [];
  const duration = item.duration_days ? `${item.duration_days}D / ${item.duration_nights || 0}N` : "—";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* Hero */}
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          className="w-full h-56 object-cover rounded-2xl mb-6"
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium bg-ich-gold/10 text-gold">
              <CatIcon className="w-3 h-3" /> {categoryLabel(item.category)}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.pill}`}>{status.label}</span>
            {item.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-ich-primary/10 text-ich-primary">Featured</span>}
            {off != null && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">-{off}% off</span>}
          </div>
          <h1 className="text-2xl font-display font-bold text-ich-primary mt-2">{item.title}</h1>
          {item.destination && (
            <p className="text-sm text-ich-neutral mt-1 inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold" /> {item.destination}</p>
          )}
          {item.summary && <p className="text-sm text-ich-neutral leading-relaxed mt-2">{item.summary}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {can(role, "promotions", "edit") && (
            <button onClick={() => navigate(`/dashboard/packages?edit=${id}`)} className="text-ich-primary bg-ich-primary/5 hover:bg-ich-primary/10 rounded-xl px-3.5 py-2 text-sm font-medium inline-flex items-center gap-1.5">
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

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <Kpi
          icon={Wallet}
          label="Price per person"
          value={formatIDR(item.price)}
          sub={off != null ? `was ${formatIDR(item.price_before)} · save ${off}%` : (item.currency && item.currency !== "IDR" ? item.currency : null)}
        />
        <Kpi icon={CalendarDays} label="Duration" value={duration} sub={itinerary.length ? `${itinerary.length}-day itinerary` : null} />
        <Kpi
          icon={Users}
          label="Seats left"
          value={Number(item.slots_left) || 0}
          sub={item.min_pax || item.max_pax ? `${item.min_pax || 1}–${item.max_pax || "∞"} pax` : null}
        />
        <Kpi
          icon={Star}
          label="Rating"
          value={item.rating ? Number(item.rating).toFixed(1) : "—"}
          sub={item.reviews_count ? `${Number(item.reviews_count).toLocaleString()} reviews` : "No reviews yet"}
        />
      </div>

      {/* About */}
      {item.description && (
        <Card title="About this package">
          <p className="text-sm text-ich-neutral leading-relaxed whitespace-pre-line">{item.description}</p>
        </Card>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <Card title="Highlights">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-ich-primary">
                <Sparkles className="w-4 h-4 text-gold mt-0.5 shrink-0" /> <span className="min-w-0">{h}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Includes / excludes */}
      {(includes.length > 0 || excludes.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {includes.length > 0 && (
            <div className="bg-white rounded-2xl border border-ich-primary/10 p-6">
              <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">What's included</h2>
              <ul className="space-y-2">
                {includes.map((v, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ich-primary">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /> <span className="min-w-0">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {excludes.length > 0 && (
            <div className="bg-white rounded-2xl border border-ich-primary/10 p-6">
              <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">Not included</h2>
              <ul className="space-y-2">
                {excludes.map((v, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ich-neutral">
                    <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> <span className="min-w-0">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Itinerary */}
      {itinerary.length > 0 && (
        <Card title="Day by day" icon={Route}>
          <ol className="space-y-4">
            {itinerary.map((d, i) => (
              <li key={i} className="flex gap-4">
                <div className="shrink-0 w-11 text-center">
                  <div className="text-[10px] text-ich-neutral uppercase tracking-wider">Day</div>
                  <div className="text-lg font-display font-bold text-gold leading-none">{d.day ?? i + 1}</div>
                </div>
                <div className="min-w-0 flex-1 border-l border-ich-primary/10 pl-4 pb-1">
                  <p className="text-sm font-semibold text-ich-primary">{d.title || `Day ${d.day ?? i + 1}`}</p>
                  {d.detail && <p className="text-sm text-ich-neutral leading-relaxed mt-0.5">{d.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Departures */}
      {departures.length > 0 && (
        <Card title="Upcoming departures" icon={CalendarClock}>
          <div className="flex flex-wrap gap-2">
            {departures.map((d, i) => {
              const m = moment(d);
              const days = m.isValid() ? m.diff(moment().startOf("day"), "days") : null;
              return (
                <span key={i} className="inline-flex items-center gap-2 rounded-xl border border-ich-primary/10 bg-ich-primary/[0.02] px-3 py-2">
                  <CalendarDays className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="text-sm text-ich-primary font-medium">{m.isValid() ? m.format("MMM D, YYYY") : String(d)}</span>
                  {days != null && (
                    <span className="text-[11px] text-ich-neutral/60 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />{days >= 0 ? `in ${days}d` : "past"}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

const Card = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mt-6">
    <h2 className="font-display font-semibold text-lg text-ich-primary mb-4 flex items-center gap-2">
      {Icon && <Icon className="w-4.5 h-4.5 text-gold" />} {title}
    </h2>
    {children}
  </div>
);

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
