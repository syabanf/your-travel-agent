import { X } from "lucide-react";

// Right-side slide-over detail panel (full-width on mobile).
export default function Drawer({ open, onClose, title, subtitle, icon: Icon, width = "max-w-xl", children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`dash-drawer-in relative w-full ${width} bg-[#F6F8FC] h-full shadow-float overflow-y-auto sm:rounded-l-3xl`}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border sticky top-0 bg-white/85 backdrop-blur-md z-10">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent-strong ring-1 ring-accent/10 flex items-center justify-center shrink-0"><Icon className="w-4.5 h-4.5" /></span>}
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground truncate">{title}</h3>
              {subtitle && <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center text-muted shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">{children}</div>
      </div>
    </div>
  );
}
