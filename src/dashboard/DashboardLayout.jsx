import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, BookOpen, Database, MapPin, Megaphone, CalendarCheck, Users, BarChart3, Shield, Smartphone, LogOut, PanelLeftClose, PanelLeftOpen, Target, Building2, Send, Globe, Hotel, Receipt, ClipboardList, History, FileText, Image as ImageIcon, Settings, X, ChevronDown, Tags, Package, Luggage, UserCheck, Bell, FolderOpen } from "lucide-react";
import { staffSignOut } from "@/lib/staffAuth";
import { RoleProvider, useRole } from "./RoleContext";
import { ROLES, can } from "./rbac";
import DashboardHeader from "./DashboardHeader";
import SearchableSelect from "./SearchableSelect";
import ErrorBoundary from "@/components/ErrorBoundary";
import useScrollRestoration from "@/lib/useScrollRestoration";
import BrandMark from "@/components/BrandMark";

const GROUPS = [
  { title: "Insight Center", items: [
    { to: "/dashboard", end: true, icon: LayoutDashboard, label: "Overview", res: "overview" },
    { to: "/dashboard/reports", icon: BarChart3, label: "Reports", res: "reports" },
    { to: "/dashboard/accounting", icon: BookOpen, label: "Accounting", res: "accounting" },
  ] },
  { title: "Sales & CRM", items: [
    { to: "/dashboard/leads", icon: Target, label: "Leads", res: "leads" },
    { to: "/dashboard/customers", icon: Users, label: "Customers", res: "customers" },
    { to: "/dashboard/trips", icon: Luggage, label: "Trips", res: "trips" },
    { to: "/dashboard/documents", icon: FolderOpen, label: "Travel documents", res: "bookings" },
    { to: "/dashboard/bookings", icon: CalendarCheck, label: "Trips & Bookings", res: "bookings" },
  ] },
  { title: "Operations", items: [
    { to: "/dashboard/ota", end: true, icon: Globe, label: "OTA Channels", res: "ota" },
    { to: "/dashboard/ota/categories", icon: Tags, label: "Booking Categories", res: "ota" },
    { to: "/dashboard/ota/transactions", icon: Receipt, label: "OTA Transactions", res: "ota" },
    { to: "/dashboard/pms", end: true, icon: Hotel, label: "Property (PMS)", res: "pms" },
    { to: "/dashboard/pms/transactions", icon: ClipboardList, label: "PMS Transactions", res: "pms" },
  ] },
  { title: "Catalog", items: [
    { to: "/dashboard/destinations", icon: MapPin, label: "Destinations", res: "destinations" },
    { to: "/dashboard/promotions", icon: Megaphone, label: "Promotions & Events", res: "promotions" },
    { to: "/dashboard/packages", icon: Package, label: "Holiday Packages", res: "promotions" },
    { to: "/dashboard/suppliers", icon: Building2, label: "Suppliers", res: "suppliers" },
    { to: "/dashboard/master", icon: Database, label: "Master data", res: "master" },
  ] },
  { title: "Content", items: [
    { to: "/dashboard/content", icon: FileText, label: "Pages", res: "content" },
    { to: "/dashboard/media", icon: ImageIcon, label: "Media Library", res: "media" },
    { to: "/dashboard/settings", icon: Settings, label: "App Settings", res: "settings" },
  ] },
  { title: "Growth", items: [
    { to: "/dashboard/marketing", icon: Send, label: "Marketing", res: "marketing" },
    { to: "/dashboard/notifications", icon: Bell, label: "Member notifications", res: "marketing" },
  ] },
  { title: "System", items: [
    { to: "/dashboard/registrations", icon: UserCheck, label: "Registrations", res: "registrations" },
    { to: "/dashboard/team", icon: Shield, label: "Team & Roles", res: "team" },
    { to: "/dashboard/audit", icon: History, label: "Audit Log", res: "audit" },
  ] },
];

