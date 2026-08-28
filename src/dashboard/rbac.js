// Role-Based Access Control for the admin dashboard.
// Resources map to dashboard sections; actions are view/create/edit/delete.

export const ROLES = [
  { key: "admin", label: "Administrator", desc: "Full access incl. team & settings" },
  { key: "manager", label: "Manager", desc: "Manage all content & customers" },
  { key: "editor", label: "Editor", desc: "Create & edit content (no delete)" },
  { key: "viewer", label: "Viewer", desc: "Read-only access" },
];

export const RESOURCES = ["overview", "destinations", "promotions", "bookings", "trips", "customers", "leads", "suppliers", "marketing", "content", "media", "settings", "reports", "erp", "ota", "pms", "audit", "team", "registrations"];

const ALL = ["view", "create", "edit", "delete"];
const VIEW = ["view"];

const PERMS = {
  admin: Object.fromEntries(RESOURCES.map((r) => [r, ALL])),
  manager: {
    overview: VIEW,
    destinations: ALL,
    promotions: ALL,
    bookings: ALL,
    trips: ALL,
    customers: ALL,
    leads: ALL,
    suppliers: ALL,
    marketing: ALL,
    content: ALL,
    media: ALL,
    settings: ALL,
    reports: VIEW,
    erp: VIEW,
    ota: ALL,
    pms: ALL,
    audit: VIEW,
    team: [],
    registrations: ALL,
  },
  editor: {
    overview: VIEW,
    destinations: ["view", "create", "edit"],
    promotions: ["view", "create", "edit"],
    bookings: VIEW,
    trips: VIEW,
    customers: ["view", "create", "edit"],
    leads: ["view", "create", "edit"],
    suppliers: ["view", "create", "edit"],
    marketing: ["view", "create", "edit"],
    content: ["view", "create", "edit"],
    media: ["view", "create", "edit"],
    settings: [],
    reports: VIEW,
    erp: VIEW,
    ota: ["view", "edit"],
    pms: ["view", "edit"],
    audit: [],
    team: [],
  },
  viewer: Object.fromEntries(RESOURCES.map((r) => [r, r === "team" || r === "audit" || r === "settings" ? [] : VIEW])),
};

/** can('editor', 'destinations', 'delete') -> false */
export function can(role, resource, action = "view") {
  const r = PERMS[role] ? role : "viewer";
  return (PERMS[r][resource] || []).includes(action);
}

export function roleLabel(key) {
  return ROLES.find((r) => r.key === key)?.label || key;
}
