import { useEffect, useRef, useState } from "react";

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A number that counts up from zero when it first appears, easing out over
 * `duration` ms. Non-numbers render as given; reduced motion shows the value.
 */
export default function CountUp({ value, duration = 900, format = (n) => n.toLocaleString("id-ID") }) {
  const target = typeof value === "number" && Number.isFinite(value) ? value : null;
  const [shown, setShown] = useState(target === null || reduceMotion() ? target : 0);
  const from = useRef(0);

  useEffect(() => {
    if (target === null || reduceMotion()) {
      setShown(target);
      return undefined;
    }
    const start = performance.now();
    const origin = from.current;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(origin + (target - origin) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  if (target === null) return value ?? null;
  return format(shown);
}
