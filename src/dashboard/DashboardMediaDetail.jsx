import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { backend } from "@/api/backend";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import { toast } from "sonner";
import moment from "moment";
import {
  ChevronLeft, Trash2, Copy, ExternalLink, Image as ImageIcon, Tag, CalendarDays, Link2,
} from "lucide-react";
import { confirmDialog } from "@/components/ConfirmDialog";

export default function DashboardMediaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useRole();
  const [m, setM] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    backend.entities.MediaAsset.filter({ id }).then((r) => setM(r[0] || null));
  }, [id]);

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Delete this asset?",
      body: `${m?.title || "This asset"} will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await backend.entities.MediaAsset.delete(id);
      toast.success("Media removed");
      navigate("/dashboard/media");
    } catch {
      toast.error("Couldn't delete media");
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(m.url);
      toast.success("URL copied");
    } catch { toast.error("Couldn't copy URL"); }
  };

  const back = (
    <Link to="/dashboard/media" className="inline-flex items-center gap-1.5 text-sm text-ich-neutral hover:text-ich-primary mb-4">
      <ChevronLeft className="w-4 h-4" /> Back to media
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
          <h1 className="text-xl font-display font-bold text-ich-primary">Media not found</h1>
          <p className="text-sm text-ich-neutral mt-1">This asset may have been removed.</p>
        </div>
      </div>
    );
  }

  const tags = Array.isArray(m.tags) ? m.tags : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {back}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Image preview */}
        <div className="bg-white rounded-2xl border border-ich-primary/10 overflow-hidden">
          <div className="aspect-video bg-ich-primary/5 relative flex items-center justify-center">
            {m.url && (
              <img
                src={m.url}
                alt={m.title}
                onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 items-center justify-center text-ich-neutral/40" style={{ display: m.url ? "none" : "flex" }}>
              <ImageIcon className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-ich-primary/10 p-6 flex flex-col">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ich-gold/10 text-gold flex items-center justify-center shrink-0"><ImageIcon className="w-6 h-6" /></div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-display font-bold text-ich-primary break-words">{m.title || "Untitled asset"}</h1>
              {m.created_date && <p className="text-sm text-ich-neutral/70 mt-0.5">Added {moment(m.created_date).format("D MMM YYYY")}</p>}
            </div>
            {can(role, "media", "delete") && (
              <button onClick={remove} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 text-red-600 hover:bg-red-50 shrink-0">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>

          <div className="mt-5 space-y-1">
            <DetailRow icon={Link2} label="URL" value={m.url ? <a href={m.url} target="_blank" rel="noreferrer" className="text-ich-primary hover:text-gold break-all">{m.url}</a> : null} />
            <DetailRow icon={CalendarDays} label="Added" value={m.created_date ? moment(m.created_date).format("D MMM YYYY") : null} />
            <DetailRow icon={Tag} label="Tags" value={tags.length ? (
              <span className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => <span key={i} className="text-[11px] bg-ich-primary/5 text-ich-neutral rounded-full px-2 py-0.5">{t}</span>)}
              </span>
            ) : null} />
          </div>

          <div className="flex flex-wrap gap-2 mt-auto pt-6">
            <button onClick={copyUrl} disabled={!m.url} className="rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border border-ich-primary/15 text-ich-primary hover:bg-ich-primary/5 press disabled:opacity-50">
              <Copy className="w-4 h-4" /> Copy URL
            </button>
            {m.url && (
              <a href={m.url} target="_blank" rel="noreferrer" className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open image
              </a>
            )}
          </div>
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
