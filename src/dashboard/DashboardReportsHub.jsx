import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, TrendingUp, Scale, Sparkles } from "lucide-react";

// Unifies the report pages under one sidebar entry with section tabs.
const TABS = [
  { to: "/dashboard/reports", end: true, icon: BarChart3, label: "Analytics" },
  { to: "/dashboard/reports/business", icon: TrendingUp, label: "Business" },
  { to: "/dashboard/reports/finance", icon: Scale, label: "Financial" },
  { to: "/dashboard/reports/ai", icon: Sparkles, label: "AI Reports" },
];

export default function DashboardReportsHub() {
  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 bg-[#F3F6FB] border-b border-ich-primary/10 sticky top-0 z-10">
        <p className="text-[11px] uppercase tracking-widest text-gold font-semibold mb-2">Insight Center · Reports</p>
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive ? "border-gold text-gold" : "border-transparent text-ich-neutral hover:text-ich-primary"
                }`
              }
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
