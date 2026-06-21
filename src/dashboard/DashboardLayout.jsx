import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, MapPin, Megaphone, CalendarCheck, Users, BarChart3, Shield, Smartphone, Plane, LogOut, Target, Building2, Send, TrendingUp, History, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { RoleProvider, useRole } from "./RoleContext";
import { ROLES, can } from "./rbac";

const GROUPS = [
  { title: "Insight Center", items: [
    { to: "/dashboard", end: true, icon: LayoutDashboard, label: "Overview", res: "overview" },
    { to: "/dashboard/reports", icon: BarChart3, label: "Reports", res: "reports" },
    { to: "/dashboard/business", icon: TrendingUp, label: "Business", res: "reports" },
    { to: "/dashboard/ai-reports", icon: Sparkles, label: "AI Reports", res: "reports" },
  ] },
  { title: "Sales & CRM", items: [
    { to: "/dashboard/leads", icon: Target, label: "Leads", res: "leads" },
    { to: "/dashboard/customers", icon: Users, label: "Customers", res: "customers" },
    { to: "/dashboard/bookings", icon: CalendarCheck, label: "Trips & Bookings", res: "bookings" },
  ] },
  { title: "Catalog", items: [
    { to: "/dashboard/destinations", icon: MapPin, label: "Destinations", res: "destinations" },
    { to: "/dashboard/promotions", icon: Megaphone, label: "Promotions & Events", res: "promotions" },
    { to: "/dashboard/suppliers", icon: Building2, label: "Suppliers", res: "suppliers" },
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
  const { logout } = useAuth();
  const { role, setRole } = useRole();

  return (
    <div className="min-h-screen w-full bg-[#F3F6FB] text-mora-primary flex font-body">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-mora-primary/10 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="px-5 h-16 flex items-center gap-2.5 border-b border-mora-primary/10">
          <div className="w-9 h-9 rounded-xl btn-primary flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold leading-none text-mora-primary">MORA</p>
            <p className="text-[10px] text-mora-neutral">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {GROUPS.map((group) => {
            const visible = group.items.filter((n) => can(role, n.res, "view"));
            if (!visible.length) return null;
            return (
              <div key={group.title} className="mb-3">
                <p className="text-[10px] uppercase tracking-wider text-mora-neutral/50 font-semibold px-3 mb-1.5">{group.title}</p>
                <div className="space-y-1">
                  {visible.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? "bg-mora-gold/10 text-gold" : "text-mora-neutral hover:bg-mora-primary/5 hover:text-mora-primary"
                        }`
                      }
                    >
                      <item.icon className="w-4.5 h-4.5" /> {item.label}
                    </NavLink>
                  ))}
                </div>
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

      {/* Content */}
      <main className="flex-1 ml-64 min-h-screen">
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
