import { useState, useEffect, useRef } from "react";

export default function usePullToRefresh(onRefresh) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const el = useRef(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    const onTouchStart = (e) => {
      if (node.scrollTop === 0) startY.current = e.touches[0].clientY;
    };

    const onTouchEnd = async (e) => {
      if (startY.current === null) return;
      const delta = e.changedTouches[0].clientY - startY.current;
      startY.current = null;
      if (delta > 70 && !refreshing) {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, refreshing]);

  return { ref: el, refreshing };
}