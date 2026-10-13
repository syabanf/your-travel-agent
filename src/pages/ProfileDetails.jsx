import { useEffect, useState } from "react";
import { Info, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import DateTimePicker from "@/components/DateTimePicker";
import { backend } from "@/api/backend";

const FIELDS = [
  ["full_name", "Full name", "As on your ID or passport", "name"],
  ["phone", "Phone / WhatsApp", "+62 812 3456 7890", "tel"],
  ["city", "City", "Jakarta", "address-level2"],
  ["country", "Country", "Indonesia", "country-name"],
];

const INPUT = "h-12 w-full rounded-2xl border border-border bg-card px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/30 md:text-sm";

/** The account's own details. Checkout and other forms prefill from these. */
export default function ProfileDetails() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    backend.auth.me().then((me) => setForm({
      full_name: me.full_name || "", email: me.email || "", phone: me.phone || "",
      city: me.city || "", country: me.country || "", date_of_birth: me.date_of_birth || "",
    }));
  }, []);

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error("Enter your full name"); return; }
    setSaving(true);
    try {
      const { email: _email, ...details } = form;
      await backend.auth.updateMe(Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()])));
      toast.success("Personal details saved", { description: "Forms now fill these in for you." });
    } catch {
      toast.error("Your details weren't saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Personal details" subtitle="Used to fill in your bookings" showBack />
      {!form ? <div className="mx-5 skeleton h-80" /> : (
        <form onSubmit={save} className="space-y-4 px-5" noValidate>
          <p className="flex items-start gap-2 rounded-2xl bg-info-soft px-4 py-3 text-xs leading-relaxed text-info">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Checkout fills in your name, email and phone from here. You can still change them on each booking.
          </p>
          <div className="space-y-3 rounded-card bg-card p-4 shadow-card">
            <div>
              <span className="eyebrow mb-1 block">Email</span>
              <p className="flex h-12 items-center gap-2 rounded-2xl bg-surface-2 px-4 text-sm text-body">
                <Mail className="size-4 text-muted" aria-hidden="true" />{form.email}
              </p>
              <span className="mt-1 block text-xs text-muted">Your sign-in email. Contact Icon Holiday to change it.</span>
            </div>
            {FIELDS.map(([key, label, placeholder, autoComplete]) => (
              <label key={key} className="block">
                <span className="eyebrow mb-1 block">{label}{key === "full_name" ? " *" : ""}</span>
                <input value={form[key]} onChange={(e) => upd(key, e.target.value)} placeholder={placeholder} autoComplete={autoComplete} type={key === "phone" ? "tel" : "text"} className={INPUT} />
              </label>
            ))}
            <div>
              <span className="eyebrow mb-1 block">Date of birth</span>
              <DateTimePicker type="date" value={form.date_of_birth} onChange={(v) => upd("date_of_birth", v)} label="Date of birth" years={[1930, new Date().getFullYear()]} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="sheen flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-strong text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-60">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Save details
          </button>
        </form>
      )}
    </div>
  );
}
