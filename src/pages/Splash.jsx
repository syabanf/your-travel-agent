import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BrandMark from "../components/BrandMark";
import PhoneFrame from "../components/PhoneFrame";

const read = (k) => { try { return localStorage.getItem(k) === "1"; } catch { return false; } };

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      if (read("ich_session")) navigate("/", { replace: true });
      else if (!read("ich_onboarded")) navigate("/onboarding", { replace: true });
      else navigate("/login", { replace: true });
    }, 1700);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <PhoneFrame>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="sr-only">Icon Holiday</h1>
          <BrandMark className="[&_img]:w-56" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted">Your travel agent</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-16 flex items-center gap-2"
        >
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-xs text-muted">Preparing your journey…</span>
        </motion.div>
      </div>
    </PhoneFrame>
  );
}
