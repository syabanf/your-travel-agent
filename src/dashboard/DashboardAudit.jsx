import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import moment from "moment";
import { History, Filter, ShieldCheck, X } from "lucide-react";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, CategoryBars, TrendArea, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";

const ACTION_BADGE = {
  create: "bg-emerald-500/15 text-emerald-600",
  update: "bg-blue-500/15 text-blue-600",
  delete: "bg-red-500/15 text-red-600",
};

export default function DashboardAudit() {
  const [logs, setLogs] = useState(null);
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [range, setRange] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        setLogs(await base44.entities.AuditLog.list("-created_date", 500));
      } catch {
        toast.error("Couldn't load the audit log");
        setLogs([]);
      }
    })();
  }, []);

  const entities = useMemo(() => {
    const set = new Set((logs || []).map((l) => l.entity).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(
    () =>
      (logs || []).filter(
        (l) =>
          (action === "all" || l.action === action) &&
          (entity === "all" || l.entity === entity) &&
          inRange(l.created_date, range)
      ),
    [logs, action, entity, range]
  );

  const pg = usePagination(filtered, 12, `${action}|${entity}|${range}`);

  // Insight aggregations (follow the active filters incl. range)
  const actionCount = {}, entityCount = {}, dayAgg = {};
  filtered.forEach((l) => {
    const a = l.action || "other";
    actionCount[a] = (actionCount[a] || 0) + 1;
    const e = l.entity || "—";
    entityCount[e] = (entityCount[e] || 0) + 1;
    const ts = moment(l.created_date);
    const k = ts.format("MMM D");
    if (!dayAgg[k]) dayAgg[k] = { label: k, value: 0, ts: ts.valueOf() };
    dayAgg[k].value += 1;
  });
  const actionMix = [
    { name: "Create", value: actionCount.create || 0, color: "#10B981" },
    { name: "Update", value: actionCount.update || 0, color: "#3B82F6" },
    { name: "Delete", value: actionCount.delete || 0, color: "#EF4444" },
  ];
  const byEntity = Object.entries(entityCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const trend = Object.values(dayAgg).sort((a, b) => a.ts - b.ts).map(({ label, value }) => ({ label, value }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-gold" /> Audit Log
          </h1>
          <p className="text-sm text-mora-neutral mt-0.5">
            Every change made in the admin console is recorded here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardAiStub resource="audit" data={logs} />
        </div>
      </header>

      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-mora-neutral/70">
          <Filter className="w-3.5 h-3.5" /> Filter
        </span>
        <select value={action} onChange={(e) => setAction(e.target.value)} className="dash-input max-w-[180px] capitalize">
          <option value="all">All actions</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
        </select>
        <select value={entity} onChange={(e) => setEntity(e.target.value)} className="dash-input max-w-[180px]">
          <option value="all">All entities</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <DateRangeSelect value={range} onChange={setRange} />
        {(action !== "all" || entity !== "all" || range !== "all") && (
          <button onClick={() => { setAction("all"); setEntity("all"); setRange("all"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {logs && logs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ChartCard title="Events by action" subtitle="Create · update · delete."><MixDonut data={actionMix} /></ChartCard>
          <ChartCard title="Events by entity" subtitle="What changes most."><CategoryBars data={byEntity} money={false} /></ChartCard>
          <ChartCard title="Activity over time" subtitle="Events per day."><TrendArea data={trend} money={false} /></ChartCard>
        </div>
      )}

      {logs == null ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-5"><SkeletonRows rows={8} /></div>
      ) : (
        <>
          <p className="text-xs text-mora-neutral/70 mb-3">{filtered.length} events</p>
          <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Actor</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="stagger">
                {pg.pageItems.map((l) => (
                  <tr key={l.id} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="text-mora-primary">{moment(l.created_date).format("MMM D, HH:mm")}</div>
                      <div className="text-[11px] text-mora-neutral/60">{moment(l.created_date).fromNow()}</div>
                    </td>
                    <td className="px-5 py-3 text-mora-neutral">{l.actor || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${ACTION_BADGE[l.action] || "bg-mora-primary/10 text-mora-neutral"}`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-mora-neutral">{l.entity || "—"}</td>
                    <td className="px-5 py-3 text-mora-neutral max-w-[320px] truncate" title={l.summary}>{l.summary || "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6">
                      <EmptyState
                        icon={History}
                        title="No audit events"
                        hint={logs.length ? "No events match your filters." : "Changes you make in the dashboard will appear here."}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="events" />
        </>
      )}
    </div>
  );
}
