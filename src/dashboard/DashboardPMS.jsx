import { useState } from "react";
import { formatIDR } from "@/lib/currency";
import { toast } from "sonner";
import { Building2, BedDouble, Percent, TrendingUp, Plus, RefreshCw, Check, Minus } from "lucide-react";
import DataTable from "@/dashboard/DataTable";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import Drawer from "@/dashboard/Drawer";
import { ChartCard, CategoryBars } from "@/dashboard/charts";

// Mock property-management inventory (no backend — demo only).
const SEED = [
  { id: "azure-ocean", property: "Azure Bay Resort", roomType: "Ocean Suite", total: 18, available: 4, adr: 4200000, status: "open" },
  { id: "azure-pool", property: "Azure Bay Resort", roomType: "Pool Villa", total: 8, available: 1, adr: 6800000, status: "open" },
  { id: "ubud-garden", property: "Ubud Wellness Villa", roomType: "Garden Villa", total: 12, available: 3, adr: 3500000, status: "open" },
  { id: "ubud-spa", property: "Ubud Wellness Villa", roomType: "Spa Suite", total: 6, available: 0, adr: 5200000, status: "soldout" },
  { id: "seminyak-loft", property: "Seminyak Loft", roomType: "Studio Loft", total: 20, available: 9, adr: 1800000, status: "open" },
  { id: "kintamani-cabin", property: "Kintamani Cabin", roomType: "Mountain Cabin", total: 10, available: 10, adr: 2200000, status: "maintenance" },
];

const STATUS = {
  open: "bg-emerald-100 text-emerald-700",
  soldout: "bg-mora-gold/15 text-gold",
  maintenance: "bg-slate-100 text-slate-500",
};
const occ = (r) => (r.total ? Math.round(((r.total - r.available) / r.total) * 100) : 0);

// Channel-sync status for a room's detail drawer (sync only — no guest/booking data).
const SYNC_CHANNELS = ["Booking.com", "Agoda", "Traveloka", "Expedia", "Tiket.com"];
const SYNC_BADGE = { in_sync: "bg-emerald-100 text-emerald-700", pending: "bg-mora-gold/15 text-gold", paused: "bg-slate-100 text-slate-500", error: "bg-red-100 text-red-600" };
const SYNC_LABEL = { in_sync: "in sync", pending: "syncing", paused: "paused", error: "error" };
function syncFor(room) {
  if (!room) return [];
  return SYNC_CHANNELS.map((name, i) => {
    let status;
    if (room.status === "maintenance") status = "paused";
    else if ((i + room.total) % 7 === 0) status = "error";
    else if (room.status === "soldout" && i % 2 === 0) status = "pending";
    else status = "in_sync";
    const ok = status === "in_sync";
    return {
      id: `${room.id}-${i}`, channel: name, availability: ok, rate: ok,
      lastSync: status === "in_sync" ? `${(i + 1) * 4}m ago` : status === "paused" ? "—" : status === "error" ? "failed" : "queued",
      status,
    };
  });
}

