import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Globe, Bell, Moon, HelpCircle, Info } from "lucide-react";
import { useState } from "react";

export default function ProfileSettings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

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
        <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
          <HelpCircle className="w-5 h-5 text-gold/70" />
          <div className="flex-1">
            <p className="text-sm font-medium text-mora-white">Help & Support</p>
            <p className="text-xs text-mora-neutral/50">FAQs and contact us</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all">
          <Info className="w-5 h-5 text-gold/70" />
          <div className="flex-1">
            <p className="text-sm font-medium text-mora-white">About MORA</p>
            <p className="text-xs text-mora-neutral/50">Version 1.0.0</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}