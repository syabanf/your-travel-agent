import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarCheck, Database, Eye, EyeOff, FolderOpen, Loader2, Lock, Mail, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import BrandMark from "@/components/BrandMark";
import { lockRemaining, readStaffSession, staffSignIn } from "@/lib/staffAuth";
import { roleLabel } from "@/dashboard/rbac";

const MODULES = [
  [CalendarCheck, "Trips and bookings", "Payments, checkout and departure info"],
  [FolderOpen, "Member documents", "Review uploads and send issued documents"],
  [BookOpen, "Accounting", "Ledger, monthly report and statements"],
  [Database, "Master data", "Places, visas, payment methods, accounts"],
];

// Demo staff from Team & Roles, one per role. Any 8+ character password works.
const DEMO = [
  ["alex@iconholiday.app", "Alex Rivera", "admin"],
  ["dewi@iconholiday.app", "Dewi Lestari", "manager"],
  ["tom@iconholiday.app", "Tom Becker", "editor"],
  ["rina@iconholiday.app", "Rina Putri", "viewer · invited"],
];
const DEMO_PASSWORD = "demo1234";

const INPUT = "h-12 w-full rounded-2xl border border-border bg-surface-2 pl-11 pr-11 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/50 focus:bg-card focus:ring-2 focus:ring-accent/30 md:text-sm";

/** Back-office sign-in for Icon Holiday staff (accounts from Team & Roles). */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next")?.startsWith("/dashboard") ? params.get("next") : "/dashboard";
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(() => Math.ceil(lockRemaining() / 1000));

  // Count the lockout down so the form says when it opens again.
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => {
      const left = Math.ceil(lockRemaining() / 1000);
      setLocked(left);
      if (!left) setError("");
    }, 1000);
    return () => clearInterval(t);
  }, [locked]);

  if (readStaffSession()) return <Navigate to={next} replace />;

  const upd = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setError(""); };
  const onKey = (e) => setCaps(e.getModifierState?.("CapsLock") || false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) { setError("Enter your work email and password."); return; }
    setBusy(true);
    try {
      const staff = await staffSignIn(form.email, form.password, { remember: form.remember });
      toast.success(`Welcome back, ${staff.name.split(" ")[0]}`, { description: `Signed in as ${roleLabel(staff.role)}` });
      navigate(next, { replace: true });
    } catch (err) {
      setError(err?.refused ? err.message : "Sign-in didn't go through. Try again.");
      if (err?.locked) setLocked(Math.ceil(lockRemaining() / 1000) || 30);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-surface p-3 lg:p-4">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-6xl gap-3 lg:min-h-[calc(100dvh-2rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-4">
        {/* Ink panel: what the back office is for. */}
        <section className="relative hidden overflow-hidden rounded-hero bg-ink p-10 text-on-ink shadow-float lg:flex lg:flex-col">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent/25 blur-3xl" />
          <BrandMark plate className="relative self-start" />
          <div className="relative mt-auto">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-on-ink-muted">Icon Holiday back office</p>
            <h2 className="mt-2 text-4xl font-bold leading-tight tracking-tight">Run every trip from one desk<span className="text-white">.</span></h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-on-ink-muted">Bookings, member documents, master data and the books. Your role decides what you can change.</p>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {MODULES.map(([Icon, title, sub]) => (
                <li key={title} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <Icon className="size-5 text-white" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-on-ink-muted">{sub}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 flex items-center gap-2 text-xs text-on-ink-muted">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" /> Staff only. Every sign-in is written to the audit log.
            </p>
          </div>
        </section>

        {/* Sign-in form. */}
        <section className="flex flex-col rounded-hero bg-card p-6 shadow-card sm:p-10">
          <div className="flex items-center justify-between gap-3">
            <BrandMark className="lg:invisible" />
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground">
              <Smartphone className="size-4" aria-hidden="true" /> Member app
            </Link>
          </div>

          <div className="mx-auto my-auto w-full max-w-sm py-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent-strong">Staff sign-in</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Welcome back<span className="text-accent">.</span></h1>
            <p className="mt-1.5 text-sm text-muted">Use the work email your administrator added in Team & Roles.</p>

            <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{locked ? `Too many attempts. Try again in ${locked} seconds.` : error}
                </p>
              )}
              <div>
                <label htmlFor="staff-email" className="mb-1.5 block text-xs font-semibold text-body">Work email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input id="staff-email" type="email" autoComplete="username" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@iconholiday.app" className={INPUT} autoFocus />
                </div>
              </div>
              <div>
                <label htmlFor="staff-password" className="mb-1.5 block text-xs font-semibold text-body">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input id="staff-password" type={show ? "text" : "password"} autoComplete="current-password" value={form.password} onChange={(e) => upd("password", e.target.value)} onKeyUp={onKey} onKeyDown={onKey} placeholder="At least 8 characters" className={INPUT} />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground">
                    {show ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
                  </button>
                </div>
                {caps && <p className="mt-1.5 text-xs font-semibold text-warning">Caps Lock is on.</p>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-body">
                  <input type="checkbox" checked={form.remember} onChange={(e) => upd("remember", e.target.checked)} className="size-4 accent-accent" />
                  Keep me signed in
                </label>
                <button type="button" onClick={() => toast("Ask an administrator to reset your password", { description: "Administrators manage staff accounts in Team & Roles." })} className="text-xs font-semibold text-accent-strong hover:underline">
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={busy || locked > 0} className="sheen flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-strong text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-60">
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                {locked ? `Locked for ${locked}s` : busy ? "Signing in" : "Sign in to back office"}
              </button>
            </form>

            <div className="mt-8 rounded-2xl bg-surface-2 p-4">
              <p className="eyebrow">Demo staff accounts</p>
              <p className="mt-0.5 text-xs text-muted">Pick one to fill the form. Password: {DEMO_PASSWORD}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {DEMO.map(([email, name, role]) => (
                  <button key={email} type="button" onClick={() => { setForm((p) => ({ ...p, email, password: DEMO_PASSWORD })); setError(""); }}
                    className={`rounded-xl bg-card px-3 py-2 text-left shadow-card transition-colors hover:bg-surface ${form.email === email ? "ring-2 ring-accent/40" : ""}`}>
                    <span className="block truncate text-xs font-semibold text-foreground">{name}</span>
                    <span className="block text-[11px] capitalize text-muted">{role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted">© {new Date().getFullYear()} Icon Holiday · Back office</p>
        </section>
      </div>
    </div>
  );
}
