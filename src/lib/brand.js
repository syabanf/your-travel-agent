/**
 * Hex mirror of the theme tokens in src/index.css, for code that cannot read
 * Tailwind classes: chart libraries, map markers, hand-drawn SVG and inline
 * styles. Keep the two in step. Palette sampled from the Icon Holiday logo.
 */
export const BRAND = {
  ink: "#0a6e4c",
  accent: "#ef242a",
  accentStrong: "#b3161c",
  highlight: "#0c895f",
  info: "#2563a8",
  infoSoft: "#83b3ee",
  warning: "#b45309",
  success: "#047857",
  foreground: "#0f1a15",
  muted: "#5e6b65",
  silver: "#b9c2bd",
  border: "#e3e8e5",
  surface: "#f1f4f2",
  chartMuted: "#d3d9d6",
};

/** Categorical order for part-to-whole charts (WIT): ink, info, accent, warning, success, grey. */
export const SERIES = [BRAND.ink, BRAND.info, BRAND.accent, BRAND.warning, BRAND.success, BRAND.chartMuted];

/** Recharts tooltip, styled from the tokens. */
export const TOOLTIP_STYLE = {
  borderRadius: 16,
  border: `1px solid ${BRAND.border}`,
  boxShadow: "0 12px 40px -12px rgb(15 26 21 / 0.3)",
  fontSize: 12,
};
