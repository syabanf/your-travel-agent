import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { formatIDR } from "@/lib/currency";
import { BRAND, SERIES, TOOLTIP_STYLE } from "@/lib/brand";

// Period-over-period delta pill. pct: signed integer % (null = nothing to compare).
// higherIsBetter flips the colour for "good when it goes down" metrics (e.g. outstanding).
export function Delta({ pct, label, higherIsBetter = true, className = "" }) {
  if (pct == null) {
    return <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium text-muted ${className}`}>—{label && <span className="text-muted"> {label}</span>}</span>;
  }
  if (pct === 0) {
    return <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted ${className}`}><Minus className="w-3 h-3" />0%{label && <span className="font-medium text-muted"> {label}</span>}</span>;
  }
  const up = pct > 0;
  const good = higherIsBetter ? up : !up;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${good ? "text-emerald-600" : "text-accent-strong"} ${className}`}>
      <Icon className="w-3 h-3" />{Math.abs(pct)}%{label && <span className="font-medium opacity-70"> {label}</span>}
    </span>
  );
}

// Shared chart theme + reusable chart cards for the dashboard.
export const PALETTE = SERIES;
const TICK = { fontSize: 11, fill: BRAND.muted };
const AXLINE = BRAND.border;
const TT = { contentStyle: TOOLTIP_STYLE };
const fmtShort = (v) => formatIDR(v, { symbol: false });

const Empty = ({ h }) => <div style={{ height: h }} className="flex items-center justify-center text-sm text-muted">No data yet</div>;

export function ChartCard({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`min-w-0 rounded-card bg-card p-5 shadow-card ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base font-semibold leading-tight text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Horizontal category bars. data: [{ name, value }]
export function CategoryBars({ data, money = true, height = 220 }) {
  if (!data?.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={AXLINE} horizontal={false} />
        <XAxis type="number" tick={TICK} tickLine={false} axisLine={false} tickFormatter={money ? fmtShort : undefined} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={TICK} tickLine={false} axisLine={false} width={96} />
        <Tooltip {...TT} formatter={(v) => (money ? formatIDR(v) : v)} cursor={{ fill: "rgba(15, 26, 21,0.04)" }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((d, i) => <Cell key={i} fill={d.color || PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Time-series area. data: [{ label, value }]
export function TrendArea({ data, money = true, height = 220, color = BRAND.accent }) {
  if (!data?.length) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke={AXLINE} vertical={false} />
        <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={TICK} tickLine={false} axisLine={false} width={money ? 54 : 30} tickFormatter={money ? fmtShort : undefined} allowDecimals={false} />
        <Tooltip {...TT} formatter={(v) => (money ? formatIDR(v) : v)} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#trendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Donut. data: [{ name, value, color? }]
export function MixDonut({ data, height = 220 }) {
  if (!data?.length || data.every((d) => !d.value)) return <Empty h={height} />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data.filter((d) => d.value)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={82} paddingAngle={2} label={(d) => d.value} labelLine={false}>
          {data.filter((d) => d.value).map((d, i) => <Cell key={i} fill={d.color || PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip {...TT} />
      </PieChart>
    </ResponsiveContainer>
  );
}
