import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Clock, Wallet, CalendarRange, FileCheck, MessageCircle, FolderOpen } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { VISA_INFO } from "@/data/membership";
import useMasterData from "@/lib/useMasterData";
import { useAuth } from "@/lib/AuthContext";

/** Info Visa (Icon Membership 5.1): per-country visa facts and requirements. */
export default function VisaInfo() {
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [open, setOpen] = useState(null);

  const visas = useMasterData("VisaInfo", VISA_INFO, "country");
  const regions = useMemo(() => ["All", ...new Set(visas.map((v) => v.region))], [visas]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return visas.filter((v) => (region === "All" || v.region === region) && (!needle || `${v.country} ${v.visa}`.toLowerCase().includes(needle)));
  }, [visas, q, region]);

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader title="Visa info" subtitle="Requirements by destination" showBack />

      <div className="space-y-4 px-5">
        {!isGuest && (
          <Link to="/profile/documents" className="lift flex items-center gap-3 rounded-card bg-card p-4 shadow-card transition-colors hover:bg-surface-2">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-info-soft text-info">
              <FolderOpen className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">My documents</span>
              <span className="block text-xs text-muted">Passport, visa and insurance status for your trips</span>
            </span>
            <ChevronDown className="size-5 -rotate-90 text-muted" aria-hidden="true" />
          </Link>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a country"
            aria-label="Search a country"
            className="h-12 w-full rounded-full bg-card pl-11 pr-4 text-base text-foreground shadow-card outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40 md:text-sm"
          />
        </div>

        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 hide-scrollbar" role="tablist" aria-label="Region">
          {regions.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={region === r}
              onClick={() => setRegion(r)}
              className={`h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                region === r ? "bg-accent-strong text-white shadow-glow" : "bg-card text-muted shadow-card hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <ul className="stagger space-y-3">
          {list.map((v) => {
            const isOpen = open === v.code;
            return (
              <li key={v.code} className="overflow-hidden rounded-card bg-card shadow-card">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : v.code)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-2xl" aria-hidden="true">{v.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">{v.country}</span>
                    <span className="block truncate text-xs text-muted">{v.visa}</span>
                  </span>
                  <ChevronDown className={`size-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="animate-rise space-y-4 px-4 pb-4">
                    <dl className="grid grid-cols-3 gap-2">
                      {[[CalendarRange, "Stay", v.stay], [Clock, "Processing", v.processing], [Wallet, "Fee", v.fee]].map(([Icon, k, val]) => (
                        <div key={k} className="rounded-2xl bg-surface-2 p-3">
                          <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                            <Icon className="size-3.5" aria-hidden="true" /> {k}
                          </dt>
                          <dd className="mt-1 text-xs font-semibold text-foreground">{val}</dd>
                        </div>
                      ))}
                    </dl>
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-body">
                        <FileCheck className="size-4 text-accent-strong" aria-hidden="true" /> Requirements
                      </p>
                      <ul className="space-y-1.5">
                        {(v.requirements || []).map((r) => (
                          <li key={r} className="flex items-start gap-2 text-sm text-body">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {v.note && <p className="rounded-2xl bg-info-soft px-3 py-2.5 text-xs leading-relaxed text-info">{v.note}</p>}
                    <button
                      type="button"
                      onClick={() => navigate("/assistant")}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-border"
                    >
                      <MessageCircle className="size-4" aria-hidden="true" /> Ask a visa consultant
                    </button>
                  </div>
                )}
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="rounded-card bg-card p-6 text-center text-sm text-muted shadow-card">
              No country matches &quot;{q}&quot;. Our team handles more destinations; ask a consultant.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
