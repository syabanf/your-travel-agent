import { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, MapPin, Megaphone, CalendarCheck, Users, BarChart3, Shield, Smartphone, Plane, LogOut, Target, Building2, Send, Globe, Hotel, Receipt, ClipboardList, History, FileText, Image as ImageIcon, Settings, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { RoleProvider, useRole } from "./RoleContext";
import { ROLES, can } from "./rbac";
import DashboardHeader from "./DashboardHeader";

const GROUPS = [
  { title: "Insight Center", items: [
    { to: "/dashboard", end: true, icon: LayoutDashboard, label: "Overview", res: "overview" },
    { to: "/dashboard/reports", icon: BarChart3, label: "Reports", res: "reports" },
  ] },
  { title: "Sales & CRM", items: [
    { to: "/dashboard/leads", icon: Target, label: "Leads", res: "leads" },
    { to: "/dashboard/customers", icon: Users, label: "Customers", res: "customers" },
    { to: "/dashboard/bookings", icon: CalendarCheck, label: "Trips & Bookings", res: "bookings" },
  ] },
  { title: "Operations", items: [
    { to: "/dashboard/ota", end: true, icon: Globe, label: "OTA Channels", res: "ota" },
    { to: "/dashboard/ota/transactions", icon: Receipt, label: "OTA Transactions", res: "ota" },
    { to: "/dashboard/pms", end: true, icon: Hotel, label: "Property (PMS)", res: "pms" },
    { to: "/dashboard/pms/transactions", icon: ClipboardList, label: "PMS Transactions", res: "pms" },
  ] },
  { title: "Catalog", items: [
    { to: "/dashboard/destinations", icon: MapPin, label: "Destinations", res: "destinations" },
    { to: "/dashboard/promotions", icon: Megaphone, label: "Promotions & Events", res: "promotions" },
    { to: "/dashboard/suppliers", icon: Building2, label: "Suppliers", res: "suppliers" },
  ] },
  { title: "Content", items: [
    { to: "/dashboard/content", icon: FileText, label: "Pages", res: "content" },
    { to: "/dashboard/media", icon: ImageIcon, label: "Media Library", res: "media" },
    { to: "/dashboard/settings", icon: Settings, label: "App Settings", res: "settings" },
  ] },
  { title: "Growth", items: [
    { to: "/dashboard/marketing", icon: Send, label: "Marketing", res: "marketing" },
  ] },
  { title: "System", items: [
    { to: "/dashboard/team", icon: Shield, label: "Team & Roles", res: "team" },
    { to: "/dashboard/audit", icon: History, label: "Audit Log", res: "audit" },
  ] },
];

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Which section contains the current route (longest-prefix match) — for the
  // active highlight and to keep that section drilled open while navigating.
  const activeGroup = useMemo(() => {
    let best = null, bestLen = -1;
    for (const g of GROUPS) {
      for (const it of g.items) {
        const match = it.end ? location.pathname === it.to : location.pathname.startsWith(it.to);
        if (match && it.to.length > bestLen) { best = g.title; bestLen = it.to.length; }
      }
    }
    return best;
  }, [location.pathname]);

  // Collapsible drill-down sections. Persist the user's open/closed choices.
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mora_dash_nav_open") || "null");
      if (Array.isArray(saved)) return new Set(saved);
    } catch { /* ignore */ }
    return new Set(["Insight Center", "Sales & CRM"]); // sensible drilled-open defaults
  });

  // Always keep the active section open so the current page stays reachable.
  useEffect(() => {
    if (activeGroup) setOpenGroups((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
  }, [activeGroup]);

  const toggleGroup = (title) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      try { localStorage.setItem("mora_dash_nav_open", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });

  const allOpen = openGroups.size >= GROUPS.length;
  const toggleAll = () => {
    const next = allOpen ? new Set(activeGroup ? [activeGroup] : []) : new Set(GROUPS.map((g) => g.title));
    setOpenGroups(next);
    try { localStorage.setItem("mora_dash_nav_open", JSON.stringify([...next])); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen w-full bg-[#F3F6FB] text-mora-primary font-body">
      <a href="#main" className="skip-link">Skip to content</a>

      {/* Backdrop (mobile) */}
      {open && <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-black/30 z-40" aria-hidden="true" />}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-mora-primary/10 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 h-16 flex items-center justify-between border-b border-mora-primary/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold leading-none text-mora-primary">MORA</p>
              <p className="text-[10px] text-mora-neutral">Admin Console</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="lg:hidden w-9 h-9 rounded-lg hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-mora-neutral/40 font-semibold">Menu</span>
            <button onClick={toggleAll} className="text-[10px] uppercase tracking-wider font-semibold text-gold/80 hover:text-gold">
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
          {GROUPS.map((group) => {
            const visible = group.items.filter((n) => can(role, n.res, "view"));
            if (!visible.length) return null;
            const isOpen = openGroups.has(group.title);
            const isActiveGroup = activeGroup === group.title;
            return (
              <div key={group.title} className="mb-1.5">
                <button
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={isOpen}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-colors ${
                    isActiveGroup ? "text-gold" : "text-mora-neutral/50 hover:text-mora-primary"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {group.title}
                    {!isOpen && isActiveGroup && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-mora-neutral/30 font-medium normal-case tracking-normal">{visible.length}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  </span>
                </button>
                {isOpen && (
                  <div className="space-y-1 mt-1">
                    {visible.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive ? "bg-mora-gold/10 text-gold" : "text-mora-neutral hover:bg-mora-primary/5 hover:text-mora-primary"
                          }`
                        }
                      >
                        <item.icon className="w-4.5 h-4.5 shrink-0" /> {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-mora-primary/10 space-y-2">
          {/* Role switcher (demo RBAC) */}
          <div>
            <label className="text-[10px] text-mora-neutral uppercase tracking-wider mb-1 flex items-center gap-1 px-1">
              <Shield className="w-3 h-3" /> Viewing as
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="dash-input">
              {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <button onClick={() => navigate("/")} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold btn-primary">
            <Smartphone className="w-4 h-4" /> Open Mobile App
          </button>
          <button onClick={() => { logout(); navigate("/login"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-mora-neutral hover:bg-mora-primary/5 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Content — own scroll container because the global body is position:fixed (mobile-app lock) */}
      <main id="main" className="lg:ml-64 h-screen overflow-y-auto">
        <DashboardHeader onMenu={() => setOpen(true)} role={role} groups={GROUPS} />
        <Outlet />
      </main>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <RoleProvider>
      <Shell />
    </RoleProvider>
  );
}
