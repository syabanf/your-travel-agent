import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ClipboardCheck, Eye, FileText, FolderOpen, Image as ImageIcon, Loader2, Paperclip, Plus, Trash2, Undo2, Upload } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import { backend } from "@/api/backend";
import { ACCEPTED_FILES, deleteFile, fileSize, openFile, saveFile } from "@/api/files";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import DataTable from "@/dashboard/DataTable";
import Drawer from "@/dashboard/Drawer";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { DOC_STATUS, docLabel, docStatus, needsDocument } from "@/data/membership";
import { DEFAULT_DOCUMENT_TYPES } from "@/data/masterData";

const STATUS_OPTIONS = Object.entries(DOC_STATUS).map(([value, s]) => ({ value, label: s.label }));
const NEEDS_MEMBER = new Set(["requested", "needs_action"]);

/**
 * Travel documents (Icon Membership 5.2, 5.3, 11.6). Each trip's checklist
 * comes from Master data > Document types. Members upload scans; the team
 * reviews them, sends them back with a note, or uploads finished documents.
 * Every change the member must act on, or can use, sends a notification.
 */
export default function DashboardDocuments() {
  const { role } = useRole();
  const canEdit = can(role, "bookings", "edit");
  const [docs, setDocs] = useState(null);
  const [trips, setTrips] = useState([]);
  const [types, setTypes] = useState(DEFAULT_DOCUMENT_TYPES);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [tripId, setTripId] = useState("");
  const [adding, setAdding] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    const [d, t, ty, m] = await Promise.all([
      backend.entities.TravelDocument.list("-updated_at"),
      backend.entities.Trip.list(),
      backend.entities.DocumentType.list("order"),
      backend.entities.TripMember.list(),
    ]);
    setDocs(d);
    setTrips(t);
    if (ty.length) setTypes(ty);
    setMembers(m);
  };
  useEffect(() => { load().catch(() => setDocs([])); }, []);

  const tripTitle = (id) => trips.find((t) => t.id === id)?.title || "Trip";
  const label = (key) => docLabel(types, key);
  const typeOptions = types.filter((t) => t.active !== false).map((t) => ({ value: t.key, label: t.label }));

  const notify = (doc, title, message) =>
    backend.entities.Notification.create({
      title, message, type: "document", category: "personal", audience: "targeted",
      recipients: [doc.member_email], related_trip_id: doc.trip_id, is_read: false,
    });
  const remind = (doc, note) => notify(doc, `${label(doc.type)} needed for ${tripTitle(doc.trip_id)}`, note || docStatus(doc.status).hint);

  const setStatus = async (doc, status, note = doc.note) => {
    if (status === doc.status && note === doc.note) return;
    try {
      await backend.entities.TravelDocument.update(doc.id, { status, note, updated_at: new Date().toISOString() });
      if (NEEDS_MEMBER.has(status)) await remind({ ...doc, status }, note);
      if (status === "approved") await notify(doc, `${label(doc.type)} ready for ${tripTitle(doc.trip_id)}`, "Checked and approved. You can open it in My documents.");
      toast.success(`${label(doc.type)} marked ${docStatus(status).label.toLowerCase()}`, {
        description: NEEDS_MEMBER.has(status) || status === "approved" ? `${doc.member_email} was notified.` : doc.member_email,
      });
      await load();
    } catch {
      toast.error("The status wasn't saved. Try again.");
    }
  };

  const add = async () => {
    if (!adding.member_email.trim() || !adding.trip_id) {
      toast.error("Pick a trip and enter the member's email");
      return;
    }
    try {
      const row = await backend.entities.TravelDocument.create({ ...adding, member_email: adding.member_email.trim(), files: [], updated_at: new Date().toISOString() });
      if (NEEDS_MEMBER.has(row.status)) await remind(row, row.note);
      toast.success(`${label(row.type)} requested`, { description: `${row.member_email} was notified.` });
      setAdding(null);
      await load();
    } catch {
      toast.error("The request wasn't saved. Try again.");
    }
  };

  // Creates the missing checklist rows for everyone on the chosen trip.
  const buildChecklist = async () => {
    const trip = trips.find((t) => t.id === tripId);
    const emails = [...new Set(members.filter((m) => m.trip_id === tripId && m.email).map((m) => m.email.toLowerCase()))];
    const needed = types.filter((t) => needsDocument(t, trip));
    const have = new Set((docs || []).filter((d) => d.trip_id === tripId).map((d) => `${d.member_email.toLowerCase()}|${d.type}`));
    const rows = emails.flatMap((email) => needed
      .filter((t) => !have.has(`${email}|${t.key}`))
      .map((t) => ({ member_email: email, trip_id: tripId, type: t.key, status: t.provided_by === "team" ? "preparing" : "requested", note: "", files: [] })));
    if (!rows.length) {
      toast.success("The checklist is complete", { description: emails.length ? `${trip.title}: every member has every document slot.` : `${trip.title} has no members yet.` });
      return;
    }
    try {
      const now = new Date().toISOString();
      for (const r of rows) await backend.entities.TravelDocument.create({ ...r, updated_at: now });
      for (const email of new Set(rows.filter((r) => r.status === "requested").map((r) => r.member_email))) {
        const n = rows.filter((r) => r.member_email === email && r.status === "requested").length;
        await notify({ member_email: email, trip_id: tripId }, `Documents needed for ${trip.title}`, `Upload ${n} document${n > 1 ? "s" : ""} in My documents before departure.`);
      }
      toast.success(`Checklist built for ${trip.title}`, { description: `${rows.length} document slot${rows.length > 1 ? "s" : ""} for ${new Set(rows.map((r) => r.member_email)).size} member(s).` });
      await load();
    } catch {
      toast.error("The checklist wasn't built. Try again.");
    }
  };

  const inTrip = (docs || []).filter((d) => !tripId || d.trip_id === tripId);
  const counts = { all: inTrip.length };
  for (const d of inTrip) counts[d.status] = (counts[d.status] || 0) + 1;
  const rows = inTrip.filter((d) => filter === "all" || d.status === filter);
  const current = (docs || []).find((d) => d.id === openId);

  const columns = [
    { key: "member", label: "Member", className: "text-foreground", render: (d) => <span className="text-sm">{d.member_email}</span> },
    { key: "trip", label: "Trip", render: (d) => <span className="text-sm">{tripTitle(d.trip_id)}</span> },
    { key: "type", label: "Document", className: "text-foreground", render: (d) => <span className="text-sm font-medium">{label(d.type)}</span> },
    { key: "files", label: "Files", render: (d) => (d.files?.length
      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground"><Paperclip className="size-3.5" aria-hidden="true" />{d.files.length}</span>
      : <span className="text-xs text-muted">None</span>) },
    { key: "status", label: "Status", render: (d) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${docStatus(d.status).tone}`}>{docStatus(d.status).label}</span> },
    { key: "updated", label: "Updated", render: (d) => <span className="text-xs">{d.updated_at ? moment(d.updated_at).fromNow() : "Never"}</span> },
    { key: "open", label: "", align: "right", render: (d) => (
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(d.id); }} className="h-9 rounded-full px-3 text-xs font-semibold text-accent-strong transition-colors hover:bg-accent-soft">
        {d.status === "in_review" && canEdit ? "Review" : "Open"}
      </button>
    ) },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="bookings" />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent-strong">
            <FolderOpen className="size-3.5" aria-hidden="true" /> Member app
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Travel documents</h1>
          <p className="mt-0.5 text-sm text-muted">
            Review what members upload and send the documents you issue. The checklist follows <Link to="/dashboard/master?tab=documents" className="font-semibold text-accent-strong hover:underline">Master data › Document types</Link>.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAdding({ member_email: "", trip_id: tripId, type: "passport", status: "requested", note: "" })}
            className="sheen inline-flex h-11 items-center gap-2 rounded-full bg-accent-strong px-4 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark"
          >
            <Plus className="size-4" aria-hidden="true" /> Request a document
          </button>
        )}
      </header>

      {adding && (
        <div className="animate-rise mb-4 grid grid-cols-1 gap-3 rounded-card bg-card p-5 shadow-card md:grid-cols-2 xl:grid-cols-5">
          <input value={adding.member_email} onChange={(e) => setAdding({ ...adding, member_email: e.target.value })} placeholder="member@email.com" aria-label="Member email" className="dash-input" />
          <SearchableSelect value={adding.trip_id} onChange={(v) => setAdding({ ...adding, trip_id: v })} options={trips.map((t) => ({ value: t.id, label: t.title }))} placeholder="Trip" ariaLabel="Trip" />
          <SearchableSelect value={adding.type} onChange={(v) => setAdding({ ...adding, type: v })} options={typeOptions} ariaLabel="Document type" />
          <input value={adding.note} onChange={(e) => setAdding({ ...adding, note: e.target.value })} placeholder="Note for the member" aria-label="Note" className="dash-input" />
          <div className="flex gap-2">
            <button type="button" onClick={add} className="h-11 flex-1 rounded-full bg-accent-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-dark">Send request</button>
            <button type="button" onClick={() => setAdding(null)} className="h-11 rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <SearchableSelect value={tripId} onChange={(v) => { setTripId(v || ""); setFilter("all"); }} options={trips.map((t) => ({ value: t.id, label: t.title }))} allowClear placeholder="All trips" ariaLabel="Trip" />
        </div>
        {tripId && canEdit && (
          <button type="button" onClick={buildChecklist} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-2">
            <ClipboardCheck className="size-4" aria-hidden="true" /> Build checklist for this trip
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Status">
        {[["all", "All"], ...STATUS_OPTIONS.map((o) => [o.value, o.label])].map(([v, text]) => (
          <button
            key={v}
            role="tab"
            aria-selected={filter === v}
            onClick={() => setFilter(v)}
            className={`h-9 rounded-full px-4 text-sm font-semibold transition-colors ${filter === v ? "bg-ink text-white" : "bg-card text-muted shadow-card hover:text-foreground"}`}
          >
            {text} <span className="opacity-75">{counts[v] || 0}</span>
          </button>
        ))}
      </div>

      {docs == null ? <div className="skeleton h-48" /> : <DataTable columns={columns} rows={rows} onRowClick={(d) => setOpenId(d.id)} empty="No documents with this status." minWidth={820} />}

      <Drawer open={!!current} onClose={() => setOpenId(null)} icon={FolderOpen} width="max-w-lg"
        title={current ? label(current.type) : ""} subtitle={current ? `${current.member_email} · ${tripTitle(current.trip_id)}` : ""}>
        {current && <Review doc={current} canEdit={canEdit} onStatus={setStatus} onChanged={load} notify={notify} label={label} tripTitle={tripTitle} />}
      </Drawer>
    </div>
  );
}

function Review({ doc, canEdit, onStatus, onChanged, notify, label, tripTitle }) {
  const [note, setNote] = useState(doc.note || "");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const files = doc.files || [];
  const st = docStatus(doc.status);
  useEffect(() => setNote(doc.note || ""), [doc.id, doc.note]);

  // The team's upload is the finished document, so it makes the slot ready.
  const upload = async (e) => {
    const picked = [...(e.target.files || [])];
    e.target.value = "";
    if (!picked.length) return;
    setBusy(true);
    try {
      const saved = [];
      for (const f of picked) saved.push({ ...(await saveFile(f)), from: "team" });
      await backend.entities.TravelDocument.update(doc.id, { files: [...files, ...saved], status: "approved", updated_at: new Date().toISOString() });
      await notify(doc, `${label(doc.type)} ready for ${tripTitle(doc.trip_id)}`, "Icon Holiday uploaded it. Open it in My documents.");
      toast.success(`${label(doc.type)} sent to ${doc.member_email}`, { description: `${saved.length} file${saved.length > 1 ? "s" : ""}, marked ready.` });
      await onChanged();
    } catch (err) {
      toast.error(err?.refused ? err.message : "The upload didn't finish. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async (file) => {
    try {
      await backend.entities.TravelDocument.update(doc.id, { files: files.filter((f) => f.id !== file.id), updated_at: new Date().toISOString() });
      await deleteFile(file.id).catch(() => {});
      toast.success(`${file.name} removed`);
      await onChanged();
    } catch {
      toast.error("The file wasn't removed. Try again.");
    }
  };

  const view = async (file) => {
    if (!(await openFile(file.id).catch(() => false))) toast.error(`${file.name} is stored on the uploader's device only.`, { description: "Files live in the browser in this demo." });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.tone}`}>{st.label}</span>
        {doc.updated_at && <span className="text-xs text-muted">Updated {moment(doc.updated_at).fromNow()}</span>}
      </div>

      <section className="rounded-card bg-card p-4 shadow-card">
        <p className="eyebrow mb-2">Files</p>
        {files.length === 0 ? (
          <p className="text-sm text-muted">Nothing uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => {
              const FileIcon = f.type?.startsWith("image/") ? ImageIcon : FileText;
              return (
                <li key={f.id} className="flex items-center gap-3 rounded-2xl bg-surface-2 p-2 pl-3">
                  <FileIcon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{f.name}</span>
                    <span className="block text-xs text-muted">{f.from === "team" ? "Icon Holiday" : "Member"} · {fileSize(f.size)} · {moment(f.uploaded_at).fromNow()}</span>
                  </span>
                  <button type="button" onClick={() => view(f)} aria-label={`Open ${f.name}`} className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface"><Eye className="size-4" aria-hidden="true" /></button>
                  {canEdit && <button type="button" onClick={() => removeFile(f)} aria-label={`Remove ${f.name}`} className="flex size-9 items-center justify-center rounded-full text-accent-strong transition-colors hover:bg-accent-soft"><Trash2 className="size-4" aria-hidden="true" /></button>}
                </li>
              );
            })}
          </ul>
        )}
        {canEdit && (
          <>
            <input ref={input} type="file" accept={ACCEPTED_FILES} multiple className="hidden" onChange={upload} aria-hidden="true" tabIndex={-1} />
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-60">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
              {busy ? "Uploading" : "Upload for the member"}
            </button>
            <p className="mt-1.5 text-xs text-muted">For what Icon Holiday issues: e-ticket, visa, insurance policy. It marks the document ready.</p>
          </>
        )}
      </section>

      {canEdit && (
        <section className="rounded-card bg-card p-4 shadow-card">
          <label className="block">
            <span className="eyebrow mb-1 block">Note for the member</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What is wrong or missing?" className="dash-input h-auto py-2.5" />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onStatus(doc, "needs_action", note.trim())} disabled={!note.trim()} title={note.trim() ? undefined : "Write a note first so the member knows what to fix"} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-50">
              <Undo2 className="size-4" aria-hidden="true" /> Send back
            </button>
            <button type="button" onClick={() => onStatus(doc, "approved", note.trim())} className="sheen inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent-strong text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark">
              <Check className="size-4" aria-hidden="true" /> Approve
            </button>
          </div>
          {!note.trim() && <p className="mt-1.5 text-xs text-muted">Send back needs a note so the member knows what to fix.</p>}
          <div className="mt-4">
            <span className="eyebrow mb-1 block">Or set the status</span>
            <SearchableSelect value={doc.status} onChange={(v) => onStatus(doc, v, note.trim())} options={STATUS_OPTIONS} ariaLabel="Status" />
          </div>
        </section>
      )}
    </div>
  );
}
