// Reusable dashboard table. columns: [{ key, label, align?, render?(row), className? }].
// Wrapped in overflow-x-auto + min-width so it scrolls within its card on mobile.
export default function DataTable({ columns, rows, rowKey = (r) => r.id, onRowClick, empty = "No records.", minWidth = 640 }) {
  return (
    <div className="bg-card rounded-card overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted bg-surface-2 border-b border-border">
              {columns.map((c) => (
                <th key={c.key} className={`px-5 py-3.5 font-semibold ${c.align === "right" ? "text-right" : ""}`}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="stagger">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-muted">{empty}</td></tr>
            ) : rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-border last:border-0 transition-colors hover:bg-accent/[0.035] ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3.5 ${c.align === "right" ? "text-right" : ""} ${c.className || "text-muted"}`}>
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
