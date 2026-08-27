import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Remembered scroll offsets, keyed by path. Module-level so they survive the
// shell re-rendering between routes.
const positions = new Map();

/**
 * Keeps you where you left off.
 *
 * Going *back* to a list restores the offset you were at; navigating *forward*
 * to a new screen always starts at the top. Both shells scroll an inner
 * element (the global body is position:fixed for the mobile app lock), so this
 * takes a ref to that scroll container.
 */
export default function useScrollRestoration(ref) {
  const location = useLocation();
  const navType = useNavigationType(); // PUSH | REPLACE | POP
  const key = location.pathname + location.search;
  const keyRef = useRef(key);
  keyRef.current = key;

  // Record the offset as you scroll (passive — no scroll-blocking work).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => positions.set(keyRef.current, el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      // Capture the final offset before this route goes away.
      positions.set(keyRef.current, el.scrollTop);
      el.removeEventListener("scroll", onScroll);
    };
  }, [ref, key]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = navType === "POP" ? positions.get(key) : undefined;
    const target = saved ?? 0;

    el.scrollTop = target;
    if (!target) return;

    // The incoming screen often paints before its data lands, so it may still
    // be too short to hold the offset. Re-apply over the next few frames until
    // it sticks, then stop.
    let frames = 0;
    let raf = requestAnimationFrame(function retry() {
      if (!ref.current || frames++ > 12) return;
      if (Math.abs(ref.current.scrollTop - target) > 1) ref.current.scrollTop = target;
      if (Math.abs(ref.current.scrollTop - target) > 1) raf = requestAnimationFrame(retry);
    });
    return () => cancelAnimationFrame(raf);
  }, [ref, key, navType]);
}
