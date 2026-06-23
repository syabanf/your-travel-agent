import { useState } from "react";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";
import { Plug, RefreshCw, Globe, CalendarCheck, Wallet, Plus } from "lucide-react";
import DataTable from "@/dashboard/DataTable";
import DashboardAiStub from "@/dashboard/DashboardAiStub";

// Mock OTA channel-manager data (no backend — demo only).
const SEED = [
  { id: "bookingcom", name: "Booking.com", status: "connected", listings: 24, bookings: 86, revenue: 412000000, commission: 15, lastSync: "2m ago" },
  { id: "agoda", name: "Agoda", status: "connected", listings: 22, bookings: 64, revenue: 298000000, commission: 18, lastSync: "5m ago" },
  { id: "traveloka", name: "Traveloka", status: "connected", listings: 26, bookings: 73, revenue: 251000000, commission: 12, lastSync: "3m ago" },
  { id: "expedia", name: "Expedia", status: "connected", listings: 18, bookings: 41, revenue: 205000000, commission: 17, lastSync: "12m ago" },
  { id: "tiket", name: "Tiket.com", status: "syncing", listings: 20, bookings: 38, revenue: 132000000, commission: 12, lastSync: "syncing…" },
  { id: "airbnb", name: "Airbnb", status: "disconnected", listings: 0, bookings: 0, revenue: 0, commission: 14, lastSync: "—" },
];

const STATUS = {
  connected: "bg-emerald-100 text-emerald-700",
  syncing: "bg-mora-gold/15 text-gold",
  disconnected: "bg-slate-100 text-slate-500",
};

export default function DashboardOTA() {
  const [channels, setChannels] = useState(SEED);
  const [syncing, setSyncing] = useState(false);

  const connected = channels.filter((c) => c.status === "connected").length;
  const listings = channels.reduce((s, c) => s + c.listings, 0);
  const bookings = channels.reduce((s, c) => s + c.bookings, 0);
  const revenue = channels.reduce((s, c) => s + c.revenue, 0);

  const syncAll = () => {
    setSyncing(true);
    setTimeout(() => {
      setChannels((prev) => prev.map((c) => (c.status === "disconnected" ? c : { ...c, status: "connected", lastSync: "just now" })));
      setSyncing(false);
      toast.success("All channels synced");
    }, 1100);
  };

  const toggle = (ch) => {
    setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, status: c.status === "disconnected" ? "connected" : "disconnected", lastSync: c.status === "disconnected" ? "just now" : "—" } : c));
    toast(ch.status === "disconnected" ? `${ch.name} connected` : `${ch.name} disconnected`);
  };

  const columns = [
    { key: "name", label: "Channel", className: "font-medium text-mora-primary", render: (c) => (
      <span className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-mora-gold/10 text-gold flex items-center justify-center text-xs font-display font-bold uppercase">{c.name[0]}</span>{c.name}</span>
    ) },
    { key: "status", label: "Status", render: (c) => <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${STATUS[c.status]}`}>{c.status}</span> },
    { key: "listings", label: "Listings", align: "right", render: (c) => c.listings },
    { key: "bookings", label: "Bookings (30d)", align: "right", render: (c) => c.bookings },
    { key: "revenue", label: "Revenue", align: "right", className: "text-right font-semibold text-gold", render: (c) => c.revenue ? formatIDR(c.revenue) : "—" },
    { key: "commission", label: "Commission", align: "right", render: (c) => `${c.commission}%` },
    { key: "lastSync", label: "Last sync", render: (c) => c.lastSync },
    { key: "action", label: "", align: "right", render: (c) => (
      <button onClick={(e) => { e.stopPropagation(); toggle(c); }} className={`text-xs font-medium px-3 py-1.5 rounded-lg press ${c.status === "disconnected" ? "btn-primary text-white" : "border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5"}`}>
        {c.status === "disconnected" ? "Connect" : "Disconnect"}
      </button>
    ) },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Distribution</p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">OTA Channel Manager</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Connect and sync listings across online travel agencies.</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardAiStub resource="ota" />
          <button onClick={syncAll} disabled={syncing} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> Sync all
          </button>
          <button onClick={() => toast("Connect a new channel (demo)")} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add channel</button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger">
        <Kpi icon={Plug} label="Connected channels" value={`${connected} / ${channels.length}`} />
        <Kpi icon={Globe} label="Active listings" value={listings} />
        <Kpi icon={CalendarCheck} label="Bookings (30d)" value={bookings} />
        <Kpi icon={Wallet} label="Channel revenue" value={formatIDR(revenue)} />
      </div>

      <DataTable columns={columns} rows={channels} empty="No channels connected." />
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
