import logo from "@/assets/icon-holiday-logo.webp";

/**
 * The Icon Holiday logo. Bare on white; on ink, `plate` sets it on a white
 * tile because the green wordmark disappears into the green ink.
 */
export default function BrandMark({ plate = false, compact = false, className = "" }) {
  const img = (
    <img
      src={logo}
      width={426}
      height={184}
      alt="Icon Holiday"
      draggable={false}
      className={`block h-auto shrink-0 select-none ${compact ? "w-9" : "w-36"}`}
    />
  );
  if (!plate) return <span className={className}>{img}</span>;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-card ${className}`}
    >
      {img}
    </span>
  );
}
