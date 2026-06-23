import { RANGES } from "./dateRange";

// Reusable "added within" date-range filter dropdown for dashboard pages.
export default function DateRangeSelect({ value, onChange, className = "" }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`dash-input max-w-[150px] ${className}`} aria-label="Date range">
      {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
    </select>
  );
}
