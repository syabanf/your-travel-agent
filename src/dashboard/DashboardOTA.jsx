import { useState } from "react";
import moment from "moment";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";
import { Plug, RefreshCw, Globe, CalendarCheck, Wallet, Plus, Receipt } from "lucide-react";
import DataTable from "@/dashboard/DataTable";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import Drawer from "@/dashboard/Drawer";
import { ChartCard, CategoryBars } from "@/dashboard/charts";

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

// Deterministic mock booking transactions for a channel's detail drawer.
const GUESTS = ["Putri W.", "Andi P.", "Maria S.", "Kenji S.", "Sarah L.", "Budi H.", "Dewi A.", "Rio M."];
const LISTINGS = ["Ocean Suite · Azure Bay", "Pool Villa · Azure Bay", "Garden Villa · Ubud", "Studio Loft · Seminyak", "Spa Suite · Ubud"];
const TX_STATUS = { paid: "bg-emerald-100 text-emerald-700", pending: "bg-mora-gold/15 text-gold", refunded: "bg-slate-100 text-slate-500" };
function txnsFor(ch) {
  if (!ch || !ch.bookings) return [];
  const n = Math.min(8, Math.max(3, Math.round(ch.bookings / 10)));
  const avg = Math.max(1000000, Math.round(ch.revenue / ch.bookings / 50000) * 50000);
  const sts = ["paid", "paid", "pending", "paid", "refunded"];
  return Array.from({ length: n }, (_, i) => {
    const gross = avg + ((i % 3) - 1) * 500000;
    const commission = Math.round((gross * ch.commission) / 100);
    return {
      id: `${ch.id}-tx${i + 1}`,
      ref: `${ch.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}-${((i * 271) % 8000) + 1000}`,
      guest: GUESTS[(i + ch.name.length) % GUESTS.length],
      listing: LISTINGS[i % LISTINGS.length],
      checkIn: moment().add(i * 4 - 6, "days").format("MMM D"),
      gross, commission, net: gross - commission,
      status: sts[(i + ch.commission) % sts.length],
    };
  });
}

export default function DashboardOTA() {
  const [channels, setChannels] = useState(SEED);
  const [syncing, setSyncing] = useState(false);
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", commission: 15 });

  const addChannel = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) { toast.error("Enter a channel name"); return; }
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `ch-${channels.length + 1}`;
    if (channels.some((c) => c.id === id || c.name.toLowerCase() === name.toLowerCase())) { toast.error("That channel is already connected"); return; }
    setChannels((prev) => [...prev, { id, name, status: "connected", listings: 0, bookings: 0, revenue: 0, commission: Math.max(0, Number(form.commission) || 0), lastSync: "just now" }]);
    setAdding(false); setForm({ name: "", commission: 15 });
    toast.success(`${name} connected`);
  };

  const connected = channels.filter((c) => c.status === "connected").length;
  const listings = channels.reduce((s, c) => s + c.listings, 0);
  const bookings = channels.reduce((s, c) => s + c.bookings, 0);
  const revenue = channels.reduce((s, c) => s + c.revenue, 0);

  const revByChannel = channels.filter((c) => c.revenue > 0).map((c) => ({ name: c.name, value: c.revenue })).sort((a, b) => b.value - a.value);
  const bookByChannel = channels.filter((c) => c.bookings > 0).map((c) => ({ name: c.name, value: c.bookings })).sort((a, b) => b.value - a.value);

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
          <DashboardAiStub resource="ota" data={channels} />
          <button onClick={syncAll} disabled={syncing} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> Sync all
          </button>
          <button onClick={() => setAdding(true)} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press"><Plus className="w-4 h-4" /> Add channel</button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger">
        <Kpi icon={Plug} label="Connected channels" value={`${connected} / ${channels.length}`} />
        <Kpi icon={Globe} label="Active listings" value={listings} />
        <Kpi icon={CalendarCheck} label="Bookings (30d)" value={bookings} />
        <Kpi icon={Wallet} label="Channel revenue" value={formatIDR(revenue)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Revenue by channel" subtitle="30-day channel revenue."><CategoryBars data={revByChannel} /></ChartCard>
        <ChartCard title="Bookings by channel" subtitle="30-day booking volume."><CategoryBars data={bookByChannel} money={false} /></ChartCard>
      </div>

      <DataTable columns={columns} rows={channels} onRowClick={(c) => setDetail(c)} empty="No channels connected." />

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        icon={Receipt}
        width="max-w-2xl"
        title={detail ? `${detail.name} · booking transactions` : ""}
        subtitle={detail ? `${detail.bookings} bookings · ${detail.commission}% commission · last 30 days` : ""}
      >
        {detail && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Mini label="Bookings (30d)" value={detail.bookings} />
              <Mini label="Gross revenue" value={detail.revenue ? formatIDR(detail.revenue) : "—"} />
              <Mini label="Commission" value={detail.revenue ? formatIDR(Math.round(detail.revenue * detail.commission / 100)) : "—"} />
            </div>
            <DataTable
              columns={[
                { key: "ref", label: "Ref", className: "font-medium text-mora-primary" },
                { key: "guest", label: "Guest" },
                { key: "listing", label: "Listing" },
                { key: "checkIn", label: "Check-in" },
                { key: "gross", label: "Gross", align: "right", className: "text-right", render: (t) => formatIDR(t.gross) },
                { key: "commission", label: "Commission", align: "right", className: "text-right text-mora-neutral", render: (t) => `−${formatIDR(t.commission)}` },
                { key: "net", label: "Net", align: "right", className: "text-right font-semibold text-gold", render: (t) => formatIDR(t.net) },
                { key: "status", label: "Status", render: (t) => <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${TX_STATUS[t.status]}`}>{t.status}</span> },
              ]}
              rows={txnsFor(detail)}
              rowKey={(t) => t.id}
              minWidth={600}
              empty="No transactions for this channel yet."
            />
            <p className="text-[11px] text-mora-neutral/50">Demo data — transactions are simulated.</p>
          </>
        )}
      </Drawer>

      <Drawer open={adding} onClose={() => setAdding(false)} icon={Plus} width="max-w-md" title="Add channel" subtitle="Connect a new OTA channel">
        <form onSubmit={addChannel} className="space-y-4">
          <div>
            <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Channel name</label>
            <input autoFocus value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="dash-input" placeholder="e.g. Trip.com" />
          </div>
          <div>
            <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Commission %</label>
            <input type="number" min="0" max="100" value={form.commission} onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))} className="dash-input" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setAdding(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5">Cancel</button>
            <button type="submit" className="flex-1 btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold">Add channel</button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

const Mini = ({ label, value }) => (
  <div className="bg-white rounded-xl border border-mora-primary/10 p-3 min-w-0">
    <p className="stat-value text-sm font-display font-bold text-mora-primary">{value}</p>
    <p className="text-[11px] text-mora-neutral mt-0.5">{label}</p>
  </div>
);

const Kpi = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-mora-primary/10 p-5 min-w-0">
    <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-gold" /></div>
    <p className="stat-value text-lg lg:text-xl font-display font-bold text-mora-primary">{value}</p>
    <p className="text-xs text-mora-neutral mt-1">{label}</p>
  </div>
);
