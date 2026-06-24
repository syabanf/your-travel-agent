import moment from "moment";

// Period + period-over-period comparison helpers shared by the analytics pages.
// A "span" is { start, end } (moments), or null for "all time" (matches everything).

export const PERIODS = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "mtd", label: "This month" },
  { key: "qtd", label: "This quarter" },
  { key: "ytd", label: "This year" },
  { key: "all", label: "All time" },
];

export const COMPARISONS = [
  { key: "none", label: "No comparison" },
  { key: "prev", label: "vs Previous period" },
  { key: "year", label: "vs Same period last year" },
];

// Current window for a period key. Returns null for "all" (no bound).
export function periodRange(key) {
  const end = moment();
  switch (key) {
    case "30d": return { start: moment().subtract(30, "days"), end };
    case "90d": return { start: moment().subtract(90, "days"), end };
    case "mtd": return { start: moment().startOf("month"), end };
    case "qtd": return { start: moment().startOf("quarter"), end };
    case "ytd": return { start: moment().startOf("year"), end };
    case "all":
    default: return null;
  }
}

// The window to compare against. Null when there's nothing meaningful to compare.
export function comparisonRange(periodKey, comparisonKey) {
  if (!comparisonKey || comparisonKey === "none") return null;
  const r = periodRange(periodKey);
  if (!r) return null; // "all time" has no comparison window
  if (comparisonKey === "year") {
    return { start: r.start.clone().subtract(1, "year"), end: r.end.clone().subtract(1, "year") };
  }
  // "prev": the equally-long window immediately before the current one.
  const ms = r.end.diff(r.start);
  return { start: r.start.clone().subtract(ms, "ms"), end: r.start.clone() };
}

// True when an ISO/epoch value falls inside a span (null span = all time = always true).
export function inSpan(value, span) {
  if (!span) return true;
  if (value == null) return false;
  const d = moment(value);
  return d.isValid() && d.isSameOrAfter(span.start) && d.isBefore(span.end);
}

// Percentage change current-vs-previous. Null when there's no baseline to compare to.
export function pctDelta(current, previous) {
  if (previous == null) return null;
  if (!previous) return null; // no baseline (avoid misleading ∞/100%)
  return Math.round(((current - previous) / previous) * 100);
}

// Short label for the active comparison, e.g. for a delta caption.
export function comparisonLabel(comparisonKey) {
  if (comparisonKey === "year") return "vs last year";
  if (comparisonKey === "prev") return "vs prev period";
  return "";
}

// Convenience: sum a numeric accessor over rows whose date falls in the span.
export function sumIn(rows, dateKey, valueFn, span) {
  return (rows || []).reduce((acc, r) => (inSpan(r[dateKey], span) ? acc + (Number(valueFn(r)) || 0) : acc), 0);
}

// Convenience: count rows whose date falls in the span (optionally filtered).
export function countIn(rows, dateKey, span, filterFn) {
  return (rows || []).filter((r) => inSpan(r[dateKey], span) && (!filterFn || filterFn(r))).length;
}
