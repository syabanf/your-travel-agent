import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Globe, Bell, Moon, HelpCircle, Info, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function ProfileSettings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    await base44.auth.logout();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="App preferences" showBack />
      <div className="px-6 space-y-3 mt-2">
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gold/70" />
              <div>
                <p className="text-sm font-medium text-mora-white">Push Notifications</p>
                <p className="text-xs text-mora-neutral/50">Trip reminders & updates</p>
              </div>
            </div>
            <button onClick={() => setNotifications(!notifications)}
              className={`w-11 h-6 rounded-full transition-all ${notifications ? "bg-mora-gold" : "bg-white/10"}`}>
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${notifications ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <div className="h-px bg-white/5" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-gold/70" />
              <div>
                <p className="text-sm font-medium text-mora-white">Dark Mode</p>
                <p className="text-xs text-mora-neutral/50">Premium night interface</p>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)}
              className={`w-11 h-6 rounded-full transition-all ${darkMode ? "bg-mora-gold" : "bg-white/10"}`}>
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${darkMode ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
          <Globe className="w-5 h-5 text-gold/70" />
          <div className="flex-1">
            <p className="text-sm font-medium text-mora-white">Language</p>
            <p className="text-xs text-mora-neutral/50">English (US)</p>
          </div>
        </GlassCard>
        <Link to="/help" className="block">
          <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
            <HelpCircle className="w-5 h-5 text-gold/70" />
            <div className="flex-1">
              <p className="text-sm font-medium text-mora-white">Help & Support</p>
              <p className="text-xs text-mora-neutral/50">FAQs and contact us</p>
            </div>
          </GlassCard>
        </Link>
        <Link to="/help" className="block">
          <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
            <Info className="w-5 h-5 text-gold/70" />
            <div className="flex-1">
              <p className="text-sm font-medium text-mora-white">About MORA</p>
              <p className="text-xs text-mora-neutral/50">Version 1.0.0</p>
            </div>
          </GlassCard>
        </Link>
        {/* Delete Account */}
        <div className="mt-4 mb-8">
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-medium text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          ) : (
            <GlassCard className="p-5 border border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-mora-white">Delete Account</p>
                  <p className="text-xs text-mora-neutral/50 mt-0.5">This action is permanent and cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-mora-neutral/60 mb-3">Type <span className="text-red-400 font-mono font-semibold">DELETE</span> to confirm:</p>
              <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-sm text-mora-white placeholder:text-mora-neutral/30 outline-none mb-3 font-mono" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 py-2.5 glass-light rounded-xl text-sm text-mora-neutral/70 hover:text-mora-white transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteInput !== "DELETE"}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-40">
                  Delete
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}