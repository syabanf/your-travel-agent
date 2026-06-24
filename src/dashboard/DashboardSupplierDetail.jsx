import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";
import {
  ChevronLeft, Trash2, Star, ShoppingBag, Wallet, Receipt, Percent,
  Mail, Phone, MessageCircle,
} from "lucide-react";

const TYPE_BADGE = {
  flight: "bg-blue-100 text-blue-700",
  hotel: "bg-emerald-100 text-emerald-700",
  activity: "bg-mora-gold/10 text-gold",
  transport: "bg-indigo-100 text-indigo-700",
  dmc: "bg-slate-200 text-slate-700",
};

const STATUS_BADGE = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function DashboardSupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [s, setS] = useState(undefined); // undefined = loading, null = not found
  const [bookings, setBookings] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    base44.entities.Supplier.filter({ id }).then((r) => setS(r[0] || null));
    base44.entities.Booking.list("-created_date", 500).then((all) =>
      setBookings((all || []).filter((b) => b.supplier_id === id))
    );
  }, [id]);

  const remove = async () => {
    try {
      await base44.entities.Supplier.delete(id);
      toast.success("Supplier removed");
      navigate("/dashboard/suppliers");
    } catch {
      toast.error("Couldn't delete supplier");
    }
  };

  const back = (
    <Link to="/dashboard/suppliers" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-mora-primary mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to suppliers
    </Link>
  );

  if (s === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-10 text-center">
          <h1 className="text-xl font-display font-bold text-mora-primary">Supplier not found</h1>
          <p className="text-sm text-mora-neutral mt-1">This supplier may have been removed.</p>
        </div>
      </div>
    );
  }

  const type = s.type || "dmc";
  const status = s.status || "active";
  const rate = Number(s.commission_rate) || 0;

  const count = bookings.length;
  const totalSales = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const totalCost = bookings.reduce((sum, b) => sum + (Number(b.cost_price) || 0), 0);
  const estCommission = bookings.reduce((sum, b) => sum + ((Number(b.price) || 0) * rate) / 100, 0);

  const needle = q.trim().toLowerCase();
  const bookingStatuses = [...new Set(bookings.map((b) => b.status).filter(Boolean))];
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    return !needle || `${b.title || ""} ${b.package_name || ""}`.toLowerCase().includes(needle);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-mora-gold/10 text-gold flex items-center justify-center font-display font-bold text-2xl shrink-0 uppercase">
          {(s.name || "?").trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-bold text-mora-primary truncate">{s.name || "Unnamed supplier"}</h1>
          <p className="text-sm text-mora-neutral/70 mt-0.5">{s.country || "No country"}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${TYPE_BADGE[type] || TYPE_BADGE.dmc}`}>{type}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mora-gold/10 text-gold flex items-center gap-1">
              <Star className="w-3 h-3 fill-gold" /> {Number(s.rating || 0).toFixed(1)}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{status}</span>
          </div>
        </div>
        {can(role, "suppliers", "delete") && (
          <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-red-600 hover:bg-red-50 shrink-0">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      {/* Contact row */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-gold shrink-0" />
          {s.contact_email
            ? <a href={`mailto:${s.contact_email}`} className="text-mora-primary hover:text-gold break-all">{s.contact_email}</a>
            : <span className="text-mora-neutral/50">No email</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-gold shrink-0" />
          {s.contact_phone
            ? <span className="text-mora-primary">{s.contact_phone}</span>
            : <span className="text-mora-neutral/50">No phone</span>}
          {s.contact_phone && (
            <button
              onClick={() => openWhatsApp(s.contact_phone, `Hi ${s.name}, this is MORA Travel…`)}
              className="ml-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Supplier details */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 mt-6">
        <h2 className="font-display font-semibold text-mora-primary mb-3">Supplier details</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
          <Row label="Contact person" value={s.contact_person} />
          <Row label="Website" value={s.website} href={s.website ? (s.website.startsWith("http") ? s.website : `https://${s.website}`) : null} />
          <Row label="Payment terms" value={s.payment_terms} />
          <Row label="Commission rate" value={s.commission_rate != null ? `${s.commission_rate}%` : ""} />
          <Row label="Address" value={s.address} />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Kpi icon={ShoppingBag} label="Bookings" value={count} />
        <Kpi icon={Wallet} label="Total sales" value={formatIDR(totalSales)} />
        <Kpi icon={Receipt} label="Total cost" value={formatIDR(totalCost)} />
        <Kpi icon={Percent} label="Est. commission" value={formatIDR(estCommission)} />
      </div>

      {/* Bookings */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 mt-6">
        <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Bookings from this supplier</h2>
        {count === 0 ? (
          <p className="text-mora-neutral/60 text-sm py-6 text-center">No bookings yet</p>
        ) : (
          <>
          <div className="flex flex-wrap gap-2 mb-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="dash-input flex-1 min-w-[140px]"
              placeholder="Search bookings…"
            />
            {bookingStatuses.length > 0 && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dash-input max-w-[150px] capitalize">
                <option value="">All statuses</option>
                {bookingStatuses.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            )}
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-mora-neutral uppercase tracking-wider border-b border-mora-primary/10">
                  <th className="font-medium py-2 px-2">Title</th>
                  <th className="font-medium py-2 px-2">Status</th>
                  <th className="font-medium py-2 px-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="border-b border-mora-primary/5 last:border-0">
                    <td className="py-2.5 px-2">
                      <Link to={`/dashboard/bookings/${b.id}`} className="text-mora-primary hover:text-gold font-medium">
                        {b.title || b.package_name || "Untitled booking"}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[b.status] || "bg-slate-100 text-slate-500"}`}>{b.status || "—"}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-gold whitespace-nowrap">{formatIDR(b.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <p className="text-mora-neutral/60 text-sm py-6 text-center">No bookings match your filter.</p>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
      <div className="text-xs text-mora-neutral uppercase tracking-wider">{label}</div>
    </div>
    <div className="text-xl font-display font-bold text-mora-primary mt-3 truncate">{value}</div>
  </div>
);

const Row = ({ label, value, href }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-mora-primary/5 pb-2 last:border-0">
    <span className="text-mora-neutral/60 shrink-0">{label}</span>
    {value
      ? (href
        ? <a href={href} target="_blank" rel="noreferrer" className="text-mora-primary hover:text-gold text-right break-all">{value}</a>
        : <span className="text-mora-primary font-medium text-right">{value}</span>)
      : <span className="text-mora-neutral/40">—</span>}
  </div>
);
