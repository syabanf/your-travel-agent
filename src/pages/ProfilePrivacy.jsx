import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import moment from "moment";
import { Download, Trash2, ShieldCheck, ChevronRight, FileText } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

const DB_PREFIX = "mora_db_";

export default function ProfilePrivacy() {
  const [marketing, setMarketing] = useState(true);
  const [personalization, setPersonalization] = useState(true);

  useEffect(() => {
    const m = localStorage.getItem("mora_consent_marketing");
    const p = localStorage.getItem("mora_consent_personalization");
    if (m !== null) setMarketing(m === "true");
    if (p !== null) setPersonalization(p === "true");
  }, []);

  const toggleMarketing = () => {
    const next = !marketing;
    setMarketing(next);
    localStorage.setItem("mora_consent_marketing", String(next));
  };

  const togglePersonalization = () => {
    const next = !personalization;
    setPersonalization(next);
    localStorage.setItem("mora_consent_personalization", String(next));
  };

  const handleExport = () => {
    const data = {};
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(DB_PREFIX)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mora-data-${moment().format("YYYY-MM-DD")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Data exported");
  };

  const handleDelete = () => {
    const ok = window.confirm(
      "This will erase all locally stored MORA data and reload the app. Continue?"
    );
    if (!ok) return;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(DB_PREFIX)) localStorage.removeItem(key);
    });
    window.location.href = "/";
  };

  const consentRows = [
    {
      label: "Marketing emails",
      desc: "Offers, deals, and travel inspiration",
      value: marketing,
      onToggle: toggleMarketing,
    },
    {
      label: "Personalized recommendations",
      desc: "Tailor suggestions to your activity",
      value: personalization,
      onToggle: togglePersonalization,
    },
  ];

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Privacy & Data" subtitle="Manage your information" showBack />
      <div className="px-6 space-y-3 mt-2">

        {/* Your data */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold/70" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-mora-primary">Your data</p>
              <p className="text-xs text-mora-neutral/50 mt-0.5">Export or erase everything stored locally</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
          >
            <Download className="w-4 h-4" /> Export my data
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium text-red-400/80 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete all my data
          </button>
        </GlassCard>

        {/* Consent */}
        <GlassCard className="p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-mora-primary">Consent</p>
            <p className="text-xs text-mora-neutral/50 mt-0.5">Choose how we communicate with you</p>
          </div>
          {consentRows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && <div className="h-px bg-white/5 mb-4" />}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-mora-white">{row.label}</p>
                  <p className="text-xs text-mora-neutral/50 mt-0.5">{row.desc}</p>
                </div>
                <button
                  onClick={row.onToggle}
                  role="switch"
                  aria-checked={row.value}
                  aria-label={row.label}
                  className={`w-11 h-6 rounded-full transition-all flex-shrink-0 ${row.value ? "bg-mora-gold" : "bg-white/10"}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${row.value ? "translate-x-5" : ""}`} />
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-mora-neutral/40 leading-relaxed">
            You can change these preferences at any time. They are saved on this device.
          </p>
        </GlassCard>

        {/* Legal */}
        <GlassCard className="overflow-hidden">
          <Link
            to="/privacy"
            className="w-full p-4 flex items-center gap-4 hover:bg-white/10 transition-all border-b border-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-gold/70" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-mora-white">Privacy Policy</p>
              <p className="text-xs text-mora-neutral/50 mt-0.5">How we handle your data</p>
            </div>
            <ChevronRight className="w-4 h-4 text-mora-neutral/30" />
          </Link>
          <Link
            to="/terms"
            className="w-full p-4 flex items-center gap-4 hover:bg-white/10 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-mora-gold/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-gold/70" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-mora-white">Terms of Service</p>
              <p className="text-xs text-mora-neutral/50 mt-0.5">The rules of using MORA</p>
            </div>
            <ChevronRight className="w-4 h-4 text-mora-neutral/30" />
          </Link>
        </GlassCard>

      </div>
    </div>
  );
}
