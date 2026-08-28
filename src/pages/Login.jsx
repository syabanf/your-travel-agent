import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Plane, Mail, Lock, User, ArrowRight, Loader2, Phone, Clock, ShieldX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PhoneFrame from "../components/PhoneFrame";
import { submitRegistration, registrationStatus, REGISTRATION_MESSAGES } from "@/lib/registration";

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="text-[10px] text-gold uppercase tracking-widest mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50 z-10" />
        {children}
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
  // Set once a sign-up is filed, or when sign-in is refused — replaces the form
  // with an explanation rather than bouncing a toast the user may miss.
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
            ? "We already have a registration for this email — it's still waiting for approval."
            : REGISTRATION_MESSAGES.pending,
        });
        return;
      }

      const { status } = await registrationStatus(form.email);
      // `none` covers the seeded demo accounts, which were never put through the
      // queue — the gate is there to hold new sign-ups, not lock out the demo.
      if (status === "pending" || status === "rejected") {
        setGate({ kind: status, message: REGISTRATION_MESSAGES[status] });
        return;
      }

      login({ name: form.name || form.email.split("@")[0], email: form.email });
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

  if (gate) {
    const pending = gate.kind === "pending";
    const Icon = pending ? Clock : ShieldX;
    return (
      <PhoneFrame>
        <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-7 py-6 flex flex-col justify-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
              pending ? "glass-gold" : "bg-red-500/10"
            }`}
          >
            <Icon className={`w-7 h-7 ${pending ? "text-gold" : "text-red-400"}`} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">
            {pending ? "Awaiting approval" : "Registration declined"}
          </h1>
          <p className="text-sm text-mora-neutral mt-2 leading-relaxed">{gate.message}</p>

          {pending && (
            <p className="text-xs text-mora-neutral/70 mt-4 leading-relaxed">
              Registrations are usually reviewed within one business day.
            </p>
          )}

          <button
            onClick={backToLogin}
            className="w-full h-12 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-7"
          >
            Back to sign in
          </button>
          <button
            onClick={guest}
            className="w-full h-11 mt-3 glass-light rounded-xl text-sm font-medium text-mora-primary hover:bg-mora-primary/5 transition-colors"
          >
            Look around as a guest
          </button>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar px-7 py-6 flex flex-col justify-center">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl btn-primary flex items-center justify-center mb-5">
            <Plane className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-mora-primary">{isRegister ? "Request access" : "Welcome back"}</h1>
          <p className="text-sm text-mora-neutral mt-1">
            {isRegister
              ? "An admin reviews your registration before the account goes live."
              : "Sign in to continue your journey."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isRegister && (
            <Field icon={User} label="Full name">
              <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Alex Rivera"
                className="bg-white/5 border-white/10 rounded-xl h-12 pl-10 text-mora-white placeholder:text-mora-neutral/40" />
            </Field>
          )}
          {isRegister && (
            <Field icon={Phone} label="Phone">
              <Input value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+62 812 3456 7890"
                className="bg-white/5 border-white/10 rounded-xl h-12 pl-10 text-mora-white placeholder:text-mora-neutral/40" />
            </Field>
          )}
          <Field icon={Mail} label="Email">
            <Input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} placeholder="you@email.com"
              className="bg-white/5 border-white/10 rounded-xl h-12 pl-10 text-mora-white placeholder:text-mora-neutral/40" />
          </Field>
          <Field icon={Lock} label="Password">
            <Input type="password" value={form.password} onChange={(e) => upd("password", e.target.value)} placeholder="••••••••"
              className="bg-white/5 border-white/10 rounded-xl h-12 pl-10 text-mora-white placeholder:text-mora-neutral/40" />
          </Field>

          <button type="submit" disabled={busy}
            className="w-full h-12 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isRegister ? "Request access" : "Sign in"} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <button onClick={guest} className="w-full h-11 mt-3 glass-light rounded-xl text-sm font-medium text-mora-primary hover:bg-mora-primary/5 transition-colors">
          Continue as guest
        </button>

        <p className="text-center text-sm text-mora-neutral mt-6">
          {isRegister ? "Already have an account?" : "New to Icon Holiday?"}{" "}
          <button onClick={() => setMode(isRegister ? "login" : "register")} className="text-gold font-semibold">
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </PhoneFrame>
  );
}