export default function DashboardPMS() {
  const [rows, setRows] = useState(SEED);
  const [detail, setDetail] = useState(null);
  const [sync, setSync] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const inSync = sync.filter((s) => s.status === "in_sync").length;

  const openDetail = (r) => { setDetail(r); setSync(syncFor(r)); setSyncing(false); };
  const syncNow = () => {
    setSyncing(true);
    setSync((prev) => prev.map((s) => ({ ...s, status: "pending", lastSync: "syncing…" })));
    setTimeout(() => {
      setSync((prev) => prev.map((s) => ({ ...s, status: "in_sync", availability: true, rate: true, lastSync: "just now" })));
      setSyncing(false);
      toast.success(`${detail?.roomType || "Room"} synced to ${SYNC_CHANNELS.length} channels`);
    }, 1200);
  };

  const properties = new Set(rows.map((r) => r.property)).size;
  const totalRooms = rows.reduce((s, r) => s + r.total, 0);
  const occupiedRooms = rows.reduce((s, r) => s + (r.total - r.available), 0);
  const occupancy = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const adrAvg = rows.length ? Math.round(rows.reduce((s, r) => s + r.adr, 0) / rows.length) : 0;
  const revpar = Math.round(adrAvg * (occupancy / 100));

  const occByRoom = rows.map((r) => ({ name: r.roomType, value: occ(r) })).sort((a, b) => b.value - a.value);
  const adrByRoom = rows.map((r) => ({ name: r.roomType, value: r.adr })).sort((a, b) => b.value - a.value);

  const adjust = (r, delta) => {
    setRows((prev) => prev.map((x) => x.id === r.id ? { ...x, adr: Math.max(0, x.adr + delta) } : x));
    toast(`${r.roomType} rate ${delta > 0 ? "raised" : "lowered"}`);
  };

  const columns = [
    { key: "property", label: "Property", className: "font-medium text-mora-primary", render: (r) => (
      <span className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-mora-gold/10 text-gold flex items-center justify-center text-xs font-display font-bold uppercase">{r.property[0]}</span>{r.property}</span>
    ) },
    { key: "roomType", label: "Room type" },
    { key: "total", label: "Rooms", align: "right", render: (r) => r.total },
    { key: "available", label: "Available", align: "right", render: (r) => r.available },
    { key: "occ", label: "Occupancy", align: "right", render: (r) => (
      <span className="inline-flex items-center gap-2 justify-end">
        <span className="w-14 h-1.5 rounded-full bg-mora-primary/10 overflow-hidden hidden sm:inline-block"><span className="block h-full bg-gold" style={{ width: `${occ(r)}%` }} /></span>
        {occ(r)}%
      </span>
    ) },
    { key: "adr", label: "ADR", align: "right", className: "text-right font-semibold text-gold", render: (r) => formatIDR(r.adr) },
    { key: "status", label: "Status", render: (r) => <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full capitalize ${STATUS[r.status]}`}>{r.status}</span> },
    { key: "rate", label: "Rate", align: "right", render: (r) => (
      <span className="inline-flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); adjust(r, -100000); }} className="w-7 h-7 rounded-lg border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">−</button>
        <button onClick={(e) => { e.stopPropagation(); adjust(r, 100000); }} className="w-7 h-7 rounded-lg border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 press">+</button>
      </span>
    ) },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Operations</p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Property Management</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Rooms, availability, occupancy and rates across your properties.</p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardAiStub resource="pms" data={rows} />
          <button onClick={() => toast("Add a property (demo)")} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add property</button>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 stagger">
        <Kpi icon={Building2} label="Properties" value={properties} />
        <Kpi icon={BedDouble} label="Total rooms" value={totalRooms} />
        <Kpi icon={Percent} label="Occupancy" value={`${occupancy}%`} />
        <Kpi icon={TrendingUp} label="RevPAR" value={formatIDR(revpar)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Occupancy by room" subtitle="Current occupancy %."><CategoryBars data={occByRoom} money={false} /></ChartCard>
        <ChartCard title="ADR by room" subtitle="Average daily rate."><CategoryBars data={adrByRoom} /></ChartCard>
      </div>

      <DataTable columns={columns} rows={rows} onRowClick={openDetail} empty="No rooms in inventory." />

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        icon={RefreshCw}
        width="max-w-xl"
        title={detail ? `${detail.roomType} · channel sync` : ""}
        subtitle={detail ? detail.property : ""}
      >
        {detail && (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white border border-mora-primary/10 p-4">
              <div>
                <p className="stat-value text-lg font-display font-bold text-mora-primary">{inSync} / {sync.length}</p>
                <p className="text-[11px] text-mora-neutral">channels in sync</p>
              </div>
              <button onClick={syncNow} disabled={syncing} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60"><RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing…" : "Sync now"}</button>
            </div>
            <DataTable
              columns={[
                { key: "channel", label: "Channel", className: "font-medium text-mora-primary" },
                { key: "availability", label: "Availability", render: (s) => s.availability ? <Check className="w-4 h-4 text-emerald-600" /> : <Minus className="w-4 h-4 text-mora-neutral/40" /> },
                { key: "rate", label: "Rate", render: (s) => s.rate ? <Check className="w-4 h-4 text-emerald-600" /> : <Minus className="w-4 h-4 text-mora-neutral/40" /> },
                { key: "lastSync", label: "Last sync" },
                { key: "status", label: "Status", render: (s) => <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${SYNC_BADGE[s.status]}`}>{SYNC_LABEL[s.status]}</span> },
              ]}
              rows={sync}
              rowKey={(s) => s.id}
              minWidth={440}
              empty="No channels configured."
            />
            <p className="text-[11px] text-mora-neutral/50">Sync status is simulated for the demo.</p>
          </>
        )}
      </Drawer>
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
