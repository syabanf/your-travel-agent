import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export default function MobileDatePicker({ value, onChange, label, placeholder = "Select date" }) {
  const [open, setOpen] = useState(false);

  const parsed = value ? new Date(value + "T00:00:00") : null;
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelect = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const displayValue = parsed
    ? parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-sm text-left outline-none transition-colors"
      >
        <Calendar className="w-4 h-4 text-gold/50 flex-shrink-0" />
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
            {/* Month/Year nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="w-8 h-8 glass-light rounded-lg flex items-center justify-center text-mora-neutral/70">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <p className="text-sm font-semibold text-mora-white">{MONTHS[viewMonth]} {viewYear}</p>
              <button onClick={nextMonth} className="w-8 h-8 glass-light rounded-lg flex items-center justify-center text-mora-neutral/70">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} className="text-center text-[10px] text-mora-neutral/40 py-1">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const mm = String(viewMonth + 1).padStart(2, "0");
                const dd = String(day).padStart(2, "0");
                const dateStr = `${viewYear}-${mm}-${dd}`;
                const isSelected = value === dateStr;
                return (
                  <button
                    key={day}
                    onClick={() => handleSelect(day)}
                    className={cn(
                      "h-9 rounded-lg text-xs font-medium transition-all",
                      isSelected ? "glass-gold text-gold" : "text-mora-white/80 hover:bg-white/10"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}