import { AlertTriangle, RotateCcw } from "lucide-react";

// Inline error / not-found state for data-driven views.
//   <ErrorState title="Booking not found" hint="…" onRetry={load} />
export default function ErrorState({ title = "Something went wrong", hint, onRetry, retryLabel = "Try again", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <p className="font-display font-semibold text-ich-primary">{title}</p>
      {hint && <p className="text-sm text-ich-neutral mt-1 max-w-xs">{hint}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-ich-primary bg-ich-primary/5 hover:bg-ich-primary/10 px-4 py-2 rounded-xl press">
          <RotateCcw className="w-4 h-4" /> {retryLabel}
        </button>
      )}
    </div>
  );
}
