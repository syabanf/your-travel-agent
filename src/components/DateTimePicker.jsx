import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

export default function DateTimePicker({ value, onChange, type = "date", label }) {
  const [open, setOpen] = useState(false);

  const handleDateSelect = (e) => {
    onChange(e.target.value);
    setOpen(false);
  };

  const formatDisplay = (val) => {
    if (!val) return type === "date" ? "Select date" : "Select time";
    if (type === "date") {
      const d = new Date(val + "T00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return val;
  };

  const Icon = type === "date" ? Calendar : Clock;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-sm text-mora-white text-left flex items-center gap-2 hover:border-white/20 transition-all"
      >
        <Icon className="w-4 h-4 text-gold/50 flex-shrink-0" />
        <span>{formatDisplay(value)}</span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label || (type === "date" ? "Select Date" : "Select Time")}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <input
              type={type}
              value={value}
              onChange={handleDateSelect}
              className="w-full bg-white/5 border border-white/10 rounded-xl h-12 px-3 text-mora-white text-center [color-scheme:dark]"
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}