import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, Search, Bell, ChevronRight, CornerDownLeft, Plane } from "lucide-react";
import { can, ROLES } from "./rbac";

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

  const roleLabel = ROLES.find((r) => r.key === role)?.label || "Member";

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-mora-primary/10">
      <div className="h-16 flex items-center gap-3 px-4 lg:px-6">
        {/* Mobile menu */}
        <button onClick={onMenu} aria-label="Open menu" className="lg:hidden w-10 h-10 -ml-1 rounded-xl hover:bg-mora-primary/5 flex items-center justify-center text-mora-primary shrink-0">
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand (mobile) + breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="lg:hidden w-8 h-8 rounded-lg btn-primary flex items-center justify-center shrink-0"><Plane className="w-4 h-4 text-white" /></div>
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-mora-neutral/60 hidden sm:inline">{active?.group || "Dashboard"}</span>
            <ChevronRight className="w-3.5 h-3.5 text-mora-neutral/30 hidden sm:inline shrink-0" />
            <span className="font-display font-semibold text-mora-primary truncate">{active?.label || "Overview"}</span>
          </nav>
        </div>

        <div className="flex-1" />

        {/* Jump-to command search */}
        <div ref={boxRef} className="relative">
          <form onSubmit={onSubmit} className="hidden md:block">
            <Search className="w-4 h-4 text-mora-neutral/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpenSearch(true); }}
              onFocus={() => setOpenSearch(true)}
              placeholder="Jump to…"
              aria-label="Jump to a section"
              className="dash-input pl-9 pr-3 py-2 text-sm w-48 lg:w-60"
            />
          </form>
          <button onClick={() => setOpenSearch((v) => !v)} aria-label="Search" className="md:hidden w-10 h-10 rounded-xl hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral">
            <Search className="w-5 h-5" />
          </button>

          {openSearch && (
            <div className="absolute right-0 mt-2 w-72 max-w-[80vw] bg-white rounded-2xl border border-mora-primary/10 shadow-xl overflow-hidden z-50">
              <div className="md:hidden p-2 border-b border-mora-primary/10">
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to…" className="dash-input w-full text-sm" />
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                {results.length ? results.map((it) => (
                  <li key={it.to}>
                    <button onClick={() => goto(it.to)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-mora-primary/5 text-left">
                      <it.icon className="w-4 h-4 text-gold shrink-0" />
                      <span className="text-mora-primary truncate">{it.label}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider text-mora-neutral/40 shrink-0">{it.group}</span>
                    </button>
                  </li>
                )) : (
                  <li className="px-3 py-6 text-center text-sm text-mora-neutral/50">No matches</li>
                )}
              </ul>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 border-t border-mora-primary/10 text-[11px] text-mora-neutral/50">
                <CornerDownLeft className="w-3 h-3" /> to open the first result
              </div>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <Link to="/dashboard/audit" aria-label="Activity log" className="relative w-10 h-10 rounded-xl hover:bg-mora-primary/5 flex items-center justify-center text-mora-neutral shrink-0">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-mora-gold rounded-full" />
        </Link>

        {/* Role + avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs font-medium text-mora-neutral capitalize">{roleLabel}</span>
          <div className="w-9 h-9 rounded-full btn-primary flex items-center justify-center text-white font-display font-semibold text-sm uppercase">
            {roleLabel.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
