import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Plane, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";
  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e?.preventDefault();
    if (!form.email || !form.password || (isRegister && !form.name)) {
      toast.error("Please fill in all fields");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      login({ name: form.name || form.email.split("@")[0] });
      toast.success(isRegister ? "Account created" : "Welcome back");
      navigate("/", { replace: true });
    }, 700);
  };

  const guest = () => { login({ name: "Guest" }); navigate("/", { replace: true }); };

  return (
    <div className="fixed inset-0 premium-bg-light overflow-y-auto">
      <div className="absolute -top-10 right-0 w-72 h-72 bg-[#AD1F23]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="relative min-h-full flex flex-col justify-center px-7 py-12 max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl btn-primary flex items-center justify-center mb-5">
            <Plane className="w-7 h-7 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-mora-primary">{isRegister ? "Create account" : "Welcome back"}</h1>
          <p className="text-sm text-mora-neutral mt-1">
            {isRegister ? "Start planning your next escape." : "Sign in to continue your journey."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isRegister && (
            <Field icon={User} label="Full name">
              <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Alex Rivera"
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
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isRegister ? "Create account" : "Sign in"} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <button onClick={guest} className="w-full h-11 mt-3 glass-light rounded-xl text-sm font-medium text-mora-primary hover:bg-mora-primary/5 transition-colors">
          Continue as guest
        </button>

        <p className="text-center text-sm text-mora-neutral mt-6">
          {isRegister ? "Already have an account?" : "New to MORA?"}{" "}
          <button onClick={() => setMode(isRegister ? "login" : "register")} className="text-gold font-semibold">
            {isRegister ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
