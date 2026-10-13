import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Database, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { backend } from "@/api/backend";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";
import ReadOnlyBanner from "@/dashboard/ReadOnlyBanner";
import DataTable from "@/dashboard/DataTable";
import Drawer from "@/dashboard/Drawer";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { confirmDialog } from "@/components/ConfirmDialog";
import { MASTER_TABS } from "@/dashboard/masterData";

const slug = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");

// Arrays edit as text: one per line, or comma separated.
const toText = (f, v) => (f.type === "lines" ? (v || []).join("\n") : f.type === "tags" ? (v || []).join(", ") : v ?? (f.type === "check" ? false : ""));
const fromText = (f, v) => {
  if (f.type === "lines") return String(v).split("\n").map((x) => x.trim()).filter(Boolean);
  if (f.type === "tags") return String(v).split(",").map((x) => x.trim()).filter(Boolean);
  if (f.type === "number") return Number(v) || 0;
  if (f.type === "check") return !!v;
  return f.upper ? String(v).trim().toUpperCase() : String(v).trim();
};

/**
 * Master data (back office): the lists the member app reads, in one place.
 * One tab per entity; the tab lives in the URL so a link opens the right list.
 */
export default function DashboardMasterData() {
  const { role } = useRole();
  const [params, setParams] = useSearchParams();
  const tab = MASTER_TABS.find((t) => t.key === params.get("tab")) || MASTER_TABS[0];
  const [rows, setRows] = useState(null);
  const [counts, setCounts] = useState({});
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [tried, setTried] = useState(false);

  const canCreate = can(role, "master", "create");
  const canEdit = can(role, "master", "edit");
  const canDelete = can(role, "master", "delete");
  const api = backend.entities[tab.entity];
  const nameOf = (r) => (tab.name || tab.columns[0].title)(r);

  const load = () => api.list(tab.sort, 1000).then((r) => {
    setRows(r || []);
    setCounts((c) => ({ ...c, [tab.key]: (r || []).length }));
  });
  useEffect(() => {
    setRows(null);
    setQ("");
    load().catch(() => setRows([]));
  }, [tab.key]);
  useEffect(() => {
    Promise.all(MASTER_TABS.map((t) => backend.entities[t.entity].list().then((r) => [t.key, r.length])))
      .then((pairs) => setCounts(Object.fromEntries(pairs)))
      .catch(() => {});
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows || []).filter((r) => !needle || tab.search(r).toLowerCase().includes(needle));
  }, [rows, q, tab]);

  const open = (row) => {
    setTried(false);
    setEditing(row
      ? { ...row, ...Object.fromEntries(tab.fields.map((f) => [f.key, toText(f, row[f.key])])) }
      : { active: true, ...Object.fromEntries(tab.fields.map((f) => [f.key, f.default ?? toText(f, f.type === "number" ? (rows?.length || 0) + 1 : undefined)])) });
  };
  const visible = (f) => !f.showIf || f.showIf(editing);
  // A system row keeps its identity: other records and postings point at it.
  const locked = (f) => f.fixedKey && editing?.id && tab.fixed?.(editing);
  const missing = editing ? tab.fields.filter((f) => f.required && visible(f) && !String(editing[f.key] || "").trim()) : [];

  const save = async (e) => {
    e.preventDefault();
    setTried(true);
    if (missing.length) { toast.error(`Fill in ${missing.map((f) => f.label.toLowerCase()).join(" and ")}`); return; }
    const payload = { active: editing.active !== false, ...Object.fromEntries(tab.fields.map((f) => [f.key, fromText(f, editing[f.key])])) };
    const name = nameOf(payload);
    try {
      if (editing.id) {
        await api.update(editing.id, payload);
        toast.success(`${name} saved`);
      } else {
        const taken = new Set((rows || []).map((r) => r.key));
        let key = slug(tab.keyFrom(payload)) || tab.key;
        for (let i = 2; taken.has(key); i++) key = `${slug(tab.keyFrom(payload))}_${i}`;
        await api.create({ ...payload, key });
        toast.success(`${name} added`, { description: tab.label });
      }
      setEditing(null);
      await load();
    } catch {
      toast.error(`The ${tab.noun} wasn't saved. Try again.`);
    }
  };

  const toggle = async (row) => {
    try {
      await api.update(row.id, { active: row.active === false });
      toast.success(`${nameOf(row)} ${row.active === false ? "shown in" : "hidden from"} the app`);
      await load();
    } catch { toast.error("The change wasn't saved. Try again."); }
  };

  const remove = async (row) => {
    const name = nameOf(row);
    const ok = await confirmDialog({
      title: `Delete ${name}?`,
      body: `It disappears from the member app. Hide it instead if you may need it again.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try { await api.delete(row.id); toast.success(`${name} deleted`); await load(); }
    catch { toast.error(`${name} wasn't deleted. Try again.`); }
  };

  const columns = [
    ...tab.columns.map((c, i) => ({
      key: `c${i}`,
      label: c.label,
      align: c.align,
      className: c.title ? "text-foreground" : undefined,
      render: (r) => {
        if (c.title) return <span className="block min-w-0"><span className="block font-semibold">{c.title(r)}</span>{c.sub?.(r) && <span className="block max-w-xs truncate text-xs text-muted">{c.sub(r)}</span>}</span>;
        if (c.mono) return c.mono(r) ? <span className="block"><span className="font-mono text-xs font-semibold text-foreground">{c.mono(r)}</span>{c.sub?.(r) && <span className="block max-w-[14rem] truncate text-xs text-muted">{c.sub(r)}</span>}</span> : <span className="text-muted">None</span>;
        return c.text(r) || <span className="text-muted">None</span>;
      },
    })),
    { key: "status", label: "In app", render: (r) => (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (canEdit) toggle(r); }}
        disabled={!canEdit}
        aria-label={`${r.active === false ? "Show" : "Hide"} ${nameOf(r)}`}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${r.active === false ? "bg-surface text-muted" : "bg-success-soft text-success"} ${canEdit ? "hover:opacity-80" : "cursor-default"}`}
      >
        {r.active === false ? <EyeOff className="size-3" aria-hidden="true" /> : <Eye className="size-3" aria-hidden="true" />}
        {r.active === false ? "Hidden" : "Shown"}
      </button>
    ) },
    ...(canEdit || canDelete ? [{ key: "actions", label: "", align: "right", render: (r) => (
      <span className="inline-flex gap-1">
        {canEdit && <button type="button" onClick={(e) => { e.stopPropagation(); open(r); }} aria-label={`Edit ${nameOf(r)}`} className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface"><Pencil className="size-3.5" aria-hidden="true" /></button>}
        {canDelete && !tab.fixed?.(r) && <button type="button" onClick={(e) => { e.stopPropagation(); remove(r); }} aria-label={`Delete ${nameOf(r)}`} className="flex size-9 items-center justify-center rounded-full text-accent-strong transition-colors hover:bg-accent-soft"><Trash2 className="size-3.5" aria-hidden="true" /></button>}
      </span>
    ) }] : []),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ReadOnlyBanner resource="master" />
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent-strong">
            <Database className="size-3.5" aria-hidden="true" /> Back office
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Master data</h1>
          <p className="mt-0.5 text-sm text-muted">The lists the member app reads. Changes show in the app on its next load.</p>
        </div>
        {canCreate && (
          <button type="button" onClick={() => open(null)} className="sheen inline-flex h-11 items-center gap-2 rounded-full bg-accent-strong px-4 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark">
            <Plus className="size-4" aria-hidden="true" /> Add {tab.noun}
          </button>
        )}
      </header>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar" role="tablist" aria-label="Master data">
        {MASTER_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab.key}
            onClick={() => setParams({ tab: t.key }, { replace: true })}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${t.key === tab.key ? "bg-ink text-white" : "bg-card text-muted shadow-card hover:text-foreground"}`}
          >
            <t.icon className="size-4" aria-hidden="true" />
            {t.label} <span className="opacity-75">{counts[t.key] ?? ""}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{tab.hint}</p>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab.label.toLowerCase()}`} aria-label={`Search ${tab.label.toLowerCase()}`} className="dash-input pl-10" />
        </label>
      </div>

      {rows == null ? <div className="skeleton h-64" /> : (
        <DataTable columns={columns} rows={shown} onRowClick={canEdit ? open : undefined} empty={q ? `No ${tab.label.toLowerCase()} match "${q}".` : `No ${tab.label.toLowerCase()} yet.`} minWidth={720} />
      )}

      <Drawer open={!!editing} onClose={() => setEditing(null)} icon={editing?.id ? Pencil : Plus} width="max-w-lg"
        title={editing?.id ? `Edit ${tab.noun}` : `Add ${tab.noun}`} subtitle={tab.label}>
        {editing && (
          <form onSubmit={save} className="grid grid-cols-2 gap-4" noValidate>
            {tab.fields.filter(visible).map((f) => {
              const bad = tried && f.required && !String(editing[f.key] || "").trim();
              const set = (v) => setEditing((p) => ({ ...p, [f.key]: v }));
              const cls = `dash-input ${bad ? "border-accent-strong ring-2 ring-accent/30" : ""}`;
              if (f.type === "check") {
                return (
                  <label key={f.key} className="col-span-2 flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={!!editing[f.key]} onChange={(e) => set(e.target.checked)} className="size-4 accent-accent" />
                    {f.label}
                  </label>
                );
              }
              return (
                <label key={f.key} className={`block ${f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}`}>
                  <span className="eyebrow mb-1 block">{f.label}{f.required ? " *" : ""}</span>
                  {f.type === "select" && locked(f) ? (
                    <p className="dash-input flex items-center bg-surface-2 text-muted">{f.options.find((o) => o.value === editing[f.key])?.label}</p>
                  ) : f.type === "select" ? (
                    <SearchableSelect value={editing[f.key]} onChange={set} options={f.options} ariaLabel={f.label} />
                  ) : f.type === "textarea" || f.type === "lines" ? (
                    <textarea value={editing[f.key]} onChange={(e) => set(e.target.value)} rows={f.type === "lines" ? 5 : 3} placeholder={f.placeholder} className={`${cls} h-auto py-2.5`} />
                  ) : (
                    <input type={f.type === "number" ? "number" : "text"} value={editing[f.key]} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} disabled={locked(f)} className={`${cls} disabled:bg-surface-2 disabled:text-muted`} />
                  )}
                  {f.hint && <span className="mt-1 block text-xs text-muted">{f.hint}</span>}
                  {locked(f) && <span className="mt-1 block text-xs text-muted">Fixed on a system account.</span>}
                </label>
              );
            })}
            <label className="col-span-2 flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing((p) => ({ ...p, active: e.target.checked }))} className="size-4 accent-accent" />
              Show in the member app
            </label>
            <div className="col-span-2 flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="h-11 flex-1 rounded-full text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground">Cancel</button>
              <button type="submit" className="sheen h-11 flex-1 rounded-full bg-accent-strong text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark">
                {editing.id ? "Save changes" : `Add ${tab.noun}`}
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
