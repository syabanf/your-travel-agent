import { useEffect, useState } from "react";

// Page-based pagination for dashboard tables & lists.
// Pass `resetKey` (e.g. a string built from the active filters/search/sort) so
// the view jumps back to page 1 whenever the result set changes.
export function usePagination(items, pageSize = 10, resetKey) {
  const [page, setPage] = useState(1);
  const list = items || [];
  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Reset to the first page when filters change.
  useEffect(() => { setPage(1); }, [resetKey]);
  // Keep the page in range if the result set shrinks.
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const pageItems = list.slice((page - 1) * pageSize, page * pageSize);

  return { page, setPage, pageCount, total, pageSize, pageItems };
}
