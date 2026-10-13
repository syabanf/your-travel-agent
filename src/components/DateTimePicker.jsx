import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { differenceInCalendarDays, format, isValid, parse, startOfToday } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { PickerSheet, PickerTile } from "@/components/picker";

// Values travel as "YYYY-MM-DD" strings, read and written in local time.
const toDate = (s) => {
  if (!s) return undefined;
  const d = parse(s, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
};
const toISO = (d) => format(d, "yyyy-MM-dd");
const show = (s, pattern = "EEE, d MMM yyyy") => (toDate(s) ? format(toDate(s), pattern) : "");

const NAV = {
  IconLeft: () => <ChevronLeft className="size-5" aria-hidden="true" />,
  IconRight: () => <ChevronRight className="size-5" aria-hidden="true" />,
};

const FIELD =
  "flex h-11 w-full items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 text-left text-base text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 md:text-sm";

/**
 * One date from a calendar sheet, or a time from the device's own picker.
 * `min` ("YYYY-MM-DD") greys out earlier days. `caption` swaps the plain
 * field for a tile with the label inside, as in the Book search form.
 * `years` ([from, to]) adds month and year dropdowns, for dates far back
 * such as a birthday.
 */
export default function DateTimePicker({ value, onChange, type = "date", label, min, caption, years }) {
  const [open, setOpen] = useState(false);

  if (type === "time") {
    return (
      <label className={`${FIELD} cursor-pointer`}>
        <Clock className="size-4 shrink-0 text-accent" aria-hidden="true" />
        <input type="time" value={value || ""} onChange={(e) => onChange(e.target.value)} aria-label={label || "Time"} className="min-w-0 flex-1 bg-transparent outline-none" />
      </label>
    );
  }

  const selected = toDate(value);
  const pick = (day) => {
    if (day) onChange(toISO(day));
    setOpen(false);
  };

  return (
    <>
      {caption ? (
        <PickerTile icon={Calendar} label={caption} value={show(value)} placeholder="Select date" onClick={() => setOpen(true)} />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={FIELD}>
          <Calendar className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <span className={`truncate ${selected ? "" : "text-muted"}`}>{show(value) || "Select date"}</span>
        </button>
      )}
      <PickerSheet open={open} onOpenChange={setOpen} title={label || caption || "Select date"}>
        <div className="px-4 pb-6 safe-b">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={pick}
            defaultMonth={selected || toDate(min) || (years ? new Date(years[1] - 30, 0) : undefined)}
            disabled={min ? { before: toDate(min) } : undefined}
            components={NAV}
            {...(years ? { captionLayout: "dropdown-buttons", fromYear: years[0], toYear: years[1] } : {})}
          />
        </div>
      </PickerSheet>
    </>
  );
}

/**
 * Check-in and check-out on one calendar, the way hotel apps do it: the first
 * tap sets the start, the second sets the end and closes. Past days are off.
 */
export function DateRangePicker({ from, to, onChange, labels = ["Check-in", "Check-out"], unit = "night" }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({});
  const today = startOfToday();
  const range = { from: toDate(draft.from), to: toDate(draft.to) };
  const count = range.from && range.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const savedCount = toDate(from) && toDate(to) ? differenceInCalendarDays(toDate(to), toDate(from)) : 0;
  const plural = (n) => `${n} ${unit}${n > 1 ? "s" : ""}`;

  const openSheet = () => {
    setDraft({ from, to });
    setOpen(true);
  };

  const close = (next) => {
    if (!next && draft.from && draft.from !== from) onChange({ from: draft.from, to: draft.to || "" });
    setOpen(next);
  };

  const pick = (_, day) => {
    if (!range.from || range.to || day <= range.from) {
      setDraft({ from: toISO(day), to: "" });
      return;
    }
    onChange({ from: draft.from, to: toISO(day) });
    setOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <PickerTile label={labels[0]} value={show(from, "EEE, d MMM")} placeholder="Add date" onClick={openSheet} />
        <PickerTile label={labels[1]} value={show(to, "EEE, d MMM")} placeholder="Add date" onClick={openSheet} />
      </div>
      {savedCount > 0 && <p className="px-1 text-xs font-semibold text-muted">{plural(savedCount)}</p>}
      <PickerSheet
        open={open}
        onOpenChange={close}
        title={`${labels[0]} and ${labels[1].toLowerCase()}`}
        hint={!range.from ? `Pick your ${labels[0].toLowerCase()} date.` : !range.to ? `Now pick your ${labels[1].toLowerCase()} date.` : plural(count)}
      >
        <div className="px-4 pb-6 safe-b">
          <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
            {[[labels[0], draft.from], [labels[1], draft.to]].map(([l, v], i) => (
              <div key={l} className={`rounded-2xl px-3 py-2 ${i === (range.from ? 1 : 0) && !range.to ? "bg-accent-soft" : "bg-surface-2"}`}>
                <span className="eyebrow block">{l}</span>
                <span className={`font-semibold ${v ? "text-foreground" : "text-muted"}`}>{show(v, "EEE, d MMM") || "Add date"}</span>
              </div>
            ))}
          </div>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={pick}
            defaultMonth={range.from || today}
            disabled={{ before: today }}
            components={NAV}
          />
        </div>
      </PickerSheet>
    </>
  );
}
