import { Heart, Users, Mountain, Landmark, Palmtree, Building2, Package, Gem, PiggyBank } from "lucide-react";

// Holiday-package categories, shared by the mobile store and the dashboard CMS.
export const PACKAGE_CATEGORIES = [
  // Signature and Cost Saver are the two commercial tiers — they lead the list
  // because most travellers pick a budget bracket before a theme.
  { value: "signature", label: "Signature", icon: Gem },
  { value: "cost_saver", label: "Cost Saver", icon: PiggyBank },
  { value: "honeymoon", label: "Honeymoon", icon: Heart },
  { value: "family", label: "Family", icon: Users },
  { value: "adventure", label: "Adventure", icon: Mountain },
  { value: "cultural", label: "Cultural", icon: Landmark },
  { value: "beach", label: "Beach & Islands", icon: Palmtree },
  { value: "city", label: "City Break", icon: Building2 },
];

export const categoryMeta = (value) =>
  PACKAGE_CATEGORIES.find((c) => c.value === value) || { value, label: value || "Package", icon: Package };

export const categoryLabel = (value) => categoryMeta(value).label;
export const categoryIcon = (value) => categoryMeta(value).icon;

// Total price for a party — packages are priced per person.
export const packageTotal = (pkg, pax) => (Number(pkg?.price) || 0) * Math.max(1, Number(pax) || 1);

// Percentage saved vs the strikethrough price, or null when there's no discount.
export function packageDiscount(pkg) {
  const price = Number(pkg?.price) || 0;
  const before = Number(pkg?.price_before) || 0;
  if (!before || before <= price) return null;
  return Math.round(((before - price) / before) * 100);
}

// Down payment: packages may set their own minimum, otherwise this applies.
export const DEFAULT_MIN_DP_PERCENT = 30;

export const minDpPercent = (pkg) => {
  const v = Number(pkg?.min_dp_percent);
  return Number.isFinite(v) && v > 0 && v <= 100 ? v : DEFAULT_MIN_DP_PERCENT;
};

// The instalment choices offered at checkout: the package's minimum, a couple of
// larger steps, then paying in full. Duplicates and anything below the minimum
// are dropped, so a 50%-minimum package never shows a 30% option.
export function dpOptions(pkg) {
  const min = minDpPercent(pkg);
  const steps = [...new Set([min, 50, 70].filter((p) => p >= min))].sort((a, b) => a - b);
  return [...steps.map((percent) => ({ percent, label: `DP ${percent}%` })), { percent: 100, label: "Pay in full" }];
}
