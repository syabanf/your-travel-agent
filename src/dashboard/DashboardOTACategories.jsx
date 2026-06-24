import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronLeft, Tags, Eye, EyeOff } from "lucide-react";
import DataTable from "@/dashboard/DataTable";
import Drawer from "@/dashboard/Drawer";
import SearchableSelect from "@/dashboard/SearchableSelect";
import { ICON_OPTIONS, BEHAVIORS, iconFor } from "@/data/otaCategories";
import { can } from "@/dashboard/rbac";
import { useRole } from "@/dashboard/RoleContext";

const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
const EMPTY = { label: "", icon: "Ticket", behavior: "attraction", order: 0, active: true };

export default function DashboardOTACategories() {
  const { role } = useRole();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit

  const load = () => base44.entities.OtaCategory.list("order", 100).then((r) => setRows(r || []));
  useEffect(() => { load(); }, []);

  const canEdit = can(role, "ota", "edit");
  const canCreate = can(role, "ota", "create");
  const canDelete = can(role, "ota", "delete");

  const openNew = () => setEditing({ ...EMPTY, order: (rows?.length ? Math.max(...rows.map((r) => r.order || 0)) : 0) + 1 });
  const openEdit = (r) => setEditing({ ...r });

  const save = async (e) => {
    e.preventDefault();
    const label = (editing.label || "").trim();
    if (!label) { toast.error("Enter a label"); return; }
    const payload = {
      label,
      icon: editing.icon || "Ticket",
      behavior: editing.behavior || "attraction",
      order: Number(editing.order) || 0,
      active: !!editing.active,
    };
    try {
      if (editing.id) {
        await base44.entities.OtaCategory.update(editing.id, payload);
        toast.success("Category updated");
      } else {
        let key = slug(label) || "category";
        const existing = new Set((rows || []).map((r) => r.key));
        if (existing.has(key)) { let i = 2; while (existing.has(`${key}_${i}`)) i++; key = `${key}_${i}`; }
        await base44.entities.OtaCategory.create({ ...payload, key });
        toast.success("Category added");
      }
      setEditing(null);
      load();
    } catch { toast.error("Couldn't save category"); }
  };

  const toggleActive = async (r) => {
    if (!canEdit) return;
    try { await base44.entities.OtaCategory.update(r.id, { active: !r.active }); load(); }
    catch { toast.error("Couldn't update"); }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete the "${r.label}" category? It will disappear from the mobile app.`)) return;
    try { await base44.entities.OtaCategory.delete(r.id); toast.success("Category deleted"); load(); }
    catch { toast.error("Couldn't delete"); }
  };

  const columns = [
    { key: "label", label: "Category", className: "font-medium text-mora-primary", render: (r) => {
      const Icon = iconFor(r.icon);
      return <span className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-mora-gold/10 text-gold flex items-center justify-center"><Icon className="w-4 h-4" /></span>{r.label}</span>;
    } },
    { key: "behavior", label: "Search flow", render: (r) => <span className="text-mora-neutral capitalize">{(r.behavior || "").replace("_", " ")}</span> },
    { key: "order", label: "Order", align: "right", render: (r) => r.order },
    { key: "active", label: "Status", render: (r) => (
      <button onClick={(e) => { e.stopPropagation(); toggleActive(r); }} disabled={!canEdit} className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${r.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"} ${canEdit ? "hover:opacity-80" : ""}`}>
        {r.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}{r.active ? "Visible" : "Hidden"}
      </button>
    ) },
    { key: "actions", label: "", align: "right", render: (r) => (
      <span className="inline-flex gap-1">
        {canEdit && <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="w-8 h-8 rounded-lg border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5 inline-flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>}
        {canDelete && <button onClick={(e) => { e.stopPropagation(); remove(r); }} className="w-8 h-8 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>}
      </span>
    ) },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link to="/dashboard/ota" className="inline-flex items-center gap-1.5 text-sm text-mora-neutral hover:text-mora-primary mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to OTA channels
      </Link>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-1 flex items-center gap-1.5"><Tags className="w-3.5 h-3.5" /> Distribution</p>
          <h1 className="text-2xl font-display font-bold text-mora-primary">Booking Categories</h1>
          <p className="text-sm text-mora-neutral mt-0.5">Manage the categories travellers see in the mobile app's Book tab. Hidden categories disappear from the app.</p>
        </div>
        {canCreate && (
          <button onClick={openNew} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 press shrink-0"><Plus className="w-4 h-4" /> Add category</button>
        )}
      </header>

      <DataTable columns={columns} rows={rows || []} onRowClick={canEdit ? openEdit : undefined} rowKey={(r) => r.id} empty="No categories yet." />

      <Drawer open={!!editing} onClose={() => setEditing(null)} icon={editing?.id ? Pencil : Plus} width="max-w-md"
        title={editing?.id ? "Edit category" : "Add category"} subtitle="Shown in the mobile app's Book (OTA) tab">
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Label</label>
              <input autoFocus value={editing.label} onChange={(e) => setEditing((p) => ({ ...p, label: e.target.value }))} className="dash-input" placeholder="e.g. Cruise" />
            </div>
            <div>
              <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Icon</label>
              <SearchableSelect value={editing.icon} onChange={(v) => setEditing((p) => ({ ...p, icon: v }))} options={ICON_OPTIONS} placeholder="Pick an icon" />
            </div>
            <div>
              <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Search flow</label>
              <SearchableSelect value={editing.behavior} onChange={(v) => setEditing((p) => ({ ...p, behavior: v }))} options={BEHAVIORS} placeholder="How it searches" />
              <p className="text-[11px] text-mora-neutral/60 mt-1">Determines the search form & results the app shows for this category.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-[11px] text-mora-neutral uppercase tracking-wider mb-1 block">Order</label>
                <input type="number" value={editing.order} onChange={(e) => setEditing((p) => ({ ...p, order: e.target.value }))} className="dash-input" />
              </div>
              <label className="flex items-center gap-2 h-[2.6rem] px-1 text-sm text-mora-primary cursor-pointer">
                <input type="checkbox" checked={!!editing.active} onChange={(e) => setEditing((p) => ({ ...p, active: e.target.checked }))} className="w-4 h-4 accent-mora-crimson" />
                Visible in app
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-mora-primary/15 text-mora-primary hover:bg-mora-primary/5">Cancel</button>
              <button type="submit" className="flex-1 btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold">{editing.id ? "Save changes" : "Add category"}</button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
}
