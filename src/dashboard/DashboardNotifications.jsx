import { useEffect, useMemo, useState } from "react";
import { Send, Megaphone, Users, User, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { backend } from "@/api/backend";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import DataTable from "@/dashboard/DataTable";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { NOTIFICATION_CATEGORIES } from "@/data/membership";

const CATEGORIES = NOTIFICATION_CATEGORIES.filter((c) => c.value !== "all");
const EMPTY = { title: "", message: "", category: "promo", audience: "all", recipients: [], trip: "" };

/**
 * Notification composer (Icon Membership 11.1–11.3): a broadcast to every
 * member, or a targeted message to chosen members. One-way, from Icon Holiday.
 */
export default function DashboardNotifications() {
  const { role } = useRole();
  const canSend = can(role, "marketing", "create");
  const [form, setForm] = useState(EMPTY);
  const [members, setMembers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const load = async () => {
    const [cust, regs, tr, notes] = await Promise.all([
      backend.entities.Customer.list(),
      backend.entities.Registration.filter({ status: "approved" }),
      backend.entities.Trip.list(),
      backend.entities.Notification.list("-created_at", 200),
    ]);
    const byEmail = new Map();
    for (const c of cust) if (c.email) byEmail.set(c.email.toLowerCase(), c.name || c.email);
    for (const r of regs) if (r.email) byEmail.set(r.email.toLowerCase(), r.full_name || r.email);
    setMembers([...byEmail].map(([value, name]) => ({ value, label: `${name} · ${value}` })));
    setTrips(tr.map((t) => ({ value: t.id, label: t.title })));
    setSent(notes);
  };
  useEffect(() => { load().catch(() => setSent([])); }, []);

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const missing = !form.title.trim() || !form.message.trim() || (form.audience === "targeted" && !form.recipients.length);

  const send = async (e) => {
    e.preventDefault();
    setTried(true);
    if (missing) {
      toast.error(form.audience === "targeted" && !form.recipients.length ? "Pick at least one member to send to" : "Add a title and a message");
      return;
    }
    setBusy(true);
    try {
      await backend.entities.Notification.create({
        title: form.title.trim(),
        message: form.message.trim(),
        category: form.category,
        type: form.category === "promo" ? "promo" : form.category === "personal" ? "document" : "trip_prep",
        audience: form.audience,
        recipients: form.audience === "targeted" ? form.recipients : [],
        related_trip_id: form.trip || undefined,
        is_read: false,
      });
      toast.success(form.audience === "all" ? "Broadcast sent to all members" : `Sent to ${form.recipients.length} member${form.recipients.length > 1 ? "s" : ""}`, { description: form.title });
      setForm(EMPTY);
      setTried(false);
      await load();
    } catch {
      toast.error("The notification wasn't sent. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo(() => [
    { key: "title", label: "Notification", className: "text-foreground", render: (n) => (
      <span className="block min-w-0">
        <span className="block font-medium">{n.title}</span>
        <span className="block max-w-xs truncate text-xs text-muted">{n.message}</span>
      </span>
    ) },
    { key: "category", label: "Category", render: (n) => <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold capitalize text-body">{n.category || "trip"}</span> },
    { key: "audience", label: "Audience", render: (n) => n.audience === "targeted"
      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-info"><User className="size-3.5" aria-hidden="true" /> {n.recipients?.length || 1} member{(n.recipients?.length || 1) > 1 ? "s" : ""}</span>
      : <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-strong"><Users className="size-3.5" aria-hidden="true" /> All members</span> },
    { key: "created_at", label: "Sent", render: (n) => <span className="text-xs">{moment(n.created_at).fromNow()}</span> },
  ], []);

  const field = (bad) => `dash-input ${tried && bad ? "border-accent-strong ring-2 ring-accent/30" : ""}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="marketing" />
      <header className="mb-6">
        <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent-strong">
          <Bell className="size-3.5" aria-hidden="true" /> Member app
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="mt-0.5 text-sm text-muted">Send an announcement to every member, or a message to specific members.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[380px_minmax(0,1fr)]">
        {canSend && (
          <form onSubmit={send} className="space-y-4 2xl:self-start rounded-card bg-card p-5 shadow-card" noValidate>
            <h2 className="text-base font-semibold text-foreground">New notification</h2>

            <div role="radiogroup" aria-label="Audience" className="grid grid-cols-2 gap-2">
              {[["all", Megaphone, "Broadcast", "Every member"], ["targeted", User, "Targeted", "Chosen members"]].map(([v, Icon, label, hint]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={form.audience === v}
                  onClick={() => upd("audience", v)}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-colors ${form.audience === v ? "bg-accent-soft ring-2 ring-accent/40" : "bg-surface-2 hover:bg-surface"}`}
                >
                  <Icon className={`size-5 ${form.audience === v ? "text-accent-strong" : "text-muted"}`} aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{label}</span>
                    <span className="block text-xs text-muted">{hint}</span>
                  </span>
                </button>
              ))}
            </div>

            {form.audience === "targeted" && (
              <div>
                <p className="eyebrow mb-1">Send to *</p>
                <SearchableSelect
                  value=""
                  onChange={(v) => v && !form.recipients.includes(v) && upd("recipients", [...form.recipients, v])}
                  options={members.filter((m) => !form.recipients.includes(m.value))}
                  placeholder="Add a member"
                  ariaLabel="Add a member"
                />
                {form.recipients.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {form.recipients.map((r) => (
                      <li key={r}>
                        <button type="button" onClick={() => upd("recipients", form.recipients.filter((x) => x !== r))} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-body hover:bg-border" aria-label={`Remove ${r}`}>
                          {r} ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-1">Category</p>
                <SearchableSelect value={form.category} onChange={(v) => upd("category", v)} options={CATEGORIES} ariaLabel="Category" />
              </div>
              <div>
                <p className="eyebrow mb-1">Related trip</p>
                <SearchableSelect value={form.trip} onChange={(v) => upd("trip", v)} options={trips} allowClear placeholder="None" ariaLabel="Related trip" />
              </div>
            </div>

            <label className="block">
              <span className="eyebrow mb-1 block">Title *</span>
              <input value={form.title} onChange={(e) => upd("title", e.target.value)} placeholder="Members only: Japan autumn 15% off" className={field(!form.title.trim())} />
            </label>
            <label className="block">
              <span className="eyebrow mb-1 block">Message *</span>
              <textarea value={form.message} onChange={(e) => upd("message", e.target.value)} rows={4} placeholder="What should the member know or do?" className={`${field(!form.message.trim())} h-auto py-2.5`} />
            </label>

            <button type="submit" disabled={busy} className="sheen flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent-strong px-6 sm:ml-auto sm:w-fit 2xl:w-full text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark disabled:opacity-60">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
              {form.audience === "all" ? "Send broadcast" : "Send to members"}
            </button>
          </form>
        )}

        <div className="min-w-0">
          <h2 className="mb-3 text-base font-semibold text-foreground">Sent</h2>
          {sent == null ? <div className="skeleton h-48" /> : <DataTable columns={columns} rows={sent} empty="Nothing sent yet." minWidth={560} />}
        </div>
      </div>
    </div>
  );
}
