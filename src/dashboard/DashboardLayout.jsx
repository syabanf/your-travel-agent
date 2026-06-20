import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, MapPin, Megaphone, CalendarCheck, Smartphone, Plane, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const nav = [
  { to: "/dashboard", end: true, icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/destinations", icon: MapPin, label: "Destinations" },
  { to: "/dashboard/promotions", icon: Megaphone, label: "Promotions & Events" },
  { to: "/dashboard/bookings", icon: CalendarCheck, label: "Trips & Bookings" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
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
        </nav>

        <div className="p-3 border-t border-mora-primary/10 space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold btn-primary"
          >
            <Smartphone className="w-4 h-4" /> Open Mobile App
          </button>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-mora-neutral hover:bg-mora-primary/5 transition-colors"
          >
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
