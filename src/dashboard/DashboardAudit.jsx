import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import moment from "moment";
import { History, Filter, ShieldCheck } from "lucide-react";

const ACTION_BADGE = {
  create: "bg-emerald-500/15 text-emerald-600",
  update: "bg-blue-500/15 text-blue-600",
  delete: "bg-red-500/15 text-red-600",
};

export default function DashboardAudit() {
  const [logs, setLogs] = useState(null);
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");

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
          (entity === "all" || l.entity === entity)
      ),
    [logs, action, entity]
  );

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-mora-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-gold" /> Audit Log
        </h1>
        <p className="text-sm text-mora-neutral mt-0.5">
          Every change made in the admin console is recorded here.
        </p>
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
      </div>

      {logs == null ? (
        <div className="bg-white rounded-2xl border border-mora-primary/10 flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-xs text-mora-neutral/70 mb-3">{filtered.length} events</p>
          <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Actor</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Entity</th>
                  <th className="px-5 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
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
                    <td colSpan={5} className="px-5 py-12 text-center text-mora-neutral/60">
                      <History className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      No audit events yet — changes you make in the dashboard will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
