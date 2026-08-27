import { Heart, Users, Mountain, Landmark, Palmtree, Building2, Package } from "lucide-react";

// Holiday-package categories, shared by the mobile store and the dashboard CMS.
export const PACKAGE_CATEGORIES = [
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
