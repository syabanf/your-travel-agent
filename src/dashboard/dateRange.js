import moment from "moment";

// Shared "added within" date-range options for dashboard filters.
export const RANGES = [
  { key: "all", label: "All time" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
  { key: "year", label: "This year" },
];

// Accepts ISO strings or epoch-ms; returns true when value falls in the range.
export function inRange(value, range) {
  if (!range || range === "all" || value == null) return true;
  const d = moment(value);
  if (!d.isValid()) return true;
  if (range === "year") return d.year() === moment().year();
  const days = Number(range);
  if (!days) return true;
  return d.isAfter(moment().subtract(days, "days"));
}
