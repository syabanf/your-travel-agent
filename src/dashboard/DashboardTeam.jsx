import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ROLES, RESOURCES, can, roleLabel } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { UserPlus, Trash2, X, Loader2, Lock, ShieldCheck, Search, Users, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { confirmDialog } from "@/components/ConfirmDialog";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DashboardAiStub from "@/dashboard/DashboardAiStub";
import { ChartCard, MixDonut } from "@/dashboard/charts";
import DateRangeSelect from "@/dashboard/DateRangeSelect";
import { inRange } from "@/dashboard/dateRange";
import SearchableSelect from "@/dashboard/SearchableSelect";

const STATUS_ORDER = { active: 0, invited: 1, disabled: 2 };

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
  const navigate = useNavigate();
  const canManage = can(role, "team", "edit");
  const canCreate = can(role, "team", "create");
  const canDelete = can(role, "team", "delete");

  const [members, setMembers] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState({ ...EMPTY_INVITE });
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [roleF, setRoleF] = useState("all");
  const [range, setRange] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  // Date range scopes the whole view (chart & table); search/selects refine the table.
  const scoped = (members || []).filter((member) => inRange(member.created_date, range));

  const filtered = scoped.filter((member) => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || [member.name, member.email].some((f) => (f || "").toLowerCase().includes(q));
    const matchesRole = roleF === "all" || member.role === roleF;
    return matchesQ && matchesRole;
  });

  const sortVal = (m, key) => {
    if (key === "name") return (m.name || m.email || "").toLowerCase();
    if (key === "role") return roleLabel(m.role || "").toLowerCase();
    if (key === "status") return STATUS_ORDER[m.status] ?? 99;
    if (key === "last_active") return m.last_active ? new Date(m.last_active).getTime() : -1;
    return "";
  };

  const sorted = [...filtered].sort((a, b) => {
    const av = sortVal(a, sortKey);
    const bv = sortVal(b, sortKey);
    let cmp = 0;
    if (av < bv) cmp = -1;
    else if (av > bv) cmp = 1;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const pg = usePagination(sorted, 10, `${query}|${roleF}|${range}|${sortKey}|${sortDir}`);

  // Insight aggregations (date-scoped)
  const roleCount = {};
  scoped.forEach((m) => { const r = m.role || "viewer"; roleCount[r] = (roleCount[r] || 0) + 1; });
  const byRole = ROLES
    .map((r) => ({ name: r.label, value: roleCount[r.key] || 0 }))
    .filter((d) => d.value);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortHeader = ({ label, sk, className = "" }) => (
    <th className={`px-5 py-3 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => toggleSort(sk)}
        className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-mora-primary transition-colors"
      >
        {label}
        {sortKey === sk && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );

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
    const ok = await confirmDialog({
      title: "Remove this team member?",
      body: `${m.name || m.email || "This member"} will be permanently removed and will lose access. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
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
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Team &amp; Roles</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage who can access what.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardAiStub resource="team" data={members} />
        </div>
      </header>

      <ReadOnlyBanner resource="team" />

      {!canManage && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Lock className="w-4 h-4 shrink-0" />
          You have read-only access to team management.
        </div>
      )}

      {members && members.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-6">
          <ChartCard title="Members by role" subtitle="Access distribution across the team."><MixDonut data={byRole} /></ChartCard>
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
              <button onClick={() => { setInviting(false); setInvite({ ...EMPTY_INVITE }); }} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral press"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Name</label>
                <input value={invite.name} onChange={(e) => setInvite((p) => ({ ...p, name: e.target.value }))} className="dash-input" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} className="dash-input" placeholder="jane@iconholiday.travel" />
              </div>
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Role</label>
                <SearchableSelect
                  value={invite.role}
                  onChange={(v) => setInvite((p) => ({ ...p, role: v }))}
                  options={ROLES.map((r) => ({ value: String(r.key), label: r.label }))}
                  ariaLabel="Role"
                />
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
          <div className="px-5 py-5"><SkeletonRows rows={6} /></div>
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
              <SearchableSelect
                value={roleF}
                onChange={setRoleF}
                options={[{ value: "all", label: "All roles" }, ...ROLES.map((r) => ({ value: String(r.key), label: r.label }))]}
                ariaLabel="Filter by role"
                className="max-w-[160px]"
              />
              <DateRangeSelect value={range} onChange={setRange} />
              {(query || roleF !== "all" || range !== "all" || sortKey !== "name" || sortDir !== "asc") && (
                <button onClick={() => { setQuery(""); setRoleF("all"); setRange("all"); setSortKey("name"); setSortDir("asc"); }} className="h-[2.6rem] px-3 rounded-lg border border-mora-primary/15 text-sm text-mora-neutral hover:bg-mora-primary/5 inline-flex items-center gap-1.5 press">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mora-neutral/70 border-b border-mora-primary/5">
              <SortHeader label="Name" sk="name" />
              <SortHeader label="Role" sk="role" />
              <SortHeader label="Status" sk="status" />
              <SortHeader label="Last active" sk="last_active" />
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody className="stagger">
              {pg.pageItems.map((m) => (
                <tr key={m.id} onClick={() => navigate(`/dashboard/team/${m.id}`)} className="border-b border-mora-primary/5 last:border-0 hover:bg-mora-primary/[0.02] cursor-pointer press">
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
                    <span onClick={(e) => e.stopPropagation()} className="inline-block">
                      <SearchableSelect
                        value={m.role}
                        onChange={(v) => changeRole(m.id, v)}
                        options={ROLES.map((r) => ({ value: String(r.key), label: r.label }))}
                        disabled={!canManage}
                        ariaLabel="Change role"
                        className="!h-9 !w-auto !text-xs pr-7 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </span>
                  </td>
                  <td className="px-5 py-3"><Pill s={m.status} /></td>
                  <td className="px-5 py-3 text-mora-neutral">{m.last_active ? moment(m.last_active).fromNow() : "—"}</td>
                  <td className="px-5 py-3 text-right">
                    {canDelete && (
                      <button onClick={(e) => { e.stopPropagation(); remove(m); }} aria-label="Delete" className="text-red-600 hover:bg-red-50 w-9 h-9 rounded-lg inline-flex items-center justify-center press"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-6">
                  <EmptyState
                    icon={Users}
                    title="No team members yet"
                    hint="Invite teammates and assign them roles to control access."
                    action={canCreate ? (
                      <button onClick={() => setInviting(true)} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Invite member
                      </button>
                    ) : null}
                  />
                </td></tr>
              )}
              {members.length > 0 && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-6">
                  <EmptyState icon={Search} title="No matches" hint="No team members match your search or filters." />
                </td></tr>
              )}
            </tbody>
          </table>
          <div className="px-5 pb-4">
            <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="members" />
          </div>
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