const DESKTOP = "(min-width: 1280px)";
const subscribeDesktop = (cb) => {
  const mq = window.matchMedia(DESKTOP);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsDesktop = () => useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP).matches, () => true);

const RAIL_KEY = "ich_dash_rail";
const readRailPref = () => {
  try { return localStorage.getItem(RAIL_KEY) !== "collapsed"; } catch { return true; }
};

// The only decorative light on the canvas, built from the accent token.
const GLOW =
  "radial-gradient(38% 34% at 72% 22%, rgb(var(--c-accent) / 0.09), transparent 70%), " +
  "radial-gradient(28% 30% at 92% 48%, rgb(var(--c-accent) / 0.06), transparent 70%)";

const itemClass = (active, expanded) =>
  `relative isolate flex shrink-0 items-center rounded-2xl transition-colors [&_svg]:size-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong ${
    expanded ? "h-11 w-full gap-3 px-3 text-sm font-medium" : "size-11 justify-center"
  } ${active ? "text-white" : "text-muted hover:bg-surface hover:text-foreground active:bg-border"}`;

// The active fill is one element that slides between items instead of
// blinking from one to the next.
const ActivePill = () => (
  <motion.span
    layoutId="rail-active"
    aria-hidden="true"
    className="absolute inset-0 -z-10 rounded-2xl bg-accent-strong shadow-glow"
    transition={{ type: "spring", stiffness: 480, damping: 38 }}
  />
);

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  // Returning from a record puts you back where you were in the list.
  const mainRef = useRef(null);
  useScrollRestoration(mainRef);
  const { role, setRole, canPreview } = useRole();
  const signOut = async () => { await staffSignOut(); navigate("/dashboard/login", { replace: true }); };
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();
  const [railPref, setRailPref] = useState(readRailPref);
  const [moreOpen, setMoreOpen] = useState(false);
  const expanded = isDesktop && railPref;

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const toggleRail = () => {
    setRailPref((prev) => {
      try { localStorage.setItem(RAIL_KEY, prev ? "collapsed" : "expanded"); } catch { /* ignore */ }
      return !prev;
    });
  };

  // Which section contains the current route (longest-prefix match).
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

  // Collapsible sections in the expanded rail; the user's choices persist.
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ich_dash_nav_open") || "null");
      if (Array.isArray(saved)) return new Set(saved);
    } catch { /* ignore */ }
    return new Set(["Insight Center", "Sales & CRM"]);
  });

  // The active section always stays open so the current page stays reachable.
  useEffect(() => {
    if (activeGroup) setOpenGroups((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
  }, [activeGroup]);

  const toggleGroup = (title) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      try { localStorage.setItem("ich_dash_nav_open", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });

  const groups = GROUPS.map((g) => ({ ...g, visible: g.items.filter((n) => can(role, n.res, "view")) }))
    .filter((g) => g.visible.length);

  const navLink = (item, wide) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      title={wide ? undefined : item.label}
      className={({ isActive }) => itemClass(isActive, wide)}
    >
      {({ isActive }) => (
        <>
          {isActive && <ActivePill />}
          <item.icon aria-hidden="true" />
          {wide ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  // Grouped list for the expanded rail and the phone sheet; flat icons for the collapsed rail.
  const nav = (wide) =>
    wide ? (
      groups.map((group) => {
        const isOpen = openGroups.has(group.title);
        return (
          <div key={group.title} className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              aria-expanded={isOpen}
              className={`flex h-9 w-full items-center justify-between gap-2 rounded-2xl px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:bg-surface ${
                activeGroup === group.title ? "text-foreground" : "text-muted"
              }`}
            >
              {group.title}
              <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && group.visible.map((item) => navLink(item, true))}
          </div>
        );
      })
    ) : (
      groups.flatMap((g) => g.visible).map((item) => navLink(item, false))
    );

  const footer = (wide) => (
    <div className="mt-3 flex w-full flex-col gap-1">
      {wide && canPreview && (
        <div className="mb-1 rounded-2xl bg-surface-2 p-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-muted">
            <Shield aria-hidden="true" className="size-3.5" /> Preview as
          </p>
          <SearchableSelect value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r.key, label: r.key === "admin" ? "Administrator (you)" : r.label }))} ariaLabel="Preview the dashboard as role" />
        </div>
      )}
      <button
        type="button"
        onClick={() => navigate("/")}
        title={wide ? undefined : "Open mobile app"}
        className={wide
          ? "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent-strong px-4 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-accent-dark"
          : "flex size-11 items-center justify-center rounded-full bg-accent-strong text-white shadow-glow transition-colors hover:bg-accent-dark"}
      >
        <Smartphone aria-hidden="true" className="size-5" />
        {wide ? "Open mobile app" : <span className="sr-only">Open mobile app</span>}
      </button>
      <button type="button" onClick={signOut} title={wide ? undefined : "Sign out"} className={itemClass(false, wide)}>
        <LogOut aria-hidden="true" />
        {wide ? "Sign out" : <span className="sr-only">Sign out</span>}
      </button>
      {isDesktop && (
        <button
          type="button"
          onClick={toggleRail}
          aria-expanded={expanded}
          title={wide ? undefined : "Expand menu"}
          className={wide
            ? "mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-border text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-foreground"
            : "mt-1 flex size-11 items-center justify-center rounded-2xl text-muted transition-colors hover:bg-surface hover:text-foreground"}
        >
          {wide ? <><PanelLeftClose aria-hidden="true" className="size-4" /> Collapse menu</> : <><PanelLeftOpen aria-hidden="true" className="size-5" /><span className="sr-only">Expand menu</span></>}
        </button>
      )}
    </div>
  );

  return (
    <div className="relative flex h-dvh gap-4 overflow-clip bg-surface p-3 text-foreground lg:p-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-[8%] -top-[30%] h-[120%] w-[70%] opacity-70 blur-xl" style={{ background: GLOW }} />
      </div>

      {/* Floating ink rail: icons on tablets, full width from xl. */}
      <aside
        aria-label="Admin navigation"
        className={`relative hidden h-full shrink-0 flex-col rounded-hero bg-card py-4 text-foreground shadow-card transition-[width] duration-200 md:flex ${
          expanded ? "w-60 px-3" : "w-[76px] items-center"
        }`}
      >
        <NavLink to="/dashboard" aria-label="Icon Holiday admin home" className="flex justify-center">
          {expanded ? (
            <BrandMark className="[&_img]:w-32" />
          ) : (
            <BrandMark compact className="flex size-11 items-center justify-center [&_img]:w-10" />
          )}
        </NavLink>
        <nav className="no-scrollbar mt-4 flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto p-1">
          {nav(expanded)}
        </nav>
        {footer(expanded)}
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col gap-4">
        <a href="#main" className="sr-only z-30 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-on-ink shadow-float focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
          Skip to content
        </a>
        <DashboardHeader onMenu={() => setMoreOpen(true)} role={role} groups={GROUPS} />
        <main id="main" tabIndex={-1} ref={mainRef} className="relative min-h-0 flex-1 overflow-y-auto pb-6 pr-0.5 focus:outline-none md:pb-2">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ErrorBoundary inline resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>

      {/* Phones: every menu slides up from the bottom, never in from the side. */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-foreground/30" onClick={() => setMoreOpen(false)} />
          <div className="safe-b absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[28px] bg-card px-4 pb-4 pt-3 text-foreground shadow-float animate-slide-up">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
            <div className="mb-2 flex items-center justify-between">
              <BrandMark className="[&_img]:w-28" />
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu" className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1">{nav(true)}</nav>
            {footer(true)}
          </div>
        </div>
      )}
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
