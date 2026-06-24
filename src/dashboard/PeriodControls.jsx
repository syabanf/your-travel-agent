import { CalendarRange, GitCompareArrows } from "lucide-react";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { PERIODS, COMPARISONS } from "@/dashboard/periodCompare";

// Two linked searchable dropdowns: the reporting period + an optional
// period-over-period comparison. Comparison is disabled for "All time".
export default function PeriodControls({ period, onPeriod, comparison, onComparison, className = "" }) {
  const noCompare = period === "all";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <SearchableSelect
        value={period}
        onChange={onPeriod}
        options={PERIODS.map((p) => ({ value: p.key, label: p.label }))}
        leadingIcon={CalendarRange}
        ariaLabel="Reporting period"
        className="min-w-[160px] text-sm font-medium"
      />
      <SearchableSelect
        value={noCompare ? "none" : comparison}
        onChange={onComparison}
        options={COMPARISONS.map((c) => ({ value: c.key, label: c.label }))}
        leadingIcon={GitCompareArrows}
        disabled={noCompare}
        ariaLabel="Comparison period"
        className="min-w-[190px] text-sm font-medium"
      />
    </div>
  );
}
