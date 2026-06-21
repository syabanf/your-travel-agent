import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ROLES, RESOURCES, can, roleLabel } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { UserPlus, Trash2, X, Loader2, Lock, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";

const statusPill = {
  active: "bg-emerald-500/15 text-emerald-600",
  invited: "bg-mora-gold/10 text-gold",
  disabled: "bg-mora-primary/10 text-mora-neutral",
};

const ACTIONS = [
  { key: "view", letter: "V" },
  { key: "create", letter: "C" },
  { key: "edit", letter: "E" },
  { key: "delete", letter: "D" },
];

const EMPTY_INVITE = { name: "", email: "", role: "viewer" };

export default function DashboardTeam() {
  const { role } = useRole();
  const canManage = can(role, "team", "edit");
  const canCreate = can(role, "team", "create");
  const canDelete = can(role, "team", "delete");

  const [members, setMembers] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState({ ...EMPTY_INVITE });
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [roleF, setRoleF] = useState("all");

  const filtered = (members || []).filter((member) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || [member.name, member.email].some((f) => (f || "").toLowerCase().includes(q));
    const matchesRole = roleF === "all" || member.role === roleF;
    return matchesQ && matchesRole;
  });

  const load = async () => setMembers(await base44.entities.StaffMember.list("-created_date", 500));
  useEffect(() => { load(); }, []);

  const changeRole = async (id, newRole) => {
    try {
      await base44.entities.StaffMember.update(id, { role: newRole });
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
      toast.success(`Role updated to ${roleLabel(newRole)}`);
    } catch { toast.error("Couldn't update role"); }
  };

  const remove = async (m) => {
    try {
      await base44.entities.StaffMember.delete(m.id);
      toast.success(`Removed ${m.name || m.email}`);
      load();
    } catch { toast.error("Couldn't remove member"); }
  };

  const submitInvite = async () => {
    if (!invite.name.trim()) { toast.error("Name is required"); return; }
    if (!invite.email.trim()) { toast.error("Email is required"); return; }
    setSaving(true);
    try {
      await base44.entities.StaffMember.create({
        name: invite.name.trim(),
        email: invite.email.trim(),
        role: invite.role,
        status: "invited",
        last_active: null,
      });
      toast.success(`Invited ${invite.name.trim()}`);
      setInvite({ ...EMPTY_INVITE });
      setInviting(false);
      await load();
    } catch { toast.error("Couldn't send invite"); }
    finally { setSaving(false); }
  };

  const Pill = ({ s }) => (
    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${statusPill[s] || statusPill.disabled}`}>{s}</span>
  );

  return (
    <div className="p-8 max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-mora-primary">Team &amp; Roles</h1>
        <p className="text-sm text-mora-neutral mt-0.5">Manage who can access what.</p>
      </header>

      {!canManage && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="w-4 h-4 shrink-0" />
          You have read-only access to team management.
        </div>
      )}

      {/* ---- Card 1: Team members ---- */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-mora-primary/5">
          <div>
            <h2 className="font-display font-semibold text-mora-primary">Team members</h2>
            <p className="text-xs text-mora-neutral mt-0.5">{members ? `${members.length} member${members.length === 1 ? "" : "s"}` : "Loading…"}</p>
          </div>
          {canCreate && !inviting && (
            <button onClick={() => setInviting(true)} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Invite member
            </button>
          )}
        </div>

        {canCreate && inviting && (
          <div className="px-5 py-4 border-b border-mora-primary/5 bg-mora-primary/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-mora-primary">Invite a new member</h3>
              <button onClick={() => { setInviting(false); setInvite({ ...EMPTY_INVITE }); }} className="w-8 h-8 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Name</label>
                <input value={invite.name} onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))} className="dash-input" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} className="dash-input" placeholder="jane@mora.travel" />
              </div>
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Role</label>
                <select value={invite.role} onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))} className="dash-input">
                  {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={submitInvite} disabled={saving} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Send invite
              </button>
              <button onClick={() => { setInviting(false); setInvite({ ...EMPTY_INVITE }); }} className="rounded-xl px-4 py-2.5 text-sm font-medium text-mora-neutral hover:bg-mora-primary/5">Cancel</button>
            </div>
          </div>
        )}

        {members == null ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
        ) : (
          <>
          <div className="px-5 pt-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-neutral/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="dash-input pl-9"
                  placeholder="Search team…"
                />
              </div>
              <select value={roleF} onChange={(e) => setRoleF(e.target.value)} className="dash-input max-w-[160px]">
                <option value="all">All roles</option>
                {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Last active</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-mora-gold/10 text-gold flex items-center justify-center font-semibold text-sm shrink-0 uppercase">
                        {(m.name || m.email || "?").trim().charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-mora-primary truncate">{m.name || "—"}</div>
                        <div className="text-xs text-mora-neutral truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      disabled={!canManage}
                      className="dash-input !h-9 !w-auto !text-xs pr-7 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3"><Pill s={m.status} /></td>
                  <td className="px-5 py-3 text-mora-neutral">{m.last_active ? moment(m.last_active).fromNow() : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    {canDelete && (
                      <button onClick={() => remove(m)} className="text-red-600 hover:bg-red-50 w-8 h-8 rounded-lg inline-flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-mora-neutral/60">No team members yet.</td></tr>}
              {members.length > 0 && filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-mora-neutral/60">No team members match your filters.</td></tr>}
            </tbody>
          </table>
          </>
        )}
      </div>

      {/* ---- Card 2: Roles & permissions ---- */}
      <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-mora-primary/5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <div>
            <h2 className="font-display font-semibold text-mora-primary">Roles &amp; permissions</h2>
            <p className="text-xs text-mora-neutral mt-0.5">
              What each role can do per section. <span className="text-gold font-semibold">V</span> view · <span className="text-gold font-semibold">C</span> create · <span className="text-gold font-semibold">E</span> edit · <span className="text-gold font-semibold">D</span> delete.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
              <th className="px-5 py-3 font-medium sticky left-0 bg-white">Role</th>
              {RESOURCES.map((res) => (
                <th key={res} className="px-3 py-3 font-medium text-center capitalize whitespace-nowrap">{res}</th>
              ))}
            </tr></thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.key} className="border-b border-mora-primary/5 last:border-0 align-top">
                  <td className="px-5 py-3 sticky left-0 bg-white">
                    <div className="font-medium text-mora-primary whitespace-nowrap">{r.label}</div>
                    <div className="text-xs text-mora-neutral max-w-[180px]">{r.desc}</div>
                  </td>
                  {RESOURCES.map((res) => (
                    <td key={res} className="px-3 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex gap-1 font-mono text-xs">
                        {ACTIONS.map((a) => {
                          const allowed = can(r.key, res, a.key);
                          return (
                            <span
                              key={a.key}
                              title={`${a.key} ${res}: ${allowed ? "allowed" : "denied"}`}
                              className={allowed ? "text-gold font-semibold" : "text-mora-neutral/25 line-through"}
                            >
                              {a.letter}
                            </span>
                          );
                        })}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
