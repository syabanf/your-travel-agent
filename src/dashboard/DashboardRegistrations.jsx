import { useEffect, useState } from "react";
import { backend } from "@/api/backend";
import { decideRegistration } from "@/lib/registration";
import { can, roleLabel } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import { Search, X, UserCheck, Check, Ban, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { SkeletonRows } from "@/components/Skeletons";
import EmptyState from "@/components/EmptyState";
import { confirmDialog } from "@/components/ConfirmDialog";
import Pagination from "@/dashboard/Pagination";
import { usePagination } from "@/dashboard/usePagination";
import DataTable from "@/dashboard/DataTable";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS_BADGE = {
  pending: "bg-ich-gold/15 text-gold",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function DashboardRegistrations() {
  const { role } = useRole();
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => setItems(await backend.entities.Registration.list("-created_at", 500));
  useEffect(() => { load(); }, []);

  const canEdit = can(role, "registrations", "edit");

  const decide = async (r, status) => {
    // Approving just opens a door; rejecting shuts one in someone's face — confirm it.
    if (status === "rejected") {
      const ok = await confirmDialog({
        title: "Reject this sign-up?",
        body: `${r.full_name || r.email} won't be able to sign in, and will see the rejection notice instead.`,
        confirmLabel: "Reject",
        destructive: true,
      });
      if (!ok) return;
    }
    setBusyId(r.id);
    try {
      await decideRegistration(r.id, status, roleLabel(role));
      toast.success(status === "approved" ? "Sign-up approved" : "Sign-up rejected");
      await load();
    } catch { toast.error("Couldn't save that decision"); }
    finally { setBusyId(null); }
  };

  // Search scopes the counts too, so a chip's badge always equals the rows you get by clicking it.
  const q = query.trim().toLowerCase();
  const scoped = (items || []).filter(
    (r) => !q || [r.full_name, r.email].some((v) => (v || "").toLowerCase().includes(q))
  );
  const counts = { all: scoped.length, pending: 0, approved: 0, rejected: 0 };
  scoped.forEach((r) => { const s = r.status || "pending"; counts[s] = (counts[s] || 0) + 1; });

  const filtered = scoped.filter((r) => tab === "all" || (r.status || "pending") === tab);
  const pg = usePagination(filtered, 10, `${tab}|${query}`);

  const columns = [
    { key: "full_name", label: "Traveller", className: "font-medium text-ich-primary", render: (r) => (
      <span className="flex items-center gap-2.5 min-w-0">
        <span className="w-8 h-8 rounded-full bg-ich-gold/10 text-gold flex items-center justify-center text-xs font-display font-semibold uppercase shrink-0">
          {(r.full_name || r.email || "?").trim().charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate">{r.full_name || "—"}</span>
          <span className="block text-[11px] text-ich-neutral/60 truncate">{r.email}</span>
        </span>
      </span>
    ) },
    { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
    { key: "source", label: "Source", render: (r) => cap((r.source || "—").replace(/_/g, " ")) },
    { key: "created_at", label: "Requested", render: (r) => (r.created_at ? (
      <span className="block leading-tight">
        <span className="block">{moment(r.created_at).format("MMM D, YYYY")}</span>
        <span className="block text-[11px] text-ich-neutral/60">{moment(r.created_at).fromNow()}</span>
      </span>
    ) : "—") },
    { key: "status", label: "Status", render: (r) => (
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status] || STATUS_BADGE.pending}`}>
        {r.status || "pending"}
      </span>
    ) },
    { key: "reviewed_by", label: "Decided by", render: (r) => (r.reviewed_by || r.reviewed_at ? (
      <span className="block leading-tight">
        <span className="block text-ich-primary">{r.reviewed_by || "—"}</span>
        {r.reviewed_at && <span className="block text-[11px] text-ich-neutral/60">{moment(r.reviewed_at).format("MMM D, YYYY")}</span>}
      </span>
    ) : "—") },
  ];

  if (canEdit) {
    columns.push({ key: "actions", label: "", align: "right", className: "text-right", render: (r) => {
      const status = r.status || "pending";
      if (busyId === r.id) return <Loader2 className="w-4 h-4 animate-spin text-ich-neutral inline-block" />;
      return (
        <span className="inline-flex gap-1.5">
          {status !== "approved" && (
            <button
              onClick={() => decide(r, "approved")}
              disabled={!!busyId}
              aria-label={`Approve ${r.full_name || r.email}`}
              className="h-9 px-3 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 press"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
          )}
          {status !== "rejected" && (
            <button
              onClick={() => decide(r, "rejected")}
              disabled={!!busyId}
              aria-label={`Reject ${r.full_name || r.email}`}
              className="h-9 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-1.5 text-xs font-semibold disabled:opacity-40 press"
            >
              <Ban className="w-3.5 h-3.5" /> Reject
            </button>
          )}
        </span>
      );
    } });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="registrations" />
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" /> Access
        </p>
        <h1 className="text-2xl font-display font-bold text-ich-primary">Registrations</h1>
        <p className="text-sm text-ich-neutral mt-0.5">Approve or reject traveller sign-ups from the mobile app. Nobody gets in until you decide.</p>
      </header>

      {items == null ? (
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-5"><SkeletonRows rows={6} /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ich-primary/10">
          <EmptyState
            icon={UserCheck}
            title="No sign-ups yet"
            hint="Registrations from the mobile app land here for approval."
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors press ${
                  tab === t.key ? "border-ich-gold/40 bg-ich-gold/10 text-gold" : "border-ich-primary/10 bg-white text-ich-neutral hover:bg-ich-primary/5"
                }`}
              >
                {t.label}
                <span className={`min-w-[1.25rem] px-1 rounded-full text-[11px] font-bold ${
                  t.key === "pending" && counts.pending > 0 ? "bg-ich-gold text-white" : "text-ich-primary"
                }`}>
                  {counts[t.key] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ich-neutral/50" />
              <input
                className="dash-input pl-9"
                placeholder="Search name or email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {(query || tab !== "pending") && (
              <button onClick={() => { setQuery(""); setTab("pending"); }} className="h-[2.6rem] px-3 rounded-lg border border-ich-primary/15 text-sm text-ich-neutral hover:bg-ich-primary/5 inline-flex items-center gap-1.5 press">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {tab === "pending" && !q && counts.pending === 0 ? (
            <div className="bg-white rounded-2xl border border-ich-primary/10">
              <EmptyState
                icon={MailCheck}
                title="Queue clear"
                hint="Every sign-up has been reviewed. New requests will show up here the moment they arrive."
              />
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={pg.pageItems}
                minWidth={canEdit ? 960 : 800}
                empty="No registrations match your search."
              />
              <Pagination page={pg.page} pageCount={pg.pageCount} total={pg.total} pageSize={pg.pageSize} onPage={pg.setPage} noun="registrations" />
            </>
          )}
        </>
      )}
    </div>
  );
}
