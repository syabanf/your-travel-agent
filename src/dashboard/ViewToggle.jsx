import { LayoutGrid, Table2 } from "lucide-react";

// Cards / Table segmented toggle. value: "cards" | "table".
export default function ViewToggle({ value, onChange }) {
  const opt = (key, Icon, label) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={value === key}
      title={label}
      className={`flex items-center gap-1.5 px-3 h-[2.6rem] rounded-lg text-sm font-medium transition-colors ${
        value === key ? "bg-ich-gold/10 text-gold" : "text-ich-neutral hover:bg-ich-primary/5"
      }`}
    >
      <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl border border-ich-primary/10 bg-white shrink-0">
      {opt("table", Table2, "Table")}
      {opt("cards", LayoutGrid, "Cards")}
    </div>
  );
}
