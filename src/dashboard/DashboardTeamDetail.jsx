import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { backend } from "@/api/backend";
import { ROLES, RESOURCES, can, roleLabel } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ChevronLeft, Trash2, Mail, ShieldCheck, Clock, CheckSquare, ShieldOff,
} from "lucide-react";
import { confirmDialog } from "@/components/ConfirmDialog";

const statusPill = {
  active: "bg-emerald-500/15 text-emerald-600",
  invited: "bg-ich-gold/10 text-gold",
  disabled: "bg-ich-primary/10 text-ich-neutral",
};

const ACTIONS = [
  { key: "view", letter: "V", label: "View" },
  { key: "create", letter: "C", label: "Create" },
  { key: "edit", letter: "E", label: "Edit" },
  { key: "delete", letter: "D", label: "Delete" },
];

export default function DashboardTeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [m, setM] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    backend.entities.StaffMember.filter({ id }).then((r) => setM(r[0] || null));
  }, [id]);

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this team member?",
      body: `${m?.name || m?.email || "This member"} will be permanently removed from the team. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await backend.entities.StaffMember.delete(id);
      toast.success("Member removed");
      navigate("/dashboard/team");
    } catch {
      toast.error("Couldn't remove member");
    }
  };

  const back = (
    <Link to="/dashboard/team" className="inline-flex items-center gap-1.5 text-sm text-ich-neutral hover:text-ich-primary mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to team
    </Link>
  );

  if (m === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!m) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-10 text-center">
          <h1 className="text-xl font-display font-bold text-ich-primary">Member not found</h1>
          <p className="text-sm text-ich-neutral mt-1">This team member may have been removed.</p>
        </div>
      </div>
    );
  }

  const status = m.status || "disabled";
  const roleKey = m.role || "viewer";
  const roleInfo = ROLES.find((r) => r.key === roleKey);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 flex items-start gap-5">
        <div className="w-16 h-16 rounded-full bg-ich-gold/10 text-gold flex items-center justify-center font-display font-bold text-2xl shrink-0 uppercase">
          {(m.name || m.email || "?").trim().charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-bold text-ich-primary truncate">{m.name || "Unnamed member"}</h1>
          {m.email && <p className="text-sm text-ich-neutral mt-0.5 truncate">{m.email}</p>}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600">{roleLabel(roleKey)}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusPill[status] || statusPill.disabled}`}>{status}</span>
          </div>
        </div>
        {can(role, "team", "delete") && (
          <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-red-600 hover:bg-red-50 shrink-0">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 mt-6">
        <h2 className="font-display font-semibold text-lg text-ich-primary mb-4">Details</h2>
        <div className="space-y-1">
          <DetailRow icon={Mail} label="Email" value={m.email ? <a href={`mailto:${m.email}`} className="text-ich-primary hover:text-gold break-all">{m.email}</a> : null} />
          <DetailRow icon={ShieldCheck} label="Role" value={roleInfo ? `${roleInfo.label} — ${roleInfo.desc}` : roleLabel(roleKey)} />
          <DetailRow icon={Clock} label="Last active" value={m.last_active ? moment(m.last_active).fromNow() : null} />
        </div>
      </div>

      {/* Permissions for this member's role */}
      <div className="bg-white rounded-2xl border border-ich-primary/10 overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-ich-primary/5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <div>
            <h2 className="font-display font-semibold text-ich-primary">Permissions · {roleLabel(roleKey)}</h2>
            <p className="text-xs text-ich-neutral mt-0.5">
              What this member can do per section. <span className="text-gold font-semibold">V</span> view · <span className="text-gold font-semibold">C</span> create · <span className="text-gold font-semibold">E</span> edit · <span className="text-gold font-semibold">D</span> delete.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-ich-neutral/70 border-b border-ich-primary/5">
              <th className="px-5 py-3 font-medium">Section</th>
              {ACTIONS.map((a) => (
                <th key={a.key} className="px-3 py-3 font-medium text-center">{a.label}</th>
              ))}
            </tr></thead>
            <tbody>
              {RESOURCES.map((res) => {
                const anyAllowed = ACTIONS.some((a) => can(roleKey, res, a.key));
                return (
                  <tr key={res} className="border-b border-ich-primary/5 last:border-0">
                    <td className="px-5 py-3 font-medium text-ich-primary capitalize whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        {anyAllowed ? <CheckSquare className="w-3.5 h-3.5 text-gold" /> : <ShieldOff className="w-3.5 h-3.5 text-ich-neutral/30" />}
                        {res}
                      </span>
                    </td>
                    {ACTIONS.map((a) => {
                      const allowed = can(roleKey, res, a.key);
                      return (
                        <td key={a.key} className="px-3 py-3 text-center">
                          <span
                            title={`${a.key} ${res}: ${allowed ? "allowed" : "denied"}`}
                            className={`font-mono text-xs ${allowed ? "text-gold font-semibold" : "text-ich-neutral/25 line-through"}`}
                          >
                            {a.letter}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2 border-b border-ich-primary/5 last:border-0">
    <Icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[11px] text-ich-neutral uppercase tracking-wider">{label}</div>
      <div className="text-sm text-ich-primary break-words">{value || <span className="text-ich-neutral/50">Not set</span>}</div>
    </div>
  </div>
);
