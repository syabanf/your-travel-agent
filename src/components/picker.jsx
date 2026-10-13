import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

/** A tappable field that shows its label inside, the way travel apps lay out a search form. */
export function PickerTile({ icon: Icon, label, value, placeholder, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2.5 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-[0.99] ${className}`}
    >
      {Icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card shadow-card">
          <Icon className="size-4 text-accent" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="eyebrow block">{label}</span>
        <span className={`block truncate text-sm font-semibold ${value ? "text-foreground" : "text-muted"}`}>{value || placeholder}</span>
      </span>
    </button>
  );
}

/** Bottom sheet for pickers: white, rounded, capped at the app column width. */
export function PickerSheet({ open, onOpenChange, title, hint, children, tall = false }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`mx-auto max-w-md rounded-t-[28px] border-0 bg-card shadow-float ${tall ? "h-[88dvh]" : ""}`}>
        <DrawerHeader className="px-5 pb-2 pt-3 text-left">
          <DrawerTitle className="text-lg font-semibold text-foreground">{title}</DrawerTitle>
          <DrawerDescription className={hint ? "text-sm text-muted" : "sr-only"}>{hint || title}</DrawerDescription>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
