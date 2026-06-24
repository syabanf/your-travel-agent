import { CalendarRange } from "lucide-react";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { RANGES } from "./dateRange";

// Reusable "added within" date-range filter dropdown for dashboard pages.
export default function DateRangeSelect({ value, onChange, className = "" }) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={RANGES.map((r) => ({ value: r.key, label: r.label }))}
      leadingIcon={CalendarRange}
      ariaLabel="Date range"
      className={`min-w-[150px] ${className}`}
    />
  );
}
