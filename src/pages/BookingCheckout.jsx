import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { Input } from "@/components/ui/input";
import { CheckCircle, CreditCard, User, FileText, ChevronRight, ChevronLeft, Loader2, Lock, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/currency";
import moment from "moment";
import PaymentMethodPicker from "@/components/PaymentMethodPicker";
import { dpOptions, minDpPercent } from "@/data/packageCategories";
import { amountForPercent, derivedPaymentStatus } from "@/lib/payments";
import { currentEmail } from "@/lib/featureAccess";

const steps = [
  { id: 1, label: "Review", icon: FileText },
  { id: 2, label: "Details", icon: User },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Done", icon: CheckCircle },
];

const GUEST_FIELDS = { full_name: "full name", email: "email", phone: "phone number" };
const CARD_FIELDS = { card_number: "card number", card_name: "cardholder name", expiry: "expiry date", cvv: "CVV" };

// "a", "a and b", "a, b and c"
const listPhrase = (items) =>
  items.length < 2 ? (items[0] || "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/* --------- checkout progress, parked in sessionStorage per booking --------- */
// Card details are deliberately never persisted.

const progressKey = (bookingId) => `checkout:${bookingId}`;

function readProgress(bookingId) {
  try {
    const raw = window.sessionStorage.getItem(progressKey(bookingId));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function BookingCheckout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [step, setStep] = useState(() => {
    const saved = Number(readProgress(bookingId)?.step);
    // Step 4 is never restored — it belongs to a booking that is already paid.
    return saved >= 1 && saved <= 3 ? saved : 1;
  });
  const [processing, setProcessing] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [method, setMethod] = useState(null);
  const [errors, setErrors] = useState({});
  const [travelers, setTravelers] = useState([]);
  // Down-payment percentage. The package sets the floor; 100 means paying in full.
  const [payPercent, setPayPercent] = useState(100);
  const [pkg, setPkg] = useState(null);
  const fieldRefs = useRef({});

  const [guestInfo, setGuestInfo] = useState(() => {
    const saved = readProgress(bookingId)?.guestInfo;
    return {
      full_name: saved?.full_name || "",
      email: saved?.email || "",
      phone: saved?.phone || "",
      special_request: saved?.special_request || "",
    };
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
      if (!results.length) return;
      setBooking(results[0]);
      // Only package bookings carry an instalment plan; everything else is
      // paid in full, so we don't offer a choice that doesn't exist.
      if (results[0].package_id) {
        try {
          setPkg(await base44.entities.TourPackage.get(results[0].package_id));
        } catch {
          /* package removed — fall back to the default minimum */
        }
      }
    };
    load();
  }, [bookingId]);

  // Prefill from the signed-in user, but never over something already typed
  // (or restored from a reload).
  useEffect(() => {
    let cancelled = false;
    base44.auth
      .me()
      .then((me) => {
        if (cancelled || !me) return;
        setGuestInfo((p) => ({
          ...p,
          full_name: p.full_name || me.full_name || "",
          email: p.email || me.email || "",
          phone: p.phone || me.phone || "",
        }));
      })
      .catch(() => {
        /* no session — the guest just fills the form in by hand */
      });
    return () => { cancelled = true; };
  }, []);

  // Saved travellers give one-tap fill.
  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("ich_travelers") || "[]");
      if (Array.isArray(parsed)) setTravelers(parsed.filter((t) => t && t.name));
    } catch {
      /* saved travellers are a convenience — ignore unreadable storage */
    }
  }, []);

  // Keep step + guest info across a reload; drop it once the booking is paid.
  useEffect(() => {
    if (step >= 4) return;
    try {
      window.sessionStorage.setItem(progressKey(bookingId), JSON.stringify({ step, guestInfo }));
    } catch {
      /* storage full or blocked — progress simply won't survive a reload */
    }
  }, [bookingId, step, guestInfo]);

  const clearProgress = () => {
    try {
      window.sessionStorage.removeItem(progressKey(bookingId));
    } catch {
      /* ignore */
    }
  };

  const setFieldRef = (name) => (el) => { fieldRefs.current[name] = el; };
  const focusField = (name) => {
    try { fieldRefs.current[name]?.focus(); } catch { /* ignore */ }
  };
  const clearError = (k) => setErrors(p => (p[k] ? { ...p, [k]: false } : p));

  const updateGuest = (k, v) => { setGuestInfo(p => ({ ...p, [k]: v })); clearError(k); };
  const updatePayment = (k, v) => { setPaymentInfo(p => ({ ...p, [k]: v })); clearError(k); };
  const chooseMethod = (m) => { setMethod(m); clearError("method"); };

  const applyTraveler = (t) => {
    setGuestInfo(p => ({
      ...p,
      full_name: t.name || p.full_name,
      email: t.email || p.email,
      phone: t.phone || p.phone,
    }));
    setErrors({});
  };

  // Flags the missing fields, says what's missing and puts the cursor on the
  // first one. Returns true when everything required is filled in.
  const requireFields = (labels, values) => {
    const missing = Object.keys(labels).filter(k => !values[k]);
    if (!missing.length) return true;
    setErrors(Object.fromEntries(missing.map(k => [k, true])));
    toast.error(`Please fill in your ${listPhrase(missing.map(k => labels[k]))}`);
    focusField(missing[0]);
    return false;
  };

  const fieldClass = (name) =>
    `bg-white/5 text-ich-white placeholder:text-ich-neutral/30 rounded-xl h-11 ${
      errors[name] ? "border-red-500/70 focus-visible:ring-red-500/50" : "border-white/10"
    }`;

  const handleBack = () => {
    // Steps 2–3 rewind inside the flow instead of throwing the guest out of it.
    if (step > 1 && step < 4) { setStep(s => s - 1); return; }
    // Step 4 is the terminal receipt — stepping back would re-open payment for
    // an already-paid booking, so leave the flow instead.
    if (step === 4) { navigate("/booking"); return; }
    navigate(-1);
  };

  const formatCard = (val) => {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 2) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  };

  // Instalment options are only meaningful for packages; a flight or a hotel
  // room is charged in full.
  const total = booking?.price || 0;
  const alreadyPaid = booking?.paid_amount || 0;
  const outstanding = Math.max(0, total - alreadyPaid);
  // The plan is chosen at the *first* payment. Coming back to a part-paid
  // booking means settling the balance — offering "30% down" again would
  // re-charge a slice of money that's already in.
  const plans = booking?.package_id && !booking?.feature_key && alreadyPaid === 0 ? dpOptions(pkg) : [];
  const amountDue = plans.length ? amountForPercent(total, payPercent) : outstanding;
  const remaining = Math.max(0, total - alreadyPaid - amountDue);

  const handleProceedToPayment = () => {
    if (!requireFields(GUEST_FIELDS, guestInfo)) return;
    setErrors({});
    setStep(3);
  };

  const handleConfirmPayment = async () => {
    if (processing) return;
    if (!method) {
      setErrors({ method: true });
      toast.error("Please choose a payment method");
      return;
    }
    if (method.isNewCard && !requireFields(CARD_FIELDS, paymentInfo)) return;
    setErrors({});
    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 2000)); // simulate processing
      // Short, scannable booking reference — a full brand name reads wrong here.
      const code = "ICH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const paid = alreadyPaid + amountDue;
      // Derive the status from the money rather than setting it by hand, so the
      // badge, the balance and any trip lock can never disagree.
      const paidPatch = {
        paid_amount: paid,
        payment_plan: paid < total ? "dp" : "full",
        dp_percent: payPercent,
        balance_due_date: paid < total ? moment().add(14, "days").format("YYYY-MM-DD") : null,
      };
      await base44.entities.Booking.update(bookingId, {
        status: "confirmed",
        confirmation_code: code,
        payment_method: method?.label || "Card",
        ...paidPatch,
        payment_status: derivedPaymentStatus({ ...booking, ...paidPatch, status: "confirmed" }),
        notes: (booking.notes || "") + `\nGuest: ${guestInfo.full_name} | ${guestInfo.email} | ${guestInfo.phone}${guestInfo.special_request ? "\nRequest: " + guestInfo.special_request : ""}`,
      });
      // Paying for a package turns it into a real trip in My Trips. It's
      // created gated: `tripAccess` opens it as soon as the balance clears, so
      // a deposit still gets the traveller something to look at.
      if (pkg && !booking.trip_id) await createTripFromPackage(code, paid >= total);
      // Paid add-ons (Virtual Guiding, AI itinerary) unlock on full payment only
      // — a deposit on a one-off service doesn't make sense.
      if (booking.feature_key && paid >= total) {
        try {
          await base44.entities.FeatureAccess.create({
            feature: booking.feature_key,
            user_email: currentEmail(),
            status: "active",
            booking_id: bookingId,
            granted_date: new Date().toISOString(),
          });
        } catch {
          /* payment succeeded; the grant is retried by re-opening the unlock page */
        }
      }
      clearProgress();
      setConfirmCode(code);
      setStep(4);
    } catch {
      toast.error("Payment couldn't be processed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const createTripFromPackage = async (code, fullyPaid) => {
    try {
      const start = booking.check_in ? moment(booking.check_in) : moment().add(30, "days");
      const trip = await base44.entities.Trip.create({
        title: pkg.title,
        destination: pkg.destination || booking.location || "",
        cover_image: pkg.image || "",
        start_date: start.format("YYYY-MM-DD"),
        end_date: start.clone().add(Math.max(1, pkg.duration_days || 1) - 1, "days").format("YYYY-MM-DD"),
        status: "planned",
        travelers: booking.guests || 1,
        adults: booking.guests || 1,
        children: 0,
        budget_total: total,
        budget_currency: "IDR",
        lead_traveler: guestInfo.full_name,
        notes: `Booked from package ${pkg.title} (${code}).`,
        special_requests: guestInfo.special_request || "",
        package_id: pkg.id,
        booking_id: bookingId,
        locked_until_paid: true,
      });
      await base44.entities.Booking.update(bookingId, { trip_id: trip.id });

      // Seed the day-by-day plan from the package. This is exactly what stays
      // hidden behind the lock until the balance is settled.
      for (const day of pkg.itinerary || []) {
        await base44.entities.ItineraryItem.create({
          trip_id: trip.id,
          day_number: day.day || 1,
          activity_name: day.title || `Day ${day.day || 1}`,
          description: day.detail || "",
          location: pkg.destination || "",
          category: "activity",
          booking_status: "confirmed",
          sort_order: day.day || 1,
        });
      }
      if (fullyPaid) toast.success("Trip unlocked — your full itinerary is ready");
    } catch {
      // The payment already went through; a missing trip is recoverable and
      // must not surface as a failed checkout.
    }
  };

  if (!booking) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Local header — the back control is step-aware, which the shared
          PageHeader (always navigate(-1)) can't express. */}
      <div className="flex items-center justify-between px-6 pt-4 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            aria-label={step > 1 && step < 4 ? "Back one step" : "Go back"}
            className="w-10 h-10 glass-light shadow-soft rounded-full flex items-center justify-center text-ich-primary hover:text-gold press-spring shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[22px] leading-tight tracking-tight font-display font-bold text-ich-primary truncate">Checkout</h1>
            <p className="text-sm text-ich-neutral mt-0.5 truncate">{booking.title}</p>
          </div>
        </div>
      </div>

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
                    active ? "glass-gold border border-ich-gold/40" :
                    "glass-light border border-white/10"
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${done ? "text-emerald-600" : active ? "text-gold" : "text-ich-neutral/30"}`} />
                  </div>
                  <span className={`text-[9px] mt-1 ${active ? "text-gold" : done ? "text-emerald-600" : "text-ich-neutral/30"}`}>{s.label}</span>
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
              <p className="text-base font-display font-bold text-ich-white mb-1">{booking.title}</p>
              {booking.provider && <p className="text-xs text-ich-neutral/60 mb-2">{booking.provider}</p>}
              {booking.location && <p className="text-xs text-ich-neutral/60 mb-2">📍 {booking.location}</p>}
              {booking.check_in && (
                <p className="text-xs text-ich-neutral/60 mb-2">
                  📅 {moment(booking.check_in).format("MMM D, YYYY")}
                  {booking.check_out && ` → ${moment(booking.check_out).format("MMM D, YYYY")}`}
                </p>
              )}
              {booking.guests > 0 && <p className="text-xs text-ich-neutral/60 mb-2">👥 {booking.guests} guest(s)</p>}
              {booking.notes && <p className="text-xs text-ich-neutral/50 mt-2 border-t border-white/5 pt-2">{booking.notes}</p>}
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ich-neutral/70 shrink-0">Total Price</span>
                <span className="stat-value text-lg font-display font-bold text-gold text-right">{formatIDR(total)}</span>
              </div>
              {alreadyPaid > 0 ? (
                <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-ich-neutral/50">Already paid</span>
                    <span className="text-xs text-emerald-600">{formatIDR(alreadyPaid)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-ich-neutral/50">Balance to settle</span>
                    <span className="text-xs text-gold font-medium">{formatIDR(outstanding)}</span>
                  </div>
                </div>
              ) : booking.package_id ? (
                <p className="text-[11px] text-ich-neutral/60 mt-2 pt-2 border-t border-white/5 leading-relaxed">
                  Pay in full, or start from {minDpPercent(pkg)}% down — {formatIDR(amountForPercent(total, minDpPercent(pkg)))}.
                </p>
              ) : null}
            </GlassCard>

            <button onClick={() => setStep(2)} className="w-full py-3.5 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Step 2: Guest Info */}
        {step === 2 && (
          <>
            {travelers.length > 0 && (
              <div>
                <p className="text-[10px] text-ich-neutral/50 mb-2">Fill from a saved traveller</p>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
                  {travelers.map((t, i) => (
                    <button
                      key={t.id || `${t.name}-${i}`}
                      type="button"
                      onClick={() => applyTraveler(t)}
                      className="px-3.5 py-2 rounded-full glass-light text-xs font-medium text-ich-neutral hover:text-gold whitespace-nowrap shrink-0 press-spring transition-colors"
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <GlassCard className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-1">Guest Information</h3>
              <div>
                <label className="text-[10px] text-ich-neutral/50 mb-1 block">Full Name *</label>
                <Input ref={setFieldRef("full_name")} value={guestInfo.full_name} onChange={e => updateGuest("full_name", e.target.value)}
                  placeholder="As on ID/passport"
                  aria-invalid={errors.full_name ? "true" : undefined}
                  className={fieldClass("full_name")} />
              </div>
              <div>
                <label className="text-[10px] text-ich-neutral/50 mb-1 block">Email *</label>
                <Input ref={setFieldRef("email")} type="email" value={guestInfo.email} onChange={e => updateGuest("email", e.target.value)}
                  placeholder="your@email.com"
                  aria-invalid={errors.email ? "true" : undefined}
                  className={fieldClass("email")} />
              </div>
              <div>
                <label className="text-[10px] text-ich-neutral/50 mb-1 block">Phone Number *</label>
                <Input ref={setFieldRef("phone")} type="tel" value={guestInfo.phone} onChange={e => updateGuest("phone", e.target.value)}
                  placeholder="+62 812 xxxx xxxx"
                  aria-invalid={errors.phone ? "true" : undefined}
                  className={fieldClass("phone")} />
              </div>
              <div>
                <label className="text-[10px] text-ich-neutral/50 mb-1 block">Special Request</label>
                <Input value={guestInfo.special_request} onChange={e => updateGuest("special_request", e.target.value)}
                  placeholder="Dietary needs, accessibility, etc."
                  className="bg-white/5 border-white/10 text-ich-white placeholder:text-ich-neutral/30 rounded-xl h-11" />
              </div>
            </GlassCard>

            <button
              onClick={handleProceedToPayment}
              aria-disabled={!guestInfo.full_name || !guestInfo.email || !guestInfo.phone}
              className="w-full py-3.5 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all aria-disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Proceed to Payment <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <>
            {plans.length > 0 && (
              <GlassCard className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-gold" />
                  <h3 className="text-xs font-semibold text-gold uppercase tracking-widest">Payment plan</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((p) => {
                    const selected = payPercent === p.percent;
                    return (
                      <button
                        key={p.percent}
                        type="button"
                        onClick={() => setPayPercent(p.percent)}
                        aria-pressed={selected}
                        className={`rounded-xl px-3 py-2.5 text-left press-spring transition-all border ${
                          selected
                            ? "glass-gold border-ich-gold/40 text-gold"
                            : "glass-light border-white/10 text-ich-neutral hover:text-ich-primary"
                        }`}
                      >
                        <span className="block text-xs font-semibold">{p.label}</span>
                        <span className="block text-[11px] opacity-70 mt-0.5">
                          {formatIDR(amountForPercent(total, p.percent))}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-ich-neutral/60 leading-relaxed">
                  {remaining > 0
                    ? `Minimum down payment for this package is ${minDpPercent(pkg)}%. The remaining ${formatIDR(remaining)} is due 14 days after booking — your trip detail unlocks once it's settled.`
                    : "Paying in full unlocks your full trip itinerary straight away."}
                </p>
              </GlassCard>
            )}

            <GlassCard className={`p-4 space-y-3 ${errors.method ? "border !border-red-500/70" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3.5 h-3.5 text-gold" />
                <h3 className="text-xs font-semibold text-gold uppercase tracking-widest">Payment method</h3>
              </div>
              <PaymentMethodPicker value={method} onChange={chooseMethod} />
            </GlassCard>

            {method?.isNewCard && (
              <GlassCard className="p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-1">Card details</h3>
                <div>
                  <label className="text-[10px] text-ich-neutral/50 mb-1 block">Card Number</label>
                  <Input
                    ref={setFieldRef("card_number")}
                    value={paymentInfo.card_number}
                    onChange={e => updatePayment("card_number", formatCard(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    aria-invalid={errors.card_number ? "true" : undefined}
                    className={`${fieldClass("card_number")} tracking-widest`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-ich-neutral/50 mb-1 block">Cardholder Name</label>
                  <Input
                    ref={setFieldRef("card_name")}
                    value={paymentInfo.card_name}
                    onChange={e => updatePayment("card_name", e.target.value)}
                    placeholder="Name on card"
                    aria-invalid={errors.card_name ? "true" : undefined}
                    className={fieldClass("card_name")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-ich-neutral/50 mb-1 block">Expiry Date</label>
                    <Input
                      ref={setFieldRef("expiry")}
                      value={paymentInfo.expiry}
                      onChange={e => updatePayment("expiry", formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      aria-invalid={errors.expiry ? "true" : undefined}
                      className={fieldClass("expiry")}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-ich-neutral/50 mb-1 block">CVV</label>
                    <Input
                      ref={setFieldRef("cvv")}
                      value={paymentInfo.cvv}
                      onChange={e => updatePayment("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="• • •"
                      type="password"
                      aria-invalid={errors.cvv ? "true" : undefined}
                      className={fieldClass("cvv")}
                    />
                  </div>
                </div>
              </GlassCard>
            )}

            {method && !method.isNewCard && (
              <GlassCard className="p-4">
                <p className="text-xs text-ich-neutral/70">
                  {method.type === "bank"
                    ? "A virtual-account number will be issued to complete your transfer."
                    : `You'll be redirected to ${method.label} to approve the payment.`}
                  <span className="text-ich-neutral/50"> Payment is simulated in this demo.</span>
                </p>
              </GlassCard>
            )}

            <GlassCard className="p-4 space-y-2">
              {(remaining > 0 || alreadyPaid > 0) && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-ich-neutral/50 shrink-0">Package total</span>
                  <span className="text-xs text-ich-neutral/70 text-right">{formatIDR(total)}</span>
                </div>
              )}
              {alreadyPaid > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-ich-neutral/50 shrink-0">Already paid</span>
                  <span className="text-xs text-emerald-600 text-right">−{formatIDR(alreadyPaid)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ich-neutral/70 shrink-0">
                  {remaining > 0 ? `Pay now (${payPercent}%)` : alreadyPaid > 0 ? "Balance due now" : "Total Charge"}
                </span>
                <span className="stat-value text-lg font-display font-bold text-gold text-right">{formatIDR(amountDue)}</span>
              </div>
              {remaining > 0 && (
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                  <span className="text-xs text-ich-neutral/50 shrink-0">Balance due later</span>
                  <span className="text-xs text-ich-neutral/70 text-right">{formatIDR(remaining)}</span>
                </div>
              )}
            </GlassCard>

            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              aria-disabled={!method || (method.isNewCard && (!paymentInfo.card_number || !paymentInfo.card_name || !paymentInfo.expiry || !paymentInfo.cvv))}
              className="w-full py-4 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all disabled:opacity-40 aria-disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Lock className="w-4 h-4" /> Confirm & Pay {formatIDR(amountDue)}</>}
            </button>
          </>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-display font-bold text-ich-white mb-2">Booking Confirmed!</h2>
            <p className="text-sm text-ich-neutral/60 mb-6">
              {remaining > 0
                ? `Your deposit is in. ${formatIDR(remaining)} remains — settle it to unlock your full trip detail.`
                : "Your booking has been successfully confirmed and saved."}
            </p>

            <GlassCard className="p-4 text-left mb-6">
              <p className="text-xs text-ich-neutral/50 mb-1">Confirmation Code</p>
              <p className="text-lg font-display font-bold text-gold tracking-widest">{confirmCode}</p>
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                <p className="text-xs text-ich-neutral/60">{booking.title}</p>
                <p className="text-xs text-ich-neutral/50">{guestInfo.full_name} · {guestInfo.email}</p>
                {method && <p className="text-xs text-ich-neutral/50">Paid with {method.label}</p>}
              </div>
              {remaining > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-ich-neutral/50">Paid today</span>
                    <span className="text-xs text-emerald-600 font-medium">{formatIDR(amountDue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-ich-neutral/50">Balance due</span>
                    <span className="text-xs text-gold font-medium">{formatIDR(remaining)}</span>
                  </div>
                  <p className="text-[10px] text-ich-neutral/40 pt-1">
                    Due by {moment().add(14, "days").format("MMM D, YYYY")}
                  </p>
                </div>
              )}
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
