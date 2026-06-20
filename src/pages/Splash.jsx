import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plane } from "lucide-react";

const read = (k) => { try { return localStorage.getItem(k) === "1"; } catch { return false; } };

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      if (read("mora_session")) navigate("/", { replace: true });
      else if (!read("mora_onboarded")) navigate("/onboarding", { replace: true });
      else navigate("/login", { replace: true });
    }, 1700);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center premium-bg-light overflow-hidden">
      <div className="absolute -top-16 right-0 w-80 h-80 bg-[#AD1F23]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-10 w-72 h-72 bg-[#0B1B3B]/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-3xl btn-primary flex items-center justify-center mb-5 shadow-[0_16px_40px_rgba(173,31,35,0.35)]">
          <Plane className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-display font-bold text-mora-primary tracking-tight">MORA</h1>
        <p className="text-xs text-mora-neutral mt-2 tracking-[0.25em] uppercase">Your Travel Agent</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-16 flex items-center gap-2"
      >
        <div className="w-4 h-4 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        <span className="text-xs text-mora-neutral/60">Preparing your journey…</span>
      </motion.div>
    </div>
  );
}
