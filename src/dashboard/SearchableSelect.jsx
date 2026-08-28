import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";

// A searchable dropdown (combobox) that drops in for a native <select>.
// options: array of { value, label, icon? } or plain strings.
// onChange receives the selected VALUE directly (not an event).
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  className = "",
  disabled = false,
  allowClear = false,
  ariaLabel,
  leadingIcon: LeadingIcon,
}) {
  const opts = useMemo(
    () => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
    [options]
  );
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const selected = opts.find((o) => String(o.value) === String(value));
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return opts;
    return opts.filter((o) => String(o.label).toLowerCase().includes(n));
  }, [q, opts]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ(""); setActive(0);
      const rect = boxRef.current?.getBoundingClientRect();
      if (rect) setDropUp(rect.bottom > window.innerHeight - 300 && rect.top > 300);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const pick = (o) => { onChange(o.value); setOpen(false); };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) pick(filtered[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const SelIcon = selected?.icon;

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`dash-input flex items-center gap-2 text-left ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        {LeadingIcon ? <LeadingIcon className="w-4 h-4 text-gold shrink-0" /> : SelIcon ? <SelIcon className="w-4 h-4 text-gold shrink-0" /> : null}
        <span className={`flex-1 truncate ${selected ? "text-ich-primary" : "text-ich-neutral/50"}`}>
          {selected ? selected.label : placeholder}
        </span>
        {allowClear && selected && String(value) !== "" ? (
          <X className="w-3.5 h-3.5 text-ich-neutral/50 hover:text-ich-primary shrink-0" onClick={(e) => { e.stopPropagation(); onChange(""); }} />
        ) : (
          <ChevronDown className={`w-4 h-4 text-ich-neutral/50 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className={`absolute z-50 w-full min-w-[180px] bg-white rounded-xl border border-ich-primary/15 shadow-xl overflow-hidden ${dropUp ? "bottom-full mb-1.5" : "mt-1.5"}`}>
          <div className="p-2 border-b border-ich-primary/10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ich-neutral/40 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-8 pr-2 text-sm bg-ich-primary/[0.03] rounded-lg outline-none border border-transparent focus:border-ich-gold/40 text-ich-primary placeholder:text-ich-neutral/40"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length ? filtered.map((o, i) => {
              const Icon = o.icon;
              const isSel = String(o.value) === String(value);
              return (
                <li key={`${o.value}-${i}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(o)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] text-sm text-left transition-colors ${i === active ? "bg-ich-gold/10" : ""} ${isSel ? "text-gold font-medium" : "text-ich-primary"}`}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0 text-gold" />}
                    <span className="flex-1 truncate">{o.label}</span>
                    {isSel && <Check className="w-4 h-4 text-gold shrink-0" />}
                  </button>
                </li>
              );
            }) : (
              <li className="px-3 py-6 text-center text-sm text-ich-neutral/50">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
