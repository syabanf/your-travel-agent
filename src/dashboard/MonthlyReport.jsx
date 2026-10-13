import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, Minus, Printer } from "lucide-react";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { downloadCSV } from "@/lib/csv";
import { formatIDR, formatIDRCompact } from "@/lib/currency";
import { change, monthlyReport } from "@/lib/monthlyReport";
import { monthlyReportHTML, printDocument } from "@/lib/voucher";
import { BRAND } from "@/lib/brand";

const MODES = [
  { value: "both", label: "vs last month and last year" },
  { value: "prev", label: "vs previous month" },
  { value: "yoy", label: "vs same month last year" },
];
const MONTHS = Array.from({ length: 24 }, (_, i) => moment().subtract(i, "months")).map((m) => ({ value: m.format("YYYY-MM"), label: m.format("MMMM YYYY") }));

const show = (v, format) => (format === "pct" ? `${v}%` : format === "count" ? String(v) : formatIDR(v));

/** A change cell, green when it is good news for the row and red when it isn't. */
function Delta({ cur, base, better, format }) {
  const c = change(cur, base);
  if (!c.abs) return <span className="inline-flex items-center gap-0.5 text-muted"><Minus className="size-3" aria-hidden="true" />0</span>;
  const good = (c.abs > 0) === (better === "up");
  const Icon = c.abs > 0 ? ArrowUpRight : ArrowDownRight;
  const text = format === "pct" ? `${c.abs > 0 ? "+" : ""}${Math.round(c.abs * 10) / 10} pt`
    : c.pct === null ? "new"
    : c.pct >= 100 && base > 0 ? `${(cur / base).toFixed(1)}×`
    : `${c.pct > 0 ? "+" : ""}${c.pct}%`;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${good ? "text-success" : "text-accent-strong"}`} title={format === "pct" ? undefined : `${c.abs > 0 ? "+" : "−"}${formatIDR(Math.abs(c.abs))}`}>
      <Icon className="size-3.5" aria-hidden="true" />{text}
    </span>
  );
}

const TH = "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted first:text-left first:pl-5";
const TD = "px-4 py-2.5 text-right text-sm tabular-nums first:pl-5 first:text-left";

/**
 * Monthly report: one month's P&L and key figures against last month, the
 * same month last year and year to date, with a 12-month trend. Prints to
 * PDF and exports to CSV in the same layout.
 */
export default function MonthlyReport({ entries, accounts, bookings }) {
  const [params, setParams] = useSearchParams();
  const month = params.get("month") || moment().format("YYYY-MM");
  const mode = params.get("vs") || "both";
  const set = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) n.set(k, v); return n; }, { replace: true });
  const shift = (n) => set({ month: moment(`${month}-01`).add(n, "months").format("YYYY-MM") });

  const r = useMemo(() => monthlyReport(entries, accounts, bookings, month), [entries, accounts, bookings, month]);
  const m = moment(`${month}-01`);
  const names = { cur: m.format("MMM YYYY"), prev: m.clone().subtract(1, "month").format("MMM YYYY"), yoy: m.clone().subtract(1, "year").format("MMM YYYY") };
  const bases = mode === "both" ? ["prev", "yoy"] : [mode];
  const toDate = m.isSame(moment(), "month");
  const isLatest = !moment(`${month}-01`).isBefore(moment().startOf("month"));

  const exportCSV = () => {
    const delta = (v, k) => { const c = change(v.cur, v[k]); return [v[k], c.abs, c.pct ?? ""]; };
    downloadCSV(`ich-monthly-report-${month}`, ["Section", "Item", names.cur, names.prev, "Change", "Change %", names.yoy, "Change", "Change %", `YTD ${m.year()}`, `YTD ${m.year() - 1}`, "Change", "Change %"], [
      ...[...r.pnl.map((x) => ({ ...x, section: x.section })), ...r.metrics.map((x) => ({ ...x, section: "Key figures" }))].map((x) => [
        x.section, x.label, x.values.cur, ...delta(x.values, "prev"), ...delta(x.values, "yoy"),
        ...(x.balance || x.format === "pct" ? ["", "", "", ""] : [x.values.ytd, ...(() => { const c = change(x.values.ytd, x.values.ytdLy); return [x.values.ytdLy, c.abs, c.pct ?? ""]; })()]),
      ]),
      [], ["Trend", "Month", "Revenue", "Gross profit", "Operating expenses", "Net profit"],
      ...r.trend.map((t) => ["Trend", t.month, t.revenue, t.gross, t.expense, t.net]),
    ]);
  };

  const highlight = ["Total revenue", "Gross profit", "Net profit"].map((l) => r.pnl.find((x) => x.label === l));
  const tiles = [...highlight.map((x) => ({ label: x.label.replace("Total ", ""), ...x })), { ...r.metrics[0] }];

  const section = (title, rows, withYtd) => (
    <section className="overflow-hidden rounded-card bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>{title}</th>
              <th className={TH}>{names.cur}</th>
              {bases.map((k) => [<th key={k} className={TH}>{names[k]}</th>, <th key={`${k}d`} className={TH}>Change</th>])}
              {withYtd && [<th key="y" className={`${TH} border-l border-border`}>YTD {m.year()}</th>, <th key="yl" className={TH}>YTD {m.year() - 1}</th>, <th key="yd" className={TH}>Change</th>]}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.label} className={x.total ? "bg-surface-2 font-semibold" : "border-b border-border"}>
                <td className={`${TD} whitespace-nowrap ${x.total ? "text-foreground" : "pl-8 text-body"}`}>{x.label}</td>
                <td className={`${TD} font-semibold text-foreground`}>{show(x.values.cur, x.format)}</td>
                {bases.map((k) => [
                  <td key={k} className={`${TD} text-body`}>{show(x.values[k], x.format)}</td>,
                  <td key={`${k}d`} className={TD}><Delta cur={x.values.cur} base={x.values[k]} better={x.better} format={x.format} /></td>,
                ])}
                {withYtd && (x.balance || x.format === "pct"
                  ? [<td key="y" className={`${TD} border-l border-border text-muted`} colSpan={3}>{x.balance ? "Balance, see month end" : ""}</td>]
                  : [
                    <td key="y" className={`${TD} border-l border-border text-foreground`}>{show(x.values.ytd, x.format)}</td>,
                    <td key="yl" className={`${TD} text-body`}>{show(x.values.ytdLy, x.format)}</td>,
                    <td key="yd" className={TD}><Delta cur={x.values.ytd} base={x.values.ytdLy} better={x.better} format={x.format} /></td>,
                  ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface"><ChevronLeft className="size-5" aria-hidden="true" /></button>
          <div className="w-48"><SearchableSelect value={month} onChange={(v) => set({ month: v })} options={MONTHS} ariaLabel="Report month" /></div>
          <button type="button" onClick={() => shift(1)} disabled={isLatest} aria-label="Next month" title={isLatest ? "This is the current month" : undefined} className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface disabled:opacity-30"><ChevronRight className="size-5" aria-hidden="true" /></button>
          <div className="w-64"><SearchableSelect value={mode} onChange={(v) => set({ vs: v })} options={MODES} ariaLabel="Compare with" /></div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCSV} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border"><Download className="size-4" aria-hidden="true" /> CSV</button>
          <button type="button" onClick={() => printDocument(`Monthly report ${r.label}`, monthlyReportHTML(r, { bases, names, toDate }), { wide: true })} className="sheen inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-2"><Printer className="size-4" aria-hidden="true" /> Print or PDF</button>
        </div>
      </div>

      <section className="rounded-card bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground">Monthly report · {r.label}</h2>
          {toDate && <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">Month to date, {moment().format("D MMM")}</span>}
        </div>
        <ul className="mt-2 space-y-1 text-sm text-body">
          {r.summary.map((s) => <li key={s} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />{s}</li>)}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-card bg-card p-4 shadow-card">
            <p className="eyebrow">{t.label}</p>
            <p className={`stat-value mt-1 text-lg font-extrabold sm:text-xl ${t.values.cur < 0 ? "text-accent-strong" : "text-foreground"}`}>{show(t.values.cur, t.format)}</p>
            <div className="mt-1.5 space-y-0.5 text-xs">
              {["prev", "yoy"].map((k) => (
                <p key={k} className="flex items-center justify-between gap-2 text-muted">vs {names[k]} <Delta cur={t.values.cur} base={t.values[k]} better={t.better} format={t.format} /></p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {section("Profit and loss", r.pnl, true)}
      {section("Key figures", r.metrics, true)}

      <section className="rounded-card bg-card p-5 shadow-card">
        <h2 className="text-base font-semibold text-foreground">12-month trend</h2>
        <p className="mb-3 text-xs text-muted">Revenue and operating expenses as bars, net profit as the line.</p>
        <div role="img" aria-label={`Revenue and net profit from ${r.trend[0].month} to ${r.trend.at(-1).month}`}>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={r.trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.chartMuted} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: BRAND.muted }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: BRAND.muted }} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => formatIDRCompact(v).replace("Rp ", "")} />
              <Tooltip formatter={(v, n) => [formatIDR(v), n]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill={BRAND.ink} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Operating expenses" fill={BRAND.chartMuted} radius={[4, 4, 0, 0]} />
              <Line dataKey="net" name="Net profit" stroke={BRAND.accent} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
