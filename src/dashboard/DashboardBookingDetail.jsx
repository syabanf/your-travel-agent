import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatIDR } from "@/lib/currency";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { printDocument, bookingVoucherHTML, receiptHTML, quotationHTML } from "@/lib/voucher";
import { openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";
import moment from "moment";
import {
  ArrowLeft, Building2, MapPin, CalendarDays, Users, Wallet, Hash, StickyNote,
  Trash2, User, Truck, Printer, MessageCircle, Ban, Percent, TrendingUp, Globe, Tag, CreditCard, ReceiptText, FileText,
} from "lucide-react";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { confirmDialog } from "@/components/ConfirmDialog";

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "");

const statusPill = {
  confirmed: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-ich-gold/10 text-gold",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
};
const paymentPill = {
  paid: "bg-emerald-500/15 text-emerald-600",
  deposit: "bg-ich-gold/10 text-gold",
  unpaid: "bg-red-500/15 text-red-600",
};
const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

function Row({ icon: Icon, label, children }) {
  if (children == null || children === "") return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-ich-primary/5 last:border-0">
      <Icon className="w-4 h-4 text-ich-neutral/60 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-ich-neutral/70">{label}</div>
        <div className="text-sm text-ich-primary mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardBookingDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const rows = await base44.entities.Booking.filter({ id });
      const bk = rows[0] || null;
      if (!active) return;
      setB(bk);
      setLoading(false);
      if (bk?.customer_id) base44.entities.Customer.filter({ id: bk.customer_id }).then((r) => active && setCustomer(r[0] || null));
      if (bk?.supplier_id) base44.entities.Supplier.filter({ id: bk.supplier_id }).then((r) => active && setSupplier(r[0] || null));
    })();
    return () => { active = false; };
  }, [id]);

  const backLink = (
    <Link to="/dashboard/bookings" className="inline-flex items-center gap-1.5 text-sm text-ich-neutral hover:text-ich-primary transition-colors">
      <ArrowLeft className="w-4 h-4" /> Back to bookings
    </Link>
  );

  if (loading) {
    return <div className="p-4 sm:p-6 lg:p-8"><div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div></div>;
  }
  if (!b) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">{backLink}</div>
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-10 text-center text-ich-neutral">Booking not found.</div>
      </div>
    );
  }

  const updateStatus = async (status) => {
    await base44.entities.Booking.update(id, { status });
    setB((prev) => ({ ...prev, status }));
    toast.success("Status updated");
  };
  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this booking?",
      body: `${b.title || "This booking"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await base44.entities.Booking.delete(id);
    toast.success("Booking deleted");
    navigate("/dashboard/bookings");
  };
  const cancelBooking = async () => {
    const amt = refundAmount ? Number(refundAmount) : 0;
    const patch = { status: "cancelled", refunded_amount: amt, cancellation_reason: refundReason || "", cancelled_date: moment().format("YYYY-MM-DD") };
    await base44.entities.Booking.update(id, patch);
    setB((prev) => ({ ...prev, ...patch }));
    setCancelOpen(false);
    toast.success(amt ? `Cancelled · refund ${formatIDR(amt)}` : "Booking cancelled");
  };
  const printVoucher = () => printDocument(`Icon Holiday Voucher`, bookingVoucherHTML(b, { supplierName: supplier?.name, customerName: customer?.name }));
  const party = { customerName: customer?.name, customerEmail: customer?.email, customerPhone: customer?.phone };
  const printReceipt = () => printDocument("Icon Holiday Receipt", receiptHTML(b, party));
  const printQuotation = () => printDocument("Icon Holiday Quotation", quotationHTML(b, party));
  const sendWhatsApp = () => {
    const code = b.confirmation_code || `ICH-${String(id).slice(-6).toUpperCase()}`;
    const msg = `Hi ${customer?.name || "there"}, your Icon Holiday booking "${b.title}" is ${b.status}. Confirmation: ${code}. Total: ${formatIDR(b.price || 0)}. Thank you for booking with Icon Holiday Travel!`;
    openWhatsApp(customer?.phone, msg);
  };

  const canEdit = can(role, "bookings", "edit");
  const canDelete = can(role, "bookings", "delete");
  const dates = b.check_in ? `${moment(b.check_in).format("MMM D, YYYY")}${b.check_out ? ` → ${moment(b.check_out).format("MMM D, YYYY")}` : ""}` : "";
  const price = b.price || 0;
  const costPrice = b.cost_price || 0;
  const margin = price - costPrice;
  const marginPct = price ? Math.round((margin / price) * 100) : 0;
  const commission = supplier?.commission_rate ? Math.round((price * supplier.commission_rate) / 100) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">{backLink}</div>

      {b.image_url && (
        <img src={b.image_url} alt={b.title} className="w-full h-48 object-cover rounded-2xl mb-6" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      )}

      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ich-primary">{b.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          {b.type && <span className="text-[11px] px-2 py-0.5 rounded-full capitalize bg-ich-primary/10 text-ich-neutral">{b.type}</span>}
          <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[b.status] || statusPill.pending}`}>{b.status}</span>
        </div>
      </header>

      {b.status === "cancelled" && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mb-6 text-sm">
          <p className="font-medium text-red-600">Cancelled{b.cancelled_date ? ` on ${moment(b.cancelled_date).format("MMM D, YYYY")}` : ""}</p>
          {b.refunded_amount ? <p className="text-ich-neutral mt-0.5">Refunded {formatIDR(b.refunded_amount)}</p> : null}
          {b.cancellation_reason ? <p className="text-ich-neutral mt-0.5">Reason: {b.cancellation_reason}</p> : null}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mb-6">
        <Row icon={Building2} label="Provider">{b.provider}</Row>
        <Row icon={User} label="Customer">{customer ? <Link to={`/dashboard/customers/${customer.id}`} className="text-ich-primary hover:text-gold font-medium">{customer.name}</Link> : (b.customer_id ? "—" : null)}</Row>
        <Row icon={Truck} label="Supplier">{supplier ? <Link to={`/dashboard/suppliers/${supplier.id}`} className="text-ich-primary hover:text-gold font-medium">{supplier.name}</Link> : (b.supplier_id ? "—" : null)}</Row>
        <Row icon={MapPin} label="Location">{b.location}</Row>
        <Row icon={Globe} label="Channel">{b.channel || "—"}</Row>
        <Row icon={Tag} label="Supplier ref">{b.supplier_ref ? <span className="font-mono">{b.supplier_ref}</span> : "—"}</Row>
        <Row icon={CalendarDays} label="Dates">{dates}</Row>
        <Row icon={Users} label="Guests">{b.guests}</Row>
        <Row icon={Hash} label="Confirmation code">{b.confirmation_code ? <span className="font-mono">{b.confirmation_code}</span> : null}</Row>
        <Row icon={StickyNote} label="Notes">{b.notes}</Row>
      </div>

      {/* Financials / margin */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mb-6">
        <h2 className="text-sm font-semibold text-ich-primary mb-4 flex items-center gap-2"><Wallet className="w-4 h-4 text-gold" /> Financials</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="min-w-0"><div className="text-[11px] uppercase tracking-wider text-ich-neutral/70">Sell price</div><div className="stat-value text-base lg:text-lg font-display font-bold text-gold">{formatIDR(price)}</div></div>
          <div className="min-w-0"><div className="text-[11px] uppercase tracking-wider text-ich-neutral/70">Cost</div><div className="stat-value text-base lg:text-lg font-display font-bold text-ich-primary">{formatIDR(costPrice)}</div></div>
          <div className="min-w-0"><div className="text-[11px] uppercase tracking-wider text-ich-neutral/70 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Margin</div><div className="stat-value text-base lg:text-lg font-display font-bold text-emerald-600">{formatIDR(margin)} <span className="text-xs font-normal text-ich-neutral">({marginPct}%)</span></div></div>
          <div className="min-w-0"><div className="text-[11px] uppercase tracking-wider text-ich-neutral/70 flex items-center gap-1"><Percent className="w-3 h-3" /> Commission</div><div className="stat-value text-base lg:text-lg font-display font-bold text-ich-primary">{b.commission ? formatIDR(b.commission) : (commission != null ? formatIDR(commission) : "—")}</div></div>
        </div>
        <div className="mt-4 pt-4 border-t border-ich-primary/5 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-ich-neutral/60 shrink-0" />
          <span className="text-[11px] uppercase tracking-wider text-ich-neutral/70">Payment status</span>
          {b.payment_status
            ? <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${paymentPill[b.payment_status] || paymentPill.unpaid}`}>{b.payment_status}</span>
            : <span className="text-sm text-ich-neutral">—</span>}
        </div>
      </div>

      {/* Documents & sharing */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mb-6">
        <h2 className="text-sm font-semibold text-ich-primary mb-4">Documents & sharing</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={printVoucher} className="inline-flex items-center gap-1.5 text-sm font-medium text-ich-primary bg-ich-primary/5 hover:bg-ich-primary/10 px-3.5 py-2 rounded-xl transition-colors"><Printer className="w-4 h-4" /> Print voucher (PDF)</button>
          <button onClick={printReceipt} className="inline-flex items-center gap-1.5 text-sm font-medium text-ich-primary bg-ich-primary/5 hover:bg-ich-primary/10 px-3.5 py-2 rounded-xl transition-colors"><ReceiptText className="w-4 h-4" /> Export receipt</button>
          <button onClick={printQuotation} className="inline-flex items-center gap-1.5 text-sm font-medium text-ich-primary bg-ich-primary/5 hover:bg-ich-primary/10 px-3.5 py-2 rounded-xl transition-colors"><FileText className="w-4 h-4" /> Export quotation</button>
          <button onClick={sendWhatsApp} className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/15 px-3.5 py-2 rounded-xl transition-colors"><MessageCircle className="w-4 h-4" /> Send confirmation via WhatsApp</button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6">
        <h2 className="text-sm font-semibold text-ich-primary mb-4">Actions</h2>
        {!canEdit && !canDelete ? (
          <p className="text-sm text-ich-neutral/60">You have read-only access.</p>
        ) : (
          <div className="space-y-4">
            {canEdit && (
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-ich-neutral/70 mb-1.5">Status</label>
                <SearchableSelect
                  value={b.status}
                  onChange={(v) => updateStatus(v)}
                  options={BOOKING_STATUSES.map((s) => ({ value: s, label: cap(s) }))}
                  ariaLabel="Status"
                  className="max-w-xs"
                />
              </div>
            )}

            {canEdit && b.status !== "cancelled" && (
              cancelOpen ? (
                <div className="rounded-xl border border-ich-primary/10 bg-ich-primary/[0.02] p-4 max-w-md">
                  <p className="text-sm font-medium text-ich-primary mb-3">Cancel & refund</p>
                  <label className="block text-[11px] uppercase tracking-wider text-ich-neutral/70 mb-1">Refund amount (IDR)</label>
                  <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="dash-input mb-3" placeholder={String(price)} />
                  <label className="block text-[11px] uppercase tracking-wider text-ich-neutral/70 mb-1">Reason</label>
                  <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="dash-input mb-3" placeholder="Customer requested / supplier issue…" />
                  <div className="flex gap-2">
                    <button onClick={cancelBooking} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl"><Ban className="w-4 h-4" /> Confirm cancellation</button>
                    <button onClick={() => setCancelOpen(false)} className="text-sm font-medium text-ich-neutral hover:bg-ich-primary/5 px-4 py-2 rounded-xl">Keep booking</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setRefundAmount(String(price)); setCancelOpen(true); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"><Ban className="w-4 h-4" /> Cancel & refund</button>
              )
            )}

            {canDelete && (
              <button onClick={remove} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /> Delete booking</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
