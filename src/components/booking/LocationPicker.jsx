import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, Check, Flame, History, MapPin, Plane, Search, Ship, TrainFront, X } from "lucide-react";
import { PickerSheet, PickerTile } from "@/components/picker";
import { PLACES, placeOptions, searchPlaces } from "@/data/places";
import useMasterData from "@/lib/useMasterData";

const KIND_ICON = { airport: Plane, station: TrainFront, port: Ship, area: MapPin, city: Building2 };

// The last few places a traveller picked, per search mode. A convenience only.
const RECENT_KEY = "ich_recent_places";
const readRecent = (mode) => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "{}")[mode] || []; } catch { return []; }
};
const saveRecent = (mode, row) => {
  try {
    const all = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
    all[mode] = [row, ...(all[mode] || []).filter((r) => r.value !== row.value)].slice(0, 4);
    localStorage.setItem(RECENT_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
};

/**
 * Searchable place picker for the Book form: tap the tile, type a city,
 * airport code or area, pick a row. With no query it lists recent picks and
 * popular places. Anything typed can still be used as is.
 */
export default function LocationPicker({ mode, label, value, onChange, placeholder, icon = MapPin, exclude }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const listId = useId();

  const places = useMasterData("Place", PLACES, "city");
  const options = useMemo(() => placeOptions(mode, places).filter((r) => r.value !== exclude), [mode, places, exclude]);
  const typed = query.trim();
  const matches = searchPlaces(options, typed);
  const exact = matches.some((r) => r.title.toLowerCase() === typed.toLowerCase() || r.value.toLowerCase() === typed.toLowerCase());
  const rows = typed
    ? [...matches, ...(exact ? [] : [{ value: typed, title: `Use "${typed}"`, sub: "Search this place as typed", kind: "search" }])]
    : [];
  const sections = typed
    ? [{ title: `${matches.length} place${matches.length === 1 ? "" : "s"}`, rows }]
    : [
        { title: "Recent", icon: History, rows: recent.filter((r) => r.value !== exclude) },
        { title: "Popular", icon: Flame, rows: options.filter((r) => r.popular).slice(0, 8) },
      ].filter((s) => s.rows.length);
  const flat = sections.flatMap((s) => s.rows);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setRecent(readRecent(mode));
    // The drawer animates in; focus once it has mounted.
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, mode]);

  const choose = (row) => {
    if (row.kind !== "search") saveRecent(mode, row);
    onChange(row.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && flat[active]) { e.preventDefault(); choose(flat[active]); }
  };

  let index = -1;
  return (
    <>
      <PickerTile icon={icon} label={label} value={value} placeholder={placeholder} onClick={() => setOpen(true)} />
      <PickerSheet open={open} onOpenChange={setOpen} title={label} tall>
        <div className="px-5 pb-3">
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/30">
            <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
              placeholder={mode === "flight" ? "City, airport or code" : "City, area or place"}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={flat[active] ? `${listId}-${active}` : undefined}
              aria-label={`Search ${label.toLowerCase()}`}
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted focus-visible:outline-none md:text-sm"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search" className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground">
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div id={listId} role="listbox" aria-label={label} className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 safe-b">
          {sections.map((s) => (
            <div key={s.title} role="group" aria-label={s.title} className="mb-2">
              <p className="eyebrow flex items-center gap-1.5 px-2 pb-1 pt-2">
                {s.icon && <s.icon className="size-3.5" aria-hidden="true" />}{s.title}
              </p>
              {s.rows.map((row) => {
                index += 1;
                const i = index;
                const Icon = row.kind === "search" ? Search : KIND_ICON[row.kind] || MapPin;
                const isSelected = row.value === value;
                return (
                  <button
                    key={`${row.kind}-${row.value}`}
                    id={`${listId}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => choose(row)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors ${i === active ? "bg-surface-2" : ""}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface">
                      <Icon className="size-4 text-accent" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{row.title}</span>
                      <span className="block truncate text-xs text-muted">{row.sub}</span>
                    </span>
                    {row.code && <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 font-mono text-xs font-semibold text-body">{row.code}</span>}
                    {isSelected && <Check className="size-4 shrink-0 text-accent-strong" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
          {typed && !matches.length && (
            <p className="px-2 pt-1 text-xs text-muted">No match in our list. You can still search it as typed.</p>
          )}
        </div>
      </PickerSheet>
    </>
  );
}
