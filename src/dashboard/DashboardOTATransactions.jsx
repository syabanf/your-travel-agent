import { useState } from "react";
import moment from "moment";
import { formatIDR } from "@/lib/currency";
import { Search, Download, Receipt, Wallet, Percent, TrendingUp, X } from "lucide-react";
import { OTA_TRANSACTIONS, OTA_CHANNEL_NAMES, OTA_STATUSES } from "@/dashboard/opsData";
import { downloadCSV } from "@/lib/csv";
import DataTable from "@/dashboard/DataTable";
import ViewToggle from "@/dashboard/ViewToggle";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import { ChartCard, CategoryBars, TrendArea, MixDonut } from "@/dashboard/charts";

const TX_BADGE = { paid: "bg-emerald-100 text-emerald-700", pending: "bg-mora-gold/15 text-gold", refunded: "bg-slate-100 text-slate-500" };
const DOT = { paid: "bg-emerald-500", pending: "bg-mora-gold", refunded: "bg-slate-400" };

export default function DashboardOTATransactions() {
  const [query, setQuery] = useState("");
  const [channelF, setChannelF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [view, setView] = useState("table");

  // Scope = everything except the status filter, so the status chips show live counts.
  const scoped = OTA_TRANSACTIONS.filter((t) => {
    const q = query.trim().toLowerCase();
    const mq = !q || [t.ref, t.guest, t.listing].some((v) => (v || "").toLowerCase().includes(q));
    return mq && (channelF === "all" || t.channel === channelF);
  });
  const statusCounts = {};
  scoped.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
  const filtered = scoped.filter((t) => statusF === "all" || t.status === statusF);
  const pg = usePagination(filtered, view === "cards" ? 9 : 12, `${query}|${channelF}|${statusF}|${view}`);

  const gross = filtered.reduce((s, t) => s + t.gross, 0);
  const commission = filtered.reduce((s, t) => s + t.commission, 0);
  const net = filtered.reduce((s, t) => s + t.net, 0);

  // Insight aggregations
  const channelAgg = {};
  filtered.forEach((t) => { if (!channelAgg[t.channel]) channelAgg[t.channel] = { name: t.channel, value: 0 }; channelAgg[t.channel].value += t.net; });
  const byChannel = Object.values(channelAgg).sort((a, b) => b.value - a.value);
  const dayAgg = {};
  filtered.forEach((t) => { const k = moment(t.created).format("MMM D"); if (!dayAgg[k]) dayAgg[k] = { label: k, value: 0, ts: t.created }; dayAgg[k].value += t.net; });
  const trend = Object.values(dayAgg).sort((a, b) => a.ts - b.ts);
  const statusMix = OTA_STATUSES.map((st) => ({ name: st, value: statusCounts[st] || 0, color: { paid: "#10B981", pending: "#C99A3F", refunded: "#94A3B8" }[st] }));

  const exportCSV = () => downloadCSV(
    "mora-ota-transactions",
    ["Date", "Ref", "Channel", "Guest", "Listing", "Check-in", "Nights", "Gross", "Commission", "Net", "Status"],
    filtered.map((t) => [moment(t.created).format("YYYY-MM-DD"), t.ref, t.channel, t.guest, t.listing, moment(t.checkIn).format("YYYY-MM-DD"), t.nights, t.gross, t.commission, t.net, t.status]),
  );

  const columns = [
    { key: "created", label: "Date", render: (t) => moment(t.created).format("MMM D") },
    { key: "ref", label: "Ref", className: "font-medium text-mora-primary" },
    { key: "channel", label: "Channel", render: (t) => <span className="inline-flex items-center gap-1.5"><span className="w-6 h-6 rounded-md bg-mora-gold/10 text-gold flex items-center justify-center text-[10px] font-bold uppercase">{t.channel[0]}</span>{t.channel}</span> },
    { key: "guest", label: "Guest" },
    { key: "listing", label: "Listing" },
    { key: "checkIn", label: "Check-in", render: (t) => moment(t.checkIn).format("MMM D") },
    { key: "gross", label: "Gross", align: "right", className: "text-right", render: (t) => formatIDR(t.gross) },
    { key: "commission", label: "Commission", align: "right", className: "text-right text-mora-neutral", render: (t) => t.commission ? `−${formatIDR(t.commission)}` : "—" },
    { key: "net", label: "Net", align: "right", className: "text-right font-semibold text-gold", render: (t) => formatIDR(t.net) },
    { key: "status", label: "Status", render: (t) => <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${TX_BADGE[t.status]}`}>{t.status}</span> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5" /> Distribution
            <span className="inline-flex items-center gap-1 text-emerald-600 normal-case tracking-normal"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
          </p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">OTA Transactions</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Real-time monitoring of every booking across your channels.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardAiStub resource="ota" data={filtered} />
          <button onClick={exportCSV} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 stagger">
        <Kpi icon={Receipt} label="Transactions" value={filtered.length} />
        <Kpi icon={Wallet} label="Gross revenue" value={formatIDR(gross)} />
        <Kpi icon={Percent} label="Commission" value={formatIDR(commission)} />
        <Kpi icon={TrendingUp} label="Net revenue" value={formatIDR(net)} />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Net revenue by channel" subtitle="Where your bookings come from."><CategoryBars data={byChannel} /></ChartCard>
        <ChartCard title="Net revenue over time" subtitle="Daily net across the period."><TrendArea data={trend} /></ChartCard>
        <ChartCard title="Status mix" subtitle="Paid · pending · refunded."><MixDonut data={statusMix} /></ChartCard>
      </div>

      {/* Status monitor — click a chip to filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {OTA_STATUSES.map((st) => (
          <button key={st} onClick={() => setStatusF(statusF === st ? "all" : st)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusF === st ? "border-mora-gold/40 bg-mora-gold/10 text-gold" : "border-mora-primary/10 bg-white text-mora-neutral hover:bg-mora-primary/5"}`}>
            <span className={`w-2 h-2 rounded-full ${DOT[st]}`} /> <span className="capitalize">{st}</span> <span className="font-bold text-mora-primary">{statusCounts[st] || 0}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
          <input className="dash-input pl-9" placeholder="Search ref, guest or listing…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={channelF} onChange={(e) => setChannelF(e.target.value)} className="dash-input max-w-[170px]">
          <option value="all">All channels</option>
          {OTA_CHANNEL_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {(query || channelF !== "all" || statusF !== "all") && (
          <button onClick={() => { setQuery(""); setChannelF("all"); setStatusF("all"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === "table" ? (
        <DataTable columns={columns} rows={pg.pageItems} minWidth={860} empty="No transactions match your filters." />
      ) : pg.pageItems.length === 0 ? (
        <p className="text-mora-neutral/60 text-center py-10">No transactions match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger">
          {pg.pageItems.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-mora-primary/10 p-4 hover:shadow-md transition-shadow min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-mora-gold/10 text-gold flex items-center justify-center text-[11px] font-bold uppercase shrink-0">{t.channel[0]}</span>
                  <span className="text-sm font-semibold text-mora-primary truncate">{t.channel}</span>
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize shrink-0 ${TX_BADGE[t.status]}`}>{t.status}</span>
              </div>
              <p className="text-xs text-mora-neutral mb-0.5"><span className="font-medium text-mora-primary">{t.ref}</span> · {t.guest}</p>
              <p className="text-xs text-mora-neutral/60 truncate mb-3">{t.listing}</p>
              <div className="flex items-end justify-between gap-2 border-t border-mora-primary/5 pt-3">
                <div className="text-[11px] text-mora-neutral/60 leading-relaxed">
                  <div>{moment(t.created).format("MMM D")} · stay {moment(t.checkIn).format("MMM D")}</div>
                  <div>commission −{formatIDR(t.commission)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="stat-value text-base font-display font-bold text-gold">{formatIDR(t.net)}</div>
                  <div className="text-[10px] text-mora-neutral/50 uppercase tracking-wider">net</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="transactions" />
    </div>
  );
}

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
    <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-gold" /></div>
    <p className="stat-value text-lg lg:text-xl font-display font-bold text-mora-primary">{value}</p>
    <p className="text-xs text-mora-neutral mt-1">{label}</p>
  </div>
);
