import { ChevronLeft, ChevronRight } from "lucide-react";

// Compact page-number window with a sliding range + leading/trailing ellipsis.
function pageWindow(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pageCount - 1) out.push("…");
  out.push(pageCount);
  return out;
}

// Reusable dashboard paginator. Renders "Showing X–Y of N" + Prev / page / Next.
// Stays visible even on a single page so the table always reads as paginated.
export default function Pagination({ page, pageCount, total, pageSize, onPage, noun = "items", className = "" }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const win = pageWindow(page, pageCount);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 pt-4 ${className}`}>
      <p className="text-xs text-mora-neutral">
        Showing <span className="font-semibold text-mora-primary">{from}–{to}</span> of{" "}
        <span className="font-semibold text-mora-primary">{total}</span> {noun}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page"
            className="h-9 px-2.5 rounded-lg border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center press"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {win.map((p, i) =>
            p === "…" ? (
              <span key={`e${i}`} className="px-1.5 text-mora-neutral/50 text-sm select-none">…</span>
            ) : (
              <button
                key={p} onClick={() => onPage(p)} aria-label={`Page ${p}`} aria-current={p === page ? "page" : undefined}
                className={`h-9 min-w-[36px] px-3 rounded-lg text-sm font-medium press ${
                  p === page ? "btn-primary text-white" : "border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPage(page + 1)} disabled={page >= pageCount} aria-label="Next page"
            className="h-9 px-2.5 rounded-lg border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center press"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
