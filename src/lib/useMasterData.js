import { useEffect, useMemo, useState } from "react";
import { backend } from "@/api/backend";

/**
 * Active rows of a master data entity (Dashboard > Master data), sorted.
 * Shows `fallback` until the rows load, and keeps it when loading fails, so a
 * picker is never empty.
 */
export default function useMasterData(entity, fallback, sort = "order") {
  const [rows, setRows] = useState(fallback);
  useEffect(() => {
    let alive = true;
    backend.entities[entity].list(sort, 500)
      .then((r) => { if (alive && r?.length) setRows(r); })
      .catch(() => {});
    return () => { alive = false; };
  }, [entity, sort]);
  return useMemo(() => rows.filter((r) => r.active !== false), [rows]);
}
