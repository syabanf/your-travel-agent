import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import DateTimePicker from "../components/DateTimePicker";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";
import { Star, Check, Loader2, MessageCircle, ChevronRight, CalendarDays } from "lucide-react";
import moment from "moment";
import PaymentMethodPicker from "@/components/PaymentMethodPicker";

const TIME_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];

export default function ConsultationBooking() {
  const { assistantId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pkgIdx, setPkgIdx] = useState(Number(searchParams.get("pkg")) || 0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [method, setMethod] = useState(null);

  useEffect(() => {
    base44.entities.PersonalAssistant.filter({ id: assistantId }).then((r) => { setAssistant(r[0] || null); setLoading(false); });
  }, [assistantId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen"><div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
  );
  if (!assistant) return (
    <div className="animate-fade-in"><PageHeader title="Not found" showBack /><p className="px-6 text-sm text-mora-neutral/70">This expert is no longer available.</p></div>
  );

  const packages = assistant.packages?.length
    ? assistant.packages
    : [{ name: "1:1 Consultation", description: "Personalized travel advice", price: assistant.hourly_rate || 500000 }];
  const pkg = packages[pkgIdx] || packages[0];

  const confirm = async () => {
    if (!date || !time) { toast.error("Pick a date and time"); return; }
    if (!method) { toast.error("Select a payment method"); return; }
    setSaving(true);
    try {
      const dt = new Date(`${date}T${time}`);
      const booking = await base44.entities.Booking.create({
        type: "consultation",
        title: `Consultation with ${assistant.name}`,
        provider: assistant.name,
        check_in: isNaN(dt.getTime()) ? undefined : dt.toISOString(),
        location: assistant.specialization || "",
        price: pkg.price || 0,
        currency: "IDR",
        status: "confirmed",
        guests: 1,
        confirmation_code: "MORA-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        payment_method: method?.label,
        notes: `${pkg.name}${notes ? " · " + notes : ""}`,
        image_url: assistant.photo_url || undefined,
      });
      setConfirmed(booking);
      toast.success("Consultation booked");
    } catch {
      toast.error("Couldn't book. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (confirmed) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Booking Confirmed" showBack />
        <div className="px-6 text-center py-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-display font-bold text-mora-primary mb-1">You're booked!</h2>
          <p className="text-sm text-mora-neutral/70 mb-6">A consultation with {assistant.name} is confirmed.</p>

          <GlassCard className="p-4 text-left mb-6 space-y-2">
            <Row label="Expert" value={assistant.name} />
            <Row label="Package" value={pkg.name} />
            <Row label="When" value={`${moment(date).format("MMM D, YYYY")} · ${time}`} />
            <Row label="Total" value={formatIDR(pkg.price || 0)} accent />
            {method && <Row label="Paid with" value={method.label} />}
            {confirmed.confirmation_code && <Row label="Code" value={confirmed.confirmation_code} />}
          </GlassCard>

          <button onClick={() => navigate(`/booking/${confirmed.id}`)} className="w-full py-3.5 btn-primary rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 mb-3">
            View booking <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/assistant")} className="w-full py-3.5 glass-light rounded-2xl text-sm font-medium text-mora-primary hover:bg-mora-primary/5 transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Book Consultation" subtitle={assistant.name} showBack />

      <div className="px-6 space-y-5">
        {/* Expert */}
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-mora-gold/10">
            {assistant.photo_url
              ? <img src={assistant.photo_url} alt={assistant.name} onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xl font-display text-gold">{assistant.name?.[0]}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-mora-primary truncate">{assistant.name}</h3>
            <p className="text-xs text-mora-neutral/60 truncate">{assistant.specialization}</p>
            {assistant.rating && <span className="flex items-center gap-1 text-xs text-gold mt-0.5"><Star className="w-3 h-3 fill-current" /> {assistant.rating}</span>}
          </div>
        </GlassCard>

        {/* Package */}
        <div>
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2 block">Choose a package</label>
          <div className="space-y-2.5">
            {packages.map((p, i) => {
              const active = i === pkgIdx;
              return (
                <button key={i} onClick={() => setPkgIdx(i)} className={`w-full text-left rounded-2xl p-4 border transition-all flex items-start gap-3 ${active ? "glass-gold border-gold" : "glass-light border-transparent"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? "border-gold bg-mora-gold/20" : "border-mora-neutral/30"}`}>
                    {active && <div className="w-2 h-2 rounded-full bg-gold" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-mora-primary min-w-0 truncate">{p.name}</p>
                      {p.price ? <span className="stat-value text-sm font-display font-semibold text-gold flex-shrink-0">{formatIDR(p.price)}</span> : null}
                    </div>
                    {p.description && <p className="text-xs text-mora-neutral/60 mt-0.5">{p.description}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <GlassCard className="p-4">
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2 block">Date</label>
          <DateTimePicker type="date" value={date} onChange={setDate} label="Consultation date" />
        </GlassCard>

        {/* Time */}
        <div>
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2 block">Time</label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((t) => (
              <button key={t} onClick={() => setTime(t)} className={`py-2.5 rounded-xl text-xs font-medium transition-all ${time === t ? "glass-gold text-gold" : "glass-light text-mora-neutral/70"}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <GlassCard className="p-4">
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2 block">What would you like help with?</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. a 10-day honeymoon in Japan…" rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-mora-white placeholder:text-mora-neutral/40 outline-none resize-none" />
        </GlassCard>

        {/* Payment method */}
        <div>
          <label className="text-[10px] text-gold uppercase tracking-widest mb-2 block">Payment method</label>
          <PaymentMethodPicker value={method} onChange={setMethod} />
        </div>

        {/* Summary + confirm */}
        <GlassCard className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-mora-neutral min-w-0">
            <CalendarDays className="w-4 h-4 text-gold flex-shrink-0" />
            <span className="truncate">{date && time ? `${moment(date).format("MMM D")} · ${time}` : "Select date & time"}</span>
          </div>
          <span className="stat-value text-lg font-display font-bold text-gold flex-shrink-0">{formatIDR(pkg.price || 0)}</span>
        </GlassCard>

        <button onClick={confirm} disabled={saving || !date || !time || !method} className="w-full py-4 btn-primary rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          {saving ? "Booking…" : `Confirm consultation · ${formatIDR(pkg.price || 0)}`}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-mora-neutral/60 flex-shrink-0">{label}</span>
      <span className={`stat-value text-sm font-medium text-right ${accent ? "text-gold font-display font-bold" : "text-mora-primary"}`}>{value}</span>
    </div>
  );
}
