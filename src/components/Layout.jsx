import { useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PhoneFrame from "./PhoneFrame";
import BottomNav from "./BottomNav";
import AppHeader from "./AppHeader";
import ErrorBoundary from "./ErrorBoundary";

// Main tab screens get the persistent brand app-bar + horizontal swipe nav.
const TAB_ROOTS = ["/", "/itinerary", "/booking", "/assistant", "/profile"];
const tabIndex = (path) => TAB_ROOTS.findIndex((r) => (r === "/" ? path === "/" : path.startsWith(r)));

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const showHeader = TAB_ROOTS.includes(location.pathname);

  // Direction (1 = forward/right, -1 = back/left) so the page slides the way
  // you're travelling through the tab order. Computed during render so the
  // entering page captures the correct direction immediately.
  const lastIdx = useRef(tabIndex(location.pathname));
  const currIdx = tabIndex(location.pathname);
  let dir = 1;
  if (currIdx !== -1 && lastIdx.current !== -1 && currIdx !== lastIdx.current) {
    dir = currIdx > lastIdx.current ? 1 : -1;
  }
  useEffect(() => { if (currIdx !== -1) lastIdx.current = currIdx; }, [currIdx]);

  // ---- Horizontal swipe between the main tab screens ----
  const touch = useRef(null);
  // Don't hijack swipes that begin inside a horizontal scroller (e.g. the
  // featured-destinations carousel) — let those scroll normally.
  const inHScroller = (el) => {
    let n = el;
    while (n && n !== document.body) {
      if (n.scrollWidth > n.clientWidth + 4) {
        const ox = getComputedStyle(n).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
      n = n.parentElement;
    }
    return false;
  };
  const onTouchStart = (e) => {
    if (TAB_ROOTS.indexOf(location.pathname) === -1 || inHScroller(e.target)) { touch.current = null; return; }
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    const dt = Date.now() - touch.current.t;
    touch.current = null;
    // A clean, quick, mostly-horizontal flick.
    if (dt > 600 || Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    const idx = TAB_ROOTS.indexOf(location.pathname);
    if (idx === -1) return;
    if (dx < 0 && idx < TAB_ROOTS.length - 1) navigate(TAB_ROOTS[idx + 1]);      // swipe left → next menu
    else if (dx > 0 && idx > 0) navigate(TAB_ROOTS[idx - 1]);                     // swipe right → previous menu
  };

  const variants = {
    initial: (d) => ({ opacity: 0, x: reduce ? 0 : d * 40 }),
    animate: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce ? 0 : d * -40 }),
  };

  return (
    <PhoneFrame>
      <a href="#main" className="skip-link">Skip to content</a>
      {/* Page content */}
      <main
        id="main"
        className="relative z-10 flex-1 overflow-y-auto hide-scrollbar"
        style={{ paddingBottom: 88 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {showHeader && <AppHeader />}
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={location.pathname}
            custom={dir}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ minHeight: "100%" }}
          >
            <ErrorBoundary inline resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </PhoneFrame>
  );
}
