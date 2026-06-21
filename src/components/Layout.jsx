import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PhoneFrame from "./PhoneFrame";
import BottomNav from "./BottomNav";

export default function Layout() {
  const location = useLocation();

  return (
    <PhoneFrame>
      {/* Page content */}
      <main className="relative z-10 flex-1 overflow-y-auto hide-scrollbar" style={{ paddingBottom: 88 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ x: 18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -18, opacity: 0 }}
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
