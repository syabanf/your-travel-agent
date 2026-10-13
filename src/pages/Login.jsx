import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import {
  Mail, Lock, User, ArrowRight, Loader2, Phone, Clock, ShieldX, Eye, EyeOff,
  ShieldCheck, Wallet, Headphones, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import AppFrame from "../components/AppFrame";
import BrandMark from "../components/BrandMark";
import { submitRegistration, registrationStatus, accountProfile, REGISTRATION_MESSAGES } from "@/lib/registration";

const HERO = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80";
const DEMO = { name: "Alex Rivera", email: "traveler@iconholiday.app" };

const PERKS = [
  { icon: ShieldCheck, label: "Secure payment" },
  { icon: Wallet, label: "Flexible deposit" },
  { icon: Headphones, label: "24/7 concierge" },
];

function Field({ id, icon: Icon, label, trailing, ...input }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-body">{label}</label>
      <div className="relative">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input
          id={id}
          {...input}
          className="h-12 w-full rounded-2xl border border-border bg-surface-2 pl-11 pr-11 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50 focus:bg-card focus:ring-2 focus:ring-accent/30 md:text-sm"
        />
        {trailing}
      </div>
    </div>
  );
}

export default function Login({ register = false }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState(register ? "register" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Set once a sign-up is filed, or when sign-in is refused. Replaces the form
  // with an explanation rather than a toast the user may miss.
  const [gate, setGate] = useState(null);
  const isRegister = mode === "register";
  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e?.preventDefault();
    if (!form.email || !form.password || (isRegister && !form.name)) {
      toast.error("Please fill in all fields");
      return;
    }
    setBusy(true);
    try {
      if (isRegister) {
        // Registering files a request; it does not create a session. An admin
        // approves it in the dashboard before the account can sign in.
        const { duplicate } = await submitRegistration({
          full_name: form.name,
          email: form.email,
          phone: form.phone,
        });
        setGate({
          kind: "pending",
          message: duplicate
            ? "We already have a registration for this email. It's still waiting for approval."
            : REGISTRATION_MESSAGES.pending,
        });
        return;
      }

      const { status } = await registrationStatus(form.email);
      // `none` covers the seeded demo accounts, which were never put through the
      // queue. The gate holds new sign-ups; it doesn't lock out the demo.
      if (status === "pending" || status === "rejected") {
        setGate({ kind: status, message: REGISTRATION_MESSAGES[status] });
        return;
      }

      // Load what the account already holds, so checkout and other forms
      // open filled in with the member's own name and phone.
      const { full_name, ...details } = await accountProfile(form.email);
      login({ ...details, name: full_name || form.name || form.email.split("@")[0], email: form.email });
      toast.success("Welcome back");
      navigate("/", { replace: true });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const backToLogin = () => {
    setGate(null);
    setMode("login");
    setForm((p) => ({ ...p, password: "" }));
  };

  const guest = () => { login({ name: "Guest" }); navigate("/", { replace: true }); };

  const forgot = () => {
    if (!form.email) {
      toast.error("Enter your email first, then tap Forgot password");
      return;
    }
    toast.success("Reset link sent", { description: `Check ${form.email} for a link to set a new password.` });
  };

  const fillDemo = () => {
    setMode("login");
    setForm((p) => ({ ...p, name: DEMO.name, email: DEMO.email, password: "demo1234" }));
  };

  if (gate) {
    const pending = gate.kind === "pending";
    const Icon = pending ? Clock : ShieldX;
    return (
      <AppFrame>
        <div className="relative z-10 flex flex-1 flex-col justify-center overflow-y-auto px-6 py-6 hide-scrollbar">
          <div className="animate-rise rounded-card bg-card p-6 text-center shadow-float">
            <div className={`mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl ${pending ? "bg-warning-soft text-warning" : "bg-accent-soft text-accent-strong"}`}>
              <Icon className="size-8" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {pending ? "Awaiting approval" : "Registration declined"}<span className="text-accent">.</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{gate.message}</p>
            {pending && (
              <p className="mt-4 rounded-2xl bg-surface-2 px-4 py-3 text-xs leading-relaxed text-body">
                Registrations are usually reviewed within one business day.
              </p>
            )}
            <button
              onClick={backToLogin}
              className="sheen mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-strong text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark"
            >
              Back to sign in
            </button>
            <button
              onClick={guest}
              className="mt-2 h-11 w-full rounded-full text-sm font-semibold text-foreground transition-colors hover:bg-surface active:bg-border"
            >
              Look around as a guest
            </button>
          </div>
        </div>
      </AppFrame>
    );
  }

  const pill = (value, label) => {
    const active = mode === value;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setMode(value)}
        className={`relative isolate h-10 flex-1 rounded-full text-sm font-semibold transition-colors ${
          active ? "text-white" : "text-muted hover:text-foreground"
        }`}
      >
        {active && (
          <motion.span
            layoutId="auth-mode"
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-accent-strong shadow-glow"
            transition={{ type: "spring", stiffness: 500, damping: 36 }}
          />
        )}
        {label}
      </button>
    );
  };

  return (
    <AppFrame>
      <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar">
        {/* Photo hero: the promise, the logo, and the proof. */}
        <div className="relative mx-4 mt-1 h-72 overflow-hidden rounded-hero">
          <img src={HERO} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-foreground/10" />
          <div className="relative flex h-full flex-col justify-between p-5 pb-10">
            <BrandMark plate className="self-start [&_img]:w-24" />
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                <Sparkles className="size-3.5" aria-hidden="true" /> Icon Membership
              </p>
              <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-white">
                Your dream holiday, we handle the rest<span className="text-white/80">.</span>
              </h2>
              <p className="mt-1.5 text-xs text-white/85">12,000+ travellers · 30+ countries · since 2010</p>
            </div>
          </div>
        </div>

        {/* Form card riding up over the hero. */}
        <div className="relative -mt-6 px-4 pb-6">
          <div className="animate-rise rounded-card bg-card p-5 shadow-float">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isRegister ? "Request access" : "Welcome back"}<span className="text-accent">.</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isRegister
                ? "An admin reviews your registration before the account goes live."
                : "Sign in to see your trips, bookings and offers."}
            </p>

            <div role="tablist" aria-label="Sign in or register" className="mt-4 flex gap-1 rounded-full bg-surface p-1">
              {pill("login", "Sign in")}
              {pill("register", "Register")}
            </div>

            <form onSubmit={submit} className="mt-4 space-y-3">
              {isRegister && (
                <>
                  <Field id="name" icon={User} label="Full name" value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Alex Rivera" autoComplete="name" />
                  <Field id="phone" icon={Phone} label="Phone" type="tel" value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+62 812 3456 7890" autoComplete="tel" />
                </>
              )}
              <Field id="email" icon={Mail} label="Email" type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@email.com" autoComplete="email" />
              <Field
                id="password"
                icon={Lock}
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => upd("password", e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={isRegister ? "new-password" : "current-password"}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
                  </button>
                }
              />

              {!isRegister && (
                <div className="flex justify-end">
                  <button type="button" onClick={forgot} className="rounded-full px-1 text-xs font-semibold text-accent-strong hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="sheen flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-strong text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-60"
              >
                {busy ? (
                  <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> {isRegister ? "Sending request…" : "Signing in…"}</>
                ) : (
                  <>{isRegister ? "Request access" : "Sign in"} <ArrowRight className="size-4" aria-hidden="true" /></>
                )}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemo}
                className="flex items-center gap-2.5 rounded-2xl bg-surface-2 p-2.5 text-left transition-colors hover:bg-surface active:scale-[0.98]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white" aria-hidden="true">AR</span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-foreground">Demo account</span>
                  <span className="block truncate text-[11px] text-muted">Fill the form</span>
                </span>
              </button>
              <button
                type="button"
                onClick={guest}
                className="flex items-center gap-2.5 rounded-2xl bg-surface-2 p-2.5 text-left transition-colors hover:bg-surface active:scale-[0.98]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-card" aria-hidden="true">
                  <User className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-foreground">Guest</span>
                  <span className="block truncate text-[11px] text-muted">Look around</span>
                </span>
              </button>
            </div>
          </div>

          <ul className="stagger mt-4 grid grid-cols-3 gap-2" aria-label="Why book with Icon Holiday">
            {PERKS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card px-2 py-3 text-center shadow-card">
                <span className="flex size-8 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-[11px] font-semibold leading-tight text-body">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppFrame>
  );
}
