import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

export default function MobileTimePicker({ value, onChange, label, placeholder = "Select time" }) {
  const [open, setOpen] = useState(false);
  const [selHour, setSelHour] = useState(value?.split(":")?.[0] || "09");
  const [selMin, setSelMin] = useState(value?.split(":")?.[1]?.slice(0,2) || "00");

  const handleConfirm = () => {
    onChange(`${selHour}:${selMin}`);
    setOpen(false);
  };

  const displayValue = value || null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-sm text-left outline-none"
      >
        <Clock className="w-4 h-4 text-gold/50 flex-shrink-0" />
        <span className={displayValue ? "text-mora-white" : "text-mora-neutral/40"}>{displayValue || placeholder}</span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="border-t border-white/10" style={{ background: "rgba(26,46,34,0.97)", backdropFilter: "blur(30px)" }}>
          {label && (
            <DrawerHeader className="pb-1">
              <DrawerTitle className="text-sm font-semibold text-mora-white text-center">{label}</DrawerTitle>
            </DrawerHeader>
          )}
          <div className="px-5 pb-8">
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Hours */}
              <div>
                <p className="text-[10px] text-gold uppercase tracking-widest mb-2 text-center">Hour</p>
                <div className="max-h-48 overflow-y-auto space-y-1 hide-scrollbar">
                  {HOURS.map(h => (
                    <button key={h} onClick={() => setSelHour(h)}
                      className={cn("w-full py-2.5 rounded-xl text-sm font-medium transition-all",
                        selHour === h ? "glass-gold text-gold" : "text-mora-white/70 hover:bg-white/5"
                      )}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              {/* Minutes */}
              <div>
                <p className="text-[10px] text-gold uppercase tracking-widest mb-2 text-center">Minute</p>
                <div className="max-h-48 overflow-y-auto space-y-1 hide-scrollbar">
                  {MINUTES.map(m => (
                    <button key={m} onClick={() => setSelMin(m)}
                      className={cn("w-full py-2.5 rounded-xl text-sm font-medium transition-all",
                        selMin === m ? "glass-gold text-gold" : "text-mora-white/70 hover:bg-white/5"
                      )}>
                      :{m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleConfirm}
              className="w-full py-3 glass-gold rounded-xl text-sm font-semibold text-gold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Set {selHour}:{selMin}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}