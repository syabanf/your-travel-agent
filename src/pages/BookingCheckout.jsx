import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Input } from "@/components/ui/input";
import { CheckCircle, CreditCard, User, FileText, ChevronRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/currency";
import moment from "moment";
import PaymentMethodPicker from "@/components/PaymentMethodPicker";

const steps = [
  { id: 1, label: "Review", icon: FileText },
  { id: 2, label: "Details", icon: User },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Done", icon: CheckCircle },
];

export default function BookingCheckout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [method, setMethod] = useState(null);

  const [guestInfo, setGuestInfo] = useState({
    full_name: "",
    email: "",
    phone: "",
    special_request: "",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    card_number: "",
    card_name: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    const load = async () => {
      const results = await base44.entities.Booking.filter({ id: bookingId });
      if (results.length > 0) setBooking(results[0]);
    };
    load();
  }, [bookingId]);

  const updateGuest = (k, v) => setGuestInfo(p => ({ ...p, [k]: v }));
  const updatePayment = (k, v) => setPaymentInfo(p => ({ ...p, [k]: v }));

  const formatCard = (val) => {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 2) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 2000)); // simulate processing
      // Short, scannable booking reference — a full brand name reads wrong here.
      const code = "ICH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await base44.entities.Booking.update(bookingId, {
        status: "confirmed",
        confirmation_code: code,
        payment_method: method?.label || "Card",
        notes: (booking.notes || "") + `\nGuest: ${guestInfo.full_name} | ${guestInfo.email} | ${guestInfo.phone}${guestInfo.special_request ? "\nRequest: " + guestInfo.special_request : ""}`,
      });
      setConfirmCode(code);
      setStep(4);
    } catch {
      toast.error("Payment couldn't be processed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!booking) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader title="Checkout" subtitle={booking.title} showBack />

      {/* Step indicator */}
      <div className="px-6 mb-5">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    done ? "bg-emerald-500/20 border border-emerald-500/40" :
                    active ? "glass-gold border border-mora-gold/40" :
                    "glass-light border border-white/10"
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${done ? "text-emerald-600" : active ? "text-gold" : "text-mora-neutral/30"}`} />
                  </div>
                  <span className={`text-[9px] mt-1 ${active ? "text-gold" : done ? "text-emerald-600" : "text-mora-neutral/30"}`}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 ${step > s.id ? "bg-emerald-500/30" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 space-y-4 pb-28">

        {/* Step 1: Review */}
        {step === 1 && (
          <>
            <GlassCard className="p-4">
              <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-3">Booking Summary</h3>
              <p className="text-base font-display font-bold text-mora-white mb-1">{booking.title}</p>
              {booking.provider && <p className="text-xs text-mora-neutral/60 mb-2">{booking.provider}</p>}
              {booking.location && <p className="text-xs text-mora-neutral/60 mb-2">📍 {booking.location}</p>}
              {booking.check_in && (
                <p className="text-xs text-mora-neutral/60 mb-2">
                  📅 {moment(booking.check_in).format("MMM D, YYYY")}
                  {booking.check_out && ` → ${moment(booking.check_out).format("MMM D, YYYY")}`}
                </p>
              )}
              {booking.guests > 0 && <p className="text-xs text-mora-neutral/60 mb-2">👥 {booking.guests} guest(s)</p>}
              {booking.notes && <p className="text-xs text-mora-neutral/50 mt-2 border-t border-white/5 pt-2">{booking.notes}</p>}
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-mora-neutral/70 shrink-0">Total Price</span>
                <span className="stat-value text-lg font-display font-bold text-gold text-right">{formatIDR(booking.price || 0)}</span>
              </div>
            </GlassCard>

            <button onClick={() => setStep(2)} className="w-full py-3.5 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Step 2: Guest Info */}
        {step === 2 && (
          <>
            <GlassCard className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-1">Guest Information</h3>
              <div>
                <label className="text-[10px] text-mora-neutral/50 mb-1 block">Full Name *</label>
                <Input value={guestInfo.full_name} onChange={e => updateGuest("full_name", e.target.value)}
                  placeholder="As on ID/passport"
                  className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-[10px] text-mora-neutral/50 mb-1 block">Email *</label>
                <Input type="email" value={guestInfo.email} onChange={e => updateGuest("email", e.target.value)}
                  placeholder="your@email.com"
                  className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-[10px] text-mora-neutral/50 mb-1 block">Phone Number *</label>
                <Input type="tel" value={guestInfo.phone} onChange={e => updateGuest("phone", e.target.value)}
                  placeholder="+62 812 xxxx xxxx"
                  className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11" />
              </div>
              <div>
                <label className="text-[10px] text-mora-neutral/50 mb-1 block">Special Request</label>
                <Input value={guestInfo.special_request} onChange={e => updateGuest("special_request", e.target.value)}
                  placeholder="Dietary needs, accessibility, etc."
                  className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11" />
              </div>
            </GlassCard>

            <button
              onClick={() => setStep(3)}
              disabled={!guestInfo.full_name || !guestInfo.email || !guestInfo.phone}
              className="w-full py-3.5 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Proceed to Payment <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <>
            <GlassCard className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3.5 h-3.5 text-gold" />
                <h3 className="text-xs font-semibold text-gold uppercase tracking-widest">Payment method</h3>
              </div>
              <PaymentMethodPicker value={method} onChange={setMethod} />
            </GlassCard>

            {method?.isNewCard && (
              <GlassCard className="p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-1">Card details</h3>
                <div>
                  <label className="text-[10px] text-mora-neutral/50 mb-1 block">Card Number</label>
                  <Input
                    value={paymentInfo.card_number}
                    onChange={e => updatePayment("card_number", formatCard(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11 tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-mora-neutral/50 mb-1 block">Cardholder Name</label>
                  <Input
                    value={paymentInfo.card_name}
                    onChange={e => updatePayment("card_name", e.target.value)}
                    placeholder="Name on card"
                    className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-mora-neutral/50 mb-1 block">Expiry Date</label>
                    <Input
                      value={paymentInfo.expiry}
                      onChange={e => updatePayment("expiry", formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-mora-neutral/50 mb-1 block">CVV</label>
                    <Input
                      value={paymentInfo.cvv}
                      onChange={e => updatePayment("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="• • •"
                      type="password"
                      className="bg-white/5 border-white/10 text-mora-white placeholder:text-mora-neutral/30 rounded-xl h-11"
                    />
                  </div>
                </div>
              </GlassCard>
            )}

            {method && !method.isNewCard && (
              <GlassCard className="p-4">
                <p className="text-xs text-mora-neutral/70">
                  {method.type === "bank"
                    ? "A virtual-account number will be issued to complete your transfer."
                    : `You'll be redirected to ${method.label} to approve the payment.`}
                  <span className="text-mora-neutral/50"> Payment is simulated in this demo.</span>
                </p>
              </GlassCard>
            )}

            <GlassCard className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-mora-neutral/70 shrink-0">Total Charge</span>
                <span className="stat-value text-lg font-display font-bold text-gold text-right">{formatIDR(booking.price || 0)}</span>
              </div>
            </GlassCard>

            <button
              onClick={handleConfirmPayment}
              disabled={processing || !method || (method.isNewCard && (!paymentInfo.card_number || !paymentInfo.card_name || !paymentInfo.expiry || !paymentInfo.cvv))}
              className="w-full py-4 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Confirm & Pay {formatIDR(booking.price || 0)}</>}
            </button>
          </>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-display font-bold text-mora-white mb-2">Booking Confirmed!</h2>
            <p className="text-sm text-mora-neutral/60 mb-6">Your booking has been successfully confirmed and saved.</p>

            <GlassCard className="p-4 text-left mb-6">
              <p className="text-xs text-mora-neutral/50 mb-1">Confirmation Code</p>
              <p className="text-lg font-display font-bold text-gold tracking-widest">{confirmCode}</p>
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                <p className="text-xs text-mora-neutral/60">{booking.title}</p>
                <p className="text-xs text-mora-neutral/50">{guestInfo.full_name} · {guestInfo.email}</p>
                {method && <p className="text-xs text-mora-neutral/50">Paid with {method.label}</p>}
              </div>
            </GlassCard>

            <button onClick={() => navigate("/booking")} className="w-full py-3.5 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all">
              Back to My Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}