import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PhoneFrame from "./PhoneFrame";
import BottomNav from "./BottomNav";

export default function Layout() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const variants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { x: 18, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -18, opacity: 0 } };

  return (
    <PhoneFrame>
      <a href="#main" className="skip-link">Skip to content</a>
      {/* Page content */}
      <main id="main" className="relative z-10 flex-1 overflow-y-auto hide-scrollbar" style={{ paddingBottom: 88 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ minHeight: "100%" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </PhoneFrame>
  );
}
