// Reusable dashboard table. columns: [{ key, label, align?, render?(row), className? }].
// Wrapped in overflow-x-auto + min-width so it scrolls within its card on mobile.
export default function DataTable({ columns, rows, rowKey = (r) => r.id, onRowClick, empty = "No records.", minWidth = 640 }) {
  return (
    <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/60 bg-mora-primary/[0.02] border-b border-mora-primary/[0.07]">
              {columns.map((c) => (
                <th key={c.key} className={`px-5 py-3.5 font-semibold ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="stagger">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-mora-neutral/60">{empty}</td></tr>
            ) : rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-mora-primary/5 last:border-0 transition-colors hover:bg-mora-gold/[0.035] ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3.5 ${c.align === "right" ? "text-right" : ""} ${c.className || "text-mora-neutral"}`}>
                    {c.render ? c.render(row) : (row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
