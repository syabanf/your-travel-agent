import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * MobileSelect — a select component that shows a native-style bottom drawer on mobile.
 * Props:
 *   value, onChange, options: [{value, label}], placeholder, label, className
 */
export default function MobileSelect({ value, onChange, options = [], placeholder = "Select...", label, className }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center justify-between gap-2",
          "bg-white/5 border border-white/10 rounded-xl h-10 px-3",
          "text-sm text-left outline-none transition-colors",
          selected ? "text-mora-white" : "text-mora-neutral/40",
          className
        )}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown className="w-4 h-4 text-mora-neutral/40 flex-shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="glass-nav border-t border-white/10">
          {label && (
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-sm font-semibold text-mora-white text-center">{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-4 pb-8 space-y-1 max-h-[60vh] overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm transition-all",
                  opt.value === value
                    ? "glass-gold text-gold"
                    : "text-mora-white/80 hover:bg-white/5"
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="w-4 h-4 text-gold" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}