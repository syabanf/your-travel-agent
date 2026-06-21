import { Eye } from "lucide-react";
import { useRole } from "./RoleContext";
import { can } from "./rbac";

// Shows a clear read-only notice on a list page when the current role can
// view but not create/edit the resource (e.g. the Viewer role).
export default function ReadOnlyBanner({ resource }) {
  const { role } = useRole();
  const editable = can(role, resource, "create") || can(role, resource, "edit");
  if (editable) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-mora-neutral bg-mora-primary/[0.04] border border-mora-primary/10 rounded-xl px-4 py-2.5 mb-4">
      <Eye className="w-4 h-4 text-gold shrink-0" />
      You have <span className="font-medium text-mora-primary">read-only</span> access to this section.
    </div>
  );
}
