import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { backend } from "@/api/backend";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ChevronLeft, Trash2, FileText, CalendarDays, Hash, Link2, ListOrdered,
} from "lucide-react";
import { confirmDialog } from "@/components/ConfirmDialog";

const TYPE_META = {
  page: { label: "Page", pill: "bg-surface text-muted" },
  faq: { label: "FAQ", pill: "bg-blue-500/15 text-blue-600" },
  announcement: { label: "Announcement", pill: "bg-accent/10 text-accent-strong" },
  hero: { label: "Hero", pill: "bg-indigo-500/15 text-indigo-600" },
};

const STATUS_META = {
  published: { label: "Published", pill: "bg-emerald-500/15 text-emerald-600" },
  draft: { label: "Draft", pill: "bg-surface text-muted" },
};

export default function DashboardContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [p, setP] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    backend.entities.Page.filter({ id }).then((r) => setP(r[0] || null));
  }, [id]);

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this page?",
      body: `${p?.title || "This page"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await backend.entities.Page.delete(id);
      toast.success("Removed");
      navigate("/dashboard/content");
    } catch {
      toast.error("Couldn't delete content");
    }
  };

  const back = (
    <Link to="/dashboard/content" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to content
    </Link>
  );

  if (p === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="bg-card rounded-card p-10 text-center shadow-card">
          <h1 className="text-xl font-display font-bold text-foreground">Content not found</h1>
          <p className="text-sm text-muted mt-1">This page may have been removed.</p>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[p.type] || TYPE_META.page;
  const sm = STATUS_META[p.status] || STATUS_META.draft;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      {/* Header card */}
      <div className="bg-card rounded-card overflow-hidden shadow-card">
        {p.cover_image && (
          <div className="aspect-[3/1] bg-surface">
            <img src={p.cover_image} alt={p.title} onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent-strong flex items-center justify-center shrink-0"><FileText className="w-7 h-7" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.pill}`}>{meta.label}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${sm.pill}`}>{sm.label}</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground break-words mt-1.5">{p.title || "Untitled"}</h1>
            {p.slug && <p className="text-sm font-mono text-muted mt-0.5 break-all">/{p.slug}</p>}
            {p.excerpt && <p className="text-sm text-muted mt-2">{p.excerpt}</p>}
          </div>
          {can(role, "content", "delete") && (
            <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-accent-strong hover:bg-accent-soft shrink-0">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Meta + body */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Details */}
        <div className="bg-card rounded-card p-6 lg:col-span-1 shadow-card">
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">Details</h2>
          <div className="space-y-1">
            <DetailRow icon={FileText} label="Type" value={meta.label} />
            <DetailRow icon={Hash} label="Status" value={sm.label} />
            <DetailRow icon={Link2} label="Slug" value={p.slug ? `/${p.slug}` : null} />
            <DetailRow icon={ListOrdered} label="Order" value={p.order != null ? String(p.order) : null} />
            <DetailRow icon={CalendarDays} label="Created" value={p.created_at ? moment(p.created_at).format("D MMM YYYY") : null} />
          </div>
        </div>

        {/* Body */}
        <div className="bg-card rounded-card p-6 lg:col-span-2 shadow-card">
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">Body</h2>
          {p.body
            ? <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{p.body}</p>
            : <p className="text-sm text-muted">No body content for this page.</p>}
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
    <Icon className="w-4 h-4 text-accent-strong mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[11px] text-muted uppercase tracking-wider">{label}</div>
      <div className="text-sm text-foreground break-words">{value || <span className="text-muted">Not set</span>}</div>
    </div>
  </div>
);
