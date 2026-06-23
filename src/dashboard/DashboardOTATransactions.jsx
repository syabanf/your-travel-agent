import { useState } from "react";
import moment from "moment";
import { formatIDR } from "@/lib/currency";
import { Search, Download, Receipt, Wallet, Percent, TrendingUp } from "lucide-react";
import { OTA_TRANSACTIONS, OTA_CHANNEL_NAMES, OTA_STATUSES } from "@/dashboard/opsData";
import { downloadCSV } from "@/lib/csv";
import DataTable from "@/dashboard/DataTable";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";

const TX_BADGE = { paid: "bg-emerald-100 text-emerald-700", pending: "bg-mora-gold/15 text-gold", refunded: "bg-slate-100 text-slate-500" };

export default function DashboardOTATransactions() {
  const [query, setQuery] = useState("");
  const [channelF, setChannelF] = useState("all");
  const [statusF, setStatusF] = useState("all");

  const filtered = OTA_TRANSACTIONS.filter((t) => {
    const q = query.trim().toLowerCase();
    const mq = !q || [t.ref, t.guest, t.listing].some((v) => (v || "").toLowerCase().includes(q));
    return mq && (channelF === "all" || t.channel === channelF) && (statusF === "all" || t.status === statusF);
  });
  const pg = usePagination(filtered, 12, `${query}|${channelF}|${statusF}`);

  const gross = filtered.reduce((s, t) => s + t.gross, 0);
  const commission = filtered.reduce((s, t) => s + t.commission, 0);
  const net = filtered.reduce((s, t) => s + t.net, 0);

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
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> Distribution</p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">OTA Transactions</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Every booking transaction across your connected channels.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardAiStub resource="ota" />
          <button onClick={exportCSV} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger">
        <Kpi icon={Receipt} label="Transactions" value={filtered.length} />
        <Kpi icon={Wallet} label="Gross revenue" value={formatIDR(gross)} />
        <Kpi icon={Percent} label="Commission" value={formatIDR(commission)} />
        <Kpi icon={TrendingUp} label="Net revenue" value={formatIDR(net)} />
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
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="dash-input max-w-[150px] capitalize">
          <option value="all">All status</option>
          {OTA_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={pg.pageItems} minWidth={860} empty="No transactions match your filters." />
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
