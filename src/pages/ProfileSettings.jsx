import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Globe, Bell, Moon, HelpCircle, Info, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { backend } from "@/api/backend";

export default function ProfileSettings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    await backend.auth.logout();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="App preferences" showBack />
      <div className="px-6 space-y-3 mt-2">
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-accent-strong/70" />
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted">Trip reminders & updates</p>
              </div>
            </div>
            <button onClick={() => setNotifications(!notifications)} role="switch" aria-checked={notifications} aria-label="Push notifications"
              className={`w-11 h-6 rounded-full transition-all ${notifications ? "bg-accent-strong" : "bg-surface"}`}>
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${notifications ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <div className="h-px bg-surface-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-accent-strong/70" />
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted">Premium night interface</p>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} role="switch" aria-checked={darkMode} aria-label="Dark mode"
              className={`w-11 h-6 rounded-full transition-all ${darkMode ? "bg-accent-strong" : "bg-surface"}`}>
              <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${darkMode ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface transition-all lift">
          <Globe className="w-5 h-5 text-accent-strong/70" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Language</p>
            <p className="text-xs text-muted">English (US)</p>
          </div>
        </GlassCard>
        <Link to="/help" className="block">
          <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface transition-all lift">
            <HelpCircle className="w-5 h-5 text-accent-strong/70" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Help & Support</p>
              <p className="text-xs text-muted">FAQs and contact us</p>
            </div>
          </GlassCard>
        </Link>
        <Link to="/help" className="block">
          <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-surface transition-all lift">
            <Info className="w-5 h-5 text-accent-strong/70" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">About Icon Holiday</p>
              <p className="text-xs text-muted">Version 1.0.0</p>
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
                  <p className="text-sm font-semibold text-foreground">Delete Account</p>
                  <p className="text-xs text-muted mt-0.5">This action is permanent and cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-muted mb-3">Type <span className="text-red-400 font-mono font-semibold">DELETE</span> to confirm:</p>
              <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                aria-label="Type to confirm"
                className="w-full bg-surface-2 border border-border rounded-xl h-10 px-3 text-sm text-foreground placeholder:text-muted outline-none mb-3 font-mono" />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 py-2.5 bg-card shadow-card rounded-xl text-sm text-muted hover:text-foreground transition-all">
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteInput !== "DELETE"}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/30 hover:bg-accent-soft transition-all disabled:opacity-40">
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