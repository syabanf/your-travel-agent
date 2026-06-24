import { CalendarRange, GitCompareArrows } from "lucide-react";
import { PERIODS, COMPARISONS } from "@/dashboard/periodCompare";

// Two linked selects: the reporting period + an optional period-over-period comparison.
// Comparison is disabled for "All time" (nothing to compare against).
export default function PeriodControls({ period, onPeriod, comparison, onComparison, className = "" }) {
  const noCompare = period === "all";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="relative">
        <CalendarRange className="w-4 h-4 text-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <select
          value={period}
          onChange={(e) => onPeriod(e.target.value)}
          aria-label="Reporting period"
          className="dash-input pl-9 pr-8 py-2 text-sm font-medium min-w-[150px]"
        >
          {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>
      <div className="relative">
        <GitCompareArrows className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${noCompare ? "text-mora-neutral/30" : "text-gold"}`} />
        <select
          value={noCompare ? "none" : comparison}
          onChange={(e) => onComparison(e.target.value)}
          disabled={noCompare}
          aria-label="Comparison period"
          className="dash-input pl-9 pr-8 py-2 text-sm font-medium min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {COMPARISONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
    </div>
  );
}
