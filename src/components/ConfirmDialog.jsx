import { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * On-brand replacement for window.confirm.
 *
 *   import { confirmDialog } from "@/components/ConfirmDialog";
 *   if (!(await confirmDialog({ title: "Delete customer?", body: "…", destructive: true }))) return;
 *
 * <ConfirmHost /> is mounted once in App.jsx. If it isn't mounted for any
 * reason we fall back to window.confirm so a guard is never silently skipped.
 */

let openConfirm = null;

export function confirmDialog(options = {}) {
  if (!openConfirm) {
    // Safety net — never lose the confirmation step.
    return Promise.resolve(window.confirm(options.title || "Are you sure?"));
  }
  return new Promise((resolve) => openConfirm(options, resolve));
}

export function ConfirmHost() {
  const [state, setState] = useState(null); // { options, resolve }
  const confirmRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    openConfirm = (options, resolve) => {
      lastFocused.current = document.activeElement;
      setState({ options, resolve });
    };
    return () => { openConfirm = null; };
  }, []);

  const close = useCallback((result) => {
    setState((s) => { s?.resolve(result); return null; });
    // Return focus to whatever opened the dialog — no "where am I?" moment.
    requestAnimationFrame(() => {
      try { lastFocused.current?.focus?.(); } catch { /* ignore */ }
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(false); }
      if (e.key === "Enter") { e.preventDefault(); close(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, close]);

  if (!state) return null;

  const {
    title = "Are you sure?",
    body,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    destructive = false,
  } = state.options;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-ich-primary/30 backdrop-blur-[2px] animate-fade-in" onClick={() => close(false)} />
      <div className="dash-drawer-in relative w-full max-w-sm bg-white rounded-3xl shadow-float p-6 text-center">
        <button
          onClick={() => close(false)}
          aria-label="Close"
          className="absolute top-3 right-3 w-10 h-10 rounded-full hover:bg-ich-primary/5 flex items-center justify-center text-ich-neutral"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center ${destructive ? "bg-red-500/10 text-red-600" : "bg-ich-gold/10 text-gold"}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h2 id="confirm-title" className="text-lg font-display font-bold text-ich-primary">{title}</h2>
        {body && <p className="text-sm text-ich-neutral mt-1.5 leading-relaxed">{body}</p>}

        <div className="flex gap-2.5 mt-6">
          <button
            onClick={() => close(false)}
            className="flex-1 min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-ich-primary/15 text-ich-primary hover:bg-ich-primary/5 press-spring"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={() => close(true)}
            className={`flex-1 min-h-[44px] px-4 rounded-xl text-sm font-semibold text-white press-spring ${destructive ? "bg-red-600 hover:bg-red-700 shadow-soft" : "btn-primary"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
