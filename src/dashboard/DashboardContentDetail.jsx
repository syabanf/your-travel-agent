import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ChevronLeft, Trash2, FileText, CalendarDays, Hash, Link2, ListOrdered,
} from "lucide-react";

const TYPE_META = {
  page: { label: "Page", pill: "bg-mora-primary/10 text-mora-neutral" },
  faq: { label: "FAQ", pill: "bg-blue-500/15 text-blue-600" },
  announcement: { label: "Announcement", pill: "bg-mora-gold/10 text-gold" },
  hero: { label: "Hero", pill: "bg-indigo-500/15 text-indigo-600" },
};

const STATUS_META = {
  published: { label: "Published", pill: "bg-emerald-500/15 text-emerald-600" },
  draft: { label: "Draft", pill: "bg-mora-primary/10 text-mora-neutral" },
};

export default function DashboardContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [p, setP] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    base44.entities.Page.filter({ id }).then((r) => setP(r[0] || null));
  }, [id]);

  const remove = async () => {
    try {
      await base44.entities.Page.delete(id);
      toast.success("Removed");
      navigate("/dashboard/content");
    } catch {
      toast.error("Couldn't delete content");
    }
  };

  const back = (
    <Link to="/dashboard/content" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-mora-primary mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to content
    </Link>
  );

  if (p === undefined) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        {back}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-10 text-center">
          <h1 className="text-xl font-display font-bold text-mora-primary">Content not found</h1>
          <p className="text-sm text-mora-neutral mt-1">This page may have been removed.</p>
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
      <div className="bg-white rounded-2xl border border-mora-primary/10 overflow-hidden">
        {p.cover_image && (
          <div className="aspect-[3/1] bg-mora-primary/5">
            <img src={p.cover_image} alt={p.title} onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-mora-gold/10 text-gold flex items-center justify-center shrink-0"><FileText className="w-7 h-7" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${meta.pill}`}>{meta.label}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${sm.pill}`}>{sm.label}</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-mora-primary break-words mt-1.5">{p.title || "Untitled"}</h1>
            {p.slug && <p className="text-sm font-mono text-mora-neutral/60 mt-0.5 break-all">/{p.slug}</p>}
            {p.excerpt && <p className="text-sm text-mora-neutral mt-2">{p.excerpt}</p>}
          </div>
          {can(role, "content", "delete") && (
            <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-red-600 hover:bg-red-50 shrink-0">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Meta + body */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Details */}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 lg:col-span-1">
          <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Details</h2>
          <div className="space-y-1">
            <DetailRow icon={FileText} label="Type" value={meta.label} />
            <DetailRow icon={Hash} label="Status" value={sm.label} />
            <DetailRow icon={Link2} label="Slug" value={p.slug ? `/${p.slug}` : null} />
            <DetailRow icon={ListOrdered} label="Order" value={p.order != null ? String(p.order) : null} />
            <DetailRow icon={CalendarDays} label="Created" value={p.created_date ? moment(p.created_date).format("D MMM YYYY") : null} />
          </div>
        </div>

        {/* Body */}
        <div className="bg-white rounded-2xl border border-mora-primary/10 p-6 lg:col-span-2">
          <h2 className="font-display font-semibold text-lg text-mora-primary mb-4">Body</h2>
          {p.body
            ? <p className="text-sm text-mora-primary leading-relaxed whitespace-pre-wrap break-words">{p.body}</p>
            : <p className="text-sm text-mora-neutral/60">No body content for this page.</p>}
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2 border-b border-mora-primary/5 last:border-0">
    <Icon className="w-4 h-4 text-gold mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-[11px] text-mora-neutral uppercase tracking-wider">{label}</div>
      <div className="text-sm text-mora-primary break-words">{value || <span className="text-mora-neutral/50">Not set</span>}</div>
    </div>
  </div>
);
