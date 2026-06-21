// Shimmering placeholders for loading states (uses the .skeleton CSS shimmer).
//   import Skeleton, { SkeletonText, SkeletonStat } from "@/components/Skeletons";
//   <Skeleton className="h-8 w-32" />
export default function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3.5" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

// Dashboard KPI/stat card placeholder.
export function SkeletonStat({ className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-mora-primary/10 p-5 ${className}`} aria-hidden="true">
      <div className="skeleton h-9 w-9 rounded-xl mb-3" />
      <div className="skeleton h-6 w-24 mb-2" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

// Generic list-row placeholders for tables/lists.
export function SkeletonRows({ rows = 5, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
          <div className="skeleton h-4 flex-1" />
          <div className="skeleton h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
