import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, Search, Bell, CornerDownLeft } from "lucide-react";
import { can, ROLES } from "./rbac";
import { useRole } from "./RoleContext";

// Sticky dashboard top bar: mobile menu, breadcrumb, a "jump to" command search,
// recent-activity link and a role/avatar chip.
export default function DashboardHeader({ onMenu, role, groups }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const boxRef = useRef(null);

  // Flatten the nav into a searchable list, respecting the current role.
  const items = useMemo(
    () =>
      groups.flatMap((g) =>
        g.items.filter((n) => can(role, n.res, "view")).map((n) => ({ ...n, group: g.title }))
      ),
    [groups, role]
  );

  // Breadcrumb: longest-prefix match of the current path.
  const active = useMemo(() => {
    let best = null, len = -1;
    for (const it of items) {
      const match = it.end ? location.pathname === it.to : location.pathname.startsWith(it.to);
      if (match && it.to.length > len) { best = it; len = it.to.length; }
    }
    return best;
  }, [items, location.pathname]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, 8);
    return items.filter((it) => `${it.label} ${it.group}`.toLowerCase().includes(needle)).slice(0, 8);
  }, [q, items]);

  // Close the search dropdown on outside click.
  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpenSearch(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goto = (to) => { setQ(""); setOpenSearch(false); navigate(to); };
  const onSubmit = (e) => { e.preventDefault(); if (results[0]) goto(results[0].to); };

  const { staff } = useRole();
  const roleLabel = ROLES.find((r) => r.key === role)?.label || "Member";
  const previewing = staff && staff.role !== role;

  // Header title: the page name over today's date.
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="flex h-14 shrink-0 items-center gap-3">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-colors hover:bg-surface-2 md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 shrink md:max-w-[14rem] lg:max-w-[18rem]">
        <h2 className="truncate text-lg font-bold leading-tight">{active?.label || "Overview"}</h2>
        <p className="hidden truncate text-xs text-muted sm:block">{active?.group || "Dashboard"} · {today}</p>
      </div>

      {/* Jump-to search: a pill that opens a floating panel of matching pages. */}
      <div ref={boxRef} className="relative ml-auto md:ml-4 md:max-w-md md:flex-1">
        <form onSubmit={onSubmit} className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpenSearch(true); }}
            onFocus={() => setOpenSearch(true)}
            onKeyDown={(e) => { if (e.key === "Escape") setOpenSearch(false); }}
            placeholder="Jump to a page"
            aria-label="Jump to a page"
            className="h-11 w-full rounded-full bg-card pl-10 pr-4 text-base text-foreground shadow-card outline-none transition-colors placeholder:text-muted focus:ring-2 focus:ring-accent/40 md:text-sm"
          />
        </form>
        <button
          type="button"
          onClick={() => setOpenSearch((v) => !v)}
          aria-label="Search pages"
          aria-expanded={openSearch}
          className="flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-colors hover:bg-surface-2 md:hidden"
        >
          <Search className="size-5" aria-hidden="true" />
        </button>

        {openSearch && (
          <div className="absolute right-0 top-full z-40 mt-2 w-72 max-w-[85vw] overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-float md:inset-x-0 md:w-auto">
            <div className="p-1 md:hidden">
              <input autoFocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to a page" aria-label="Jump to a page" className="dash-input" />
            </div>
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Pages</p>
            <ul className="max-h-[60dvh] overflow-y-auto">
              {results.length ? results.map((it) => (
                <li key={it.to}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goto(it.to)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface"
                  >
                    <it.icon className="size-4 shrink-0 text-accent-strong" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{it.label}</span>
                      <span className="block truncate text-xs text-muted">{it.group}</span>
                    </span>
                  </button>
                </li>
              )) : (
                <li className="px-3 py-6 text-center text-sm text-muted">No matches for &quot;{q}&quot;</li>
              )}
            </ul>
            <p className="hidden items-center gap-1.5 px-3 py-2 text-[11px] text-muted md:flex">
              <CornerDownLeft className="size-3" aria-hidden="true" /> opens the first result
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/dashboard/audit"
          aria-label="Activity log, new events"
          className="relative flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-colors hover:bg-surface-2"
        >
          <Bell className="size-5" aria-hidden="true" />
          <span className="animate-pop absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" aria-hidden="true" />
        </Link>
        <div className="flex h-11 items-center gap-2.5 rounded-full bg-card p-1.5 shadow-card xl:pr-4">
          <span className="flex size-8 items-center justify-center rounded-full bg-ink text-sm font-semibold uppercase text-on-ink" aria-hidden="true">
            {(staff?.name || roleLabel).charAt(0)}
          </span>
          <span className="hidden xl:block">
            <span className="block max-w-[10rem] truncate text-sm font-semibold leading-tight">{staff?.name || "Staff"}</span>
            <span className={`block max-w-[10rem] truncate text-[11px] ${previewing ? "font-semibold text-warning" : "text-muted"}`}>{previewing ? `Previewing as ${roleLabel}` : roleLabel}</span>
          </span>
          <span className="sr-only xl:hidden">Signed in as {staff?.name || "staff"}, {previewing ? `previewing as ${roleLabel}` : roleLabel}</span>
        </div>
      </div>
    </header>
  );
}
