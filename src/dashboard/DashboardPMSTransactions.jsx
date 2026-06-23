import { useState } from "react";
import moment from "moment";
import { formatIDR } from "@/lib/currency";
import { Search, Download, ClipboardList, BedDouble, Wallet, AlertCircle, X } from "lucide-react";
import { PMS_RESERVATIONS, PMS_PROPERTY_NAMES, PMS_STATUSES } from "@/dashboard/opsData";
import { downloadCSV } from "@/lib/csv";
import DataTable from "@/dashboard/DataTable";
import ViewToggle from "@/dashboard/ViewToggle";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import { ChartCard, CategoryBars, TrendArea, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";

const RES_BADGE = { confirmed: "bg-blue-100 text-blue-700", checked_in: "bg-emerald-100 text-emerald-700", checked_out: "bg-slate-100 text-slate-500", cancelled: "bg-red-100 text-red-600" };
const RES_DOT = { confirmed: "bg-blue-500", checked_in: "bg-emerald-500", checked_out: "bg-slate-400", cancelled: "bg-red-500" };
const PAY_BADGE = { paid: "bg-emerald-100 text-emerald-700", deposit: "bg-mora-gold/15 text-gold", unpaid: "bg-red-100 text-red-600" };
const label = (s) => (s || "").replace("_", " ");

export default function DashboardPMSTransactions() {
  const [query, setQuery] = useState("");
  const [propertyF, setPropertyF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [range, setRange] = useState("all");
  const [view, setView] = useState("table");

  const scoped = PMS_RESERVATIONS.filter((t) => {
    const q = query.trim().toLowerCase();
    const mq = !q || [t.res, t.guest, t.roomType].some((v) => (v || "").toLowerCase().includes(q));
    return mq && (propertyF === "all" || t.property === propertyF) && inRange(t.created, range);
  });
  const statusCounts = {};
  scoped.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const filtered = scoped.filter((t) => statusF === "all" || t.status === statusF);
  const pg = usePagination(filtered, view === "cards" ? 9 : 12, `${query}|${propertyF}|${statusF}|${range}|${view}`);

  const active = filtered.filter((t) => t.status !== "cancelled");
  const revenue = active.reduce((s, t) => s + t.amount, 0);
  const nights = active.reduce((s, t) => s + t.nights, 0);
  const outstanding = active.filter((t) => t.payment !== "paid").reduce((s, t) => s + t.amount, 0);

  // Insight aggregations
  const propAgg = {};
  active.forEach((t) => { if (!propAgg[t.property]) propAgg[t.property] = { name: t.property, value: 0 }; propAgg[t.property].value += t.amount; });
  const byProperty = Object.values(propAgg).sort((a, b) => b.value - a.value);
  const dayAgg = {};
  active.forEach((t) => { const k = moment(t.created).format("MMM D"); if (!dayAgg[k]) dayAgg[k] = { label: k, value: 0, ts: t.created }; dayAgg[k].value += t.amount; });
  const trend = Object.values(dayAgg).sort((a, b) => a.ts - b.ts);
  const statusMix = PMS_STATUSES.map((st) => ({ name: label(st), value: statusCounts[st] || 0, color: { confirmed: "#3B82F6", checked_in: "#10B981", checked_out: "#94A3B8", cancelled: "#EF4444" }[st] }));

  const exportCSV = () => downloadCSV(
    "mora-pms-reservations",
    ["Booked", "Res #", "Guest", "Property", "Room", "Source", "Check-in", "Check-out", "Nights", "Amount", "Payment", "Status"],
    filtered.map((t) => [moment(t.created).format("YYYY-MM-DD"), t.res, t.guest, t.property, t.roomType, t.source, moment(t.checkIn).format("YYYY-MM-DD"), moment(t.checkOut).format("YYYY-MM-DD"), t.nights, t.amount, t.payment, t.status]),
  );

  const columns = [
    { key: "res", label: "Res #", className: "font-medium text-mora-primary" },
    { key: "guest", label: "Guest" },
    { key: "property", label: "Property", render: (t) => <span className="inline-flex items-center gap-1.5"><span className="w-6 h-6 rounded-md bg-mora-gold/10 text-gold flex items-center justify-center text-[10px] font-bold uppercase">{t.property[0]}</span>{t.property}</span> },
    { key: "roomType", label: "Room" },
    { key: "source", label: "Source" },
    { key: "stay", label: "Stay", render: (t) => `${moment(t.checkIn).format("MMM D")} – ${moment(t.checkOut).format("MMM D")}` },
    { key: "nights", label: "Nts", align: "right", render: (t) => t.nights },
    { key: "amount", label: "Amount", align: "right", className: "text-right font-semibold text-gold", render: (t) => formatIDR(t.amount) },
    { key: "payment", label: "Payment", render: (t) => <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${PAY_BADGE[t.payment]}`}>{t.payment}</span> },
    { key: "status", label: "Status", render: (t) => <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${RES_BADGE[t.status]}`}>{label(t.status)}</span> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5" /> Operations
            <span className="inline-flex items-center gap-1 text-emerald-600 normal-case tracking-normal"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
          </p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">PMS Transactions</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Real-time monitoring of reservations, stays and folio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardAiStub resource="pms" data={filtered} />
          <button onClick={exportCSV} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 stagger">
        <Kpi icon={ClipboardList} label="Reservations" value={filtered.length} />
        <Kpi icon={Wallet} label="Room revenue" value={formatIDR(revenue)} />
        <Kpi icon={BedDouble} label="Room nights" value={nights} />
        <Kpi icon={AlertCircle} label="Outstanding" value={formatIDR(outstanding)} />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Revenue by property" subtitle="Room revenue per property."><CategoryBars data={byProperty} /></ChartCard>
        <ChartCard title="Revenue over time" subtitle="Daily booked revenue."><TrendArea data={trend} color="#05308C" /></ChartCard>
        <ChartCard title="Reservation status" subtitle="Across the current view."><MixDonut data={statusMix} /></ChartCard>
      </div>

      {/* Status monitor — click a chip to filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PMS_STATUSES.map((st) => (
          <button key={st} onClick={() => setStatusF(statusF === st ? "all" : st)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusF === st ? "border-mora-gold/40 bg-mora-gold/10 text-gold" : "border-mora-primary/10 bg-white text-mora-neutral hover:bg-mora-primary/5"}`}>
            <span className={`w-2 h-2 rounded-full ${RES_DOT[st]}`} /> <span className="capitalize">{label(st)}</span> <span className="font-bold text-mora-primary">{statusCounts[st] || 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
          <input className="dash-input pl-9" placeholder="Search res #, guest or room…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={propertyF} onChange={(e) => setPropertyF(e.target.value)} className="dash-input max-w-[200px]">
          <option value="all">All properties</option>
          {PMS_PROPERTY_NAMES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <DateRangeSelect value={range} onChange={setRange} />
        {(query || propertyF !== "all" || statusF !== "all" || range !== "all") && (
          <button onClick={() => { setQuery(""); setPropertyF("all"); setStatusF("all"); setRange("all"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === "table" ? (
        <DataTable columns={columns} rows={pg.pageItems} minWidth={920} empty="No reservations match your filters." />
      ) : pg.pageItems.length === 0 ? (
        <p className="text-mora-neutral/60 text-center py-10">No reservations match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger">
          {pg.pageItems.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-mora-primary/10 p-4 hover:shadow-md transition-shadow min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-mora-primary truncate">{t.res}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize shrink-0 ${RES_BADGE[t.status]}`}>{label(t.status)}</span>
              </div>
              <p className="text-xs text-mora-neutral mb-0.5">{t.guest}</p>
              <p className="text-xs text-mora-neutral/60 truncate">{t.roomType} · {t.property}</p>
              <p className="text-[11px] text-mora-neutral/60 mt-1">{moment(t.checkIn).format("MMM D")} – {moment(t.checkOut).format("MMM D")} · {t.nights} nts · {t.source}</p>
              <div className="flex items-center justify-between gap-2 border-t border-mora-primary/5 pt-3 mt-3">
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${PAY_BADGE[t.payment]}`}>{t.payment}</span>
                <div className="text-right">
                  <div className="stat-value text-base font-display font-bold text-gold">{formatIDR(t.amount)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="reservations" />
    </div>
  );
}

const Kpi = ({ icon: Icon, label: l, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
    <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-gold" /></div>
    <p className="stat-value text-lg lg:text-xl font-display font-bold text-mora-primary">{value}</p>
    <p className="text-xs text-mora-neutral mt-1">{l}</p>
  </div>
);
