import { X } from "lucide-react";

// Right-side slide-over detail panel (full-width on mobile).
export default function Drawer({ open, onClose, title, subtitle, icon: Icon, width = "max-w-xl", children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative w-full ${width} bg-[#F8FAFC] h-full shadow-2xl overflow-y-auto`}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-mora-primary/10 sticky top-0 bg-white/90 backdrop-blur z-10">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && <span className="w-9 h-9 rounded-lg bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><Icon className="w-4.5 h-4.5" /></span>}
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-mora-primary truncate">{title}</h3>
              {subtitle && <p className="text-xs text-mora-neutral mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">{children}</div>
      </div>
    </div>
  );
}
