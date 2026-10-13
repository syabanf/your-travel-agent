import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, FileText, FolderOpen, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import PageHeader from "../components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { backend } from "@/api/backend";
import { ACCEPTED_FILES, deleteFile, fileSize, openFile, saveFile } from "@/api/files";
import { currentEmail } from "@/lib/featureAccess";
import useMasterData from "@/lib/useMasterData";
import { DEFAULT_DOCUMENT_TYPES } from "@/data/masterData";
import { docChecklist, docStatus, tripPhase } from "@/data/membership";

const MEMBER_ACTS = new Set(["requested", "needs_action"]);

/**
 * Member documents (Icon Membership 5.2, 5.3, 12.4). Each trip lists the
 * documents it needs, from Master data > Document types. The member uploads
 * a photo or PDF; Icon Holiday reviews it, or uploads what it supplies
 * (ticket, visa, policy) for the member to open here.
 */
export default function MyDocuments() {
  const types = useMasterData("DocumentType", DEFAULT_DOCUMENT_TYPES);
  const [trips, setTrips] = useState(null);
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(null);
  const inputRef = useRef(null);
  const target = useRef(null);
  const me = currentEmail();

  const load = async () => {
    const [d, all, members] = await Promise.all([
      backend.entities.TravelDocument.filter({ member_email: me }),
      backend.entities.Trip.list("start_date"),
      backend.entities.TripMember.filter({ email: me }),
    ]);
    const joined = new Set([...members.map((m) => m.trip_id), ...d.map((x) => x.trip_id)]);
    setDocs(d);
    setTrips(all.filter((t) => joined.has(t.id) && (tripPhase(t) !== "past" || d.some((x) => x.trip_id === t.id))));
  };
  useEffect(() => { load().catch(() => setTrips([])); }, []);

  const pick = (trip, item) => {
    target.current = { trip, item };
    inputRef.current?.click();
  };

  const upload = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    const { trip, item } = target.current || {};
    if (!files.length || !trip) return;
    setBusy(item.type.key + trip.id);
    try {
      const saved = [];
      for (const f of files) saved.push({ ...(await saveFile(f)), from: "member" });
      const now = new Date().toISOString();
      if (item.doc) {
        await backend.entities.TravelDocument.update(item.doc.id, { files: [...(item.doc.files || []), ...saved], status: "in_review", updated_at: now });
      } else {
        await backend.entities.TravelDocument.create({ member_email: me, trip_id: trip.id, type: item.type.key, status: "in_review", note: "", files: saved, updated_at: now });
      }
      toast.success(`${item.type.label} uploaded`, { description: "Icon Holiday will check it and let you know." });
      await load();
    } catch (err) {
      toast.error(err?.refused ? err.message : "The upload didn't finish. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const removeFile = async (doc, file) => {
    try {
      const files = (doc.files || []).filter((f) => f.id !== file.id);
      const stillMine = files.some((f) => f.from === "member");
      await backend.entities.TravelDocument.update(doc.id, { files, ...(stillMine ? {} : { status: "requested" }), updated_at: new Date().toISOString() });
      await deleteFile(file.id).catch(() => {});
      toast.success(`${file.name} removed`);
      await load();
    } catch {
      toast.error("The file wasn't removed. Try again.");
    }
  };

  const view = async (file) => {
    if (!(await openFile(file.id).catch(() => false))) toast.error(`${file.name} isn't on this device any more.`);
  };

  const lists = (trips || []).map((trip) => ({ trip, items: docChecklist(trip, types, docs) })).filter((g) => g.items.length);
  const toDo = lists.flatMap((g) => g.items).filter((i) => MEMBER_ACTS.has(i.status)).length;

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader title="My documents" subtitle="Checklist per trip" showBack />
      <input ref={inputRef} type="file" accept={ACCEPTED_FILES} multiple className="hidden" onChange={upload} aria-hidden="true" tabIndex={-1} />
      <div className="space-y-4 px-5">
        {trips && toDo > 0 && (
          <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-strong">
            {toDo} document{toDo > 1 ? "s" : ""} to upload. A clear phone photo or a PDF works.
          </p>
        )}

        {trips === null && <div className="skeleton h-40" />}
        {trips && lists.length === 0 && (
          <EmptyState icon={FolderOpen} title="No documents yet" hint="Your checklist appears here once you join a trip." />
        )}

        <div className="stagger space-y-4">
          {lists.map(({ trip, items }) => {
            const ready = items.filter((i) => i.status === "approved").length;
            return (
              <section key={trip.id} className="rounded-card bg-card p-4 shadow-card">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-foreground">{trip.title}</h2>
                    {trip.start_date && <p className="text-xs text-muted">Departs {moment(trip.start_date).format("D MMM YYYY")}</p>}
                  </div>
                  <Link to={`/itinerary/${trip.id}`} className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-accent-strong hover:bg-accent-soft">Open trip</Link>
                </div>
                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-foreground">{ready} of {items.length} ready</span>
                    <span className="text-muted">{Math.round((ready / items.length) * 100)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface" role="img" aria-label={`${ready} of ${items.length} documents ready`}>
                    <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(ready / items.length) * 100}%` }} />
                  </div>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <ChecklistItem
                      key={item.type.key}
                      item={item}
                      busy={busy === item.type.key + trip.id}
                      onUpload={() => pick(trip, item)}
                      onView={view}
                      onRemove={removeFile}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ item, busy, onUpload, onView, onRemove }) {
  const st = docStatus(item.status);
  const Icon = st.icon;
  const files = item.doc?.files || [];
  const byMember = item.type.provided_by !== "team";
  const canUpload = byMember && item.status !== "approved";
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${st.tone}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{item.type.label}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.tone}`}>{st.label}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">{item.doc?.note || (item.status === "requested" ? item.type.description || st.hint : st.hint)}</p>

          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f) => {
                const FileIcon = f.type?.startsWith("image/") ? ImageIcon : FileText;
                const mine = f.from === "member";
                return (
                  <li key={f.id} className="flex items-center gap-2 rounded-xl bg-surface-2 py-1.5 pl-2.5 pr-1">
                    <FileIcon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">{f.name}</span>
                      <span className="block text-[11px] text-muted">{mine ? "You" : "From Icon Holiday"} · {fileSize(f.size)}</span>
                    </span>
                    <button type="button" onClick={() => onView(f)} aria-label={`Open ${f.name}`} className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface">
                      <Eye className="size-4" aria-hidden="true" />
                    </button>
                    {mine && item.status !== "approved" && (
                      <button type="button" onClick={() => onRemove(item.doc, f)} aria-label={`Remove ${f.name}`} className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground">
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {canUpload && (
            <button
              type="button"
              onClick={onUpload}
              disabled={busy}
              className={`mt-2 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors disabled:opacity-60 ${MEMBER_ACTS.has(item.status) ? "bg-accent-strong text-white hover:bg-accent-dark" : "bg-surface text-foreground hover:bg-border"}`}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Upload className="size-3.5" aria-hidden="true" />}
              {busy ? "Uploading" : item.status === "needs_action" ? "Upload again" : files.some((f) => f.from === "member") ? "Add another file" : "Upload photo or PDF"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
