import { useState } from "react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Lock, Eye, Smartphone, ChevronRight, Check, EyeOff } from "lucide-react";

const loginActivity = [
  { device: "iPhone 15 Pro", location: "Jakarta, Indonesia", time: "Now · Active", current: true },
  { device: "MacBook Pro", location: "Jakarta, Indonesia", time: "2 hours ago" },
  { device: "Chrome · Windows", location: "Bali, Indonesia", time: "Yesterday" },
];

export default function ProfileSecurity() {
  const [section, setSection] = useState(null);
  const [twoFa, setTwoFa] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pw, setPw] = useState({ old: "", new: "", confirm: "" });
  const [saved, setSaved] = useState(false);

  const handleSavePw = () => {
    if (!pw.old || !pw.new || pw.new !== pw.confirm) return;
    setSaved(true);
    setTimeout(() => { setSaved(false); setSection(null); setPw({ old: "", new: "", confirm: "" }); }, 1500);
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Privacy & Security" subtitle="Protect your account" showBack />
      <div className="px-6 space-y-3 mt-2">

        {/* Change Password */}
        <GlassCard className="overflow-hidden">
          <button onClick={() => setSection(section === 'password' ? null : 'password')}
            className="w-full p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-ich-gold/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-gold/70" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-ich-white">Change Password</p>
              <p className="text-xs text-ich-neutral/50 mt-0.5">Update your account password</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-ich-neutral/30 transition-transform ${section === 'password' ? 'rotate-90' : ''}`} />
          </button>
          {section === 'password' && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4">
              {[
                { key: 'old', label: 'Current Password', show: showOld, setShow: setShowOld },
                { key: 'new', label: 'New Password', show: showNew, setShow: setShowNew },
                { key: 'confirm', label: 'Confirm New Password', show: showConfirm, setShow: setShowConfirm },
              ].map(({ key, label, show, setShow }) => (
                <div key={key}>
                  <label className="text-[10px] text-gold uppercase tracking-widest mb-1 block">{label}</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} value={pw[key]}
                      onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 pr-10 text-sm text-ich-white placeholder:text-ich-neutral/30 outline-none" />
                    <button type="button" onClick={() => setShow(!show)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ich-neutral/40 hover:text-ich-neutral">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {pw.new && pw.confirm && pw.new !== pw.confirm && (
                <p className="text-xs text-red-600">Passwords don't match</p>
              )}
              <button onClick={handleSavePw}
                disabled={!pw.old || !pw.new || pw.new !== pw.confirm}
                className="w-full py-3 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Update Password'}
              </button>
            </div>
          )}
        </GlassCard>

        {/* 2FA */}
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-ich-gold/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-gold/70" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ich-white">Two-Factor Auth</p>
            <p className="text-xs text-ich-neutral/50 mt-0.5">{twoFa ? 'Enabled — extra security active' : 'Add extra security layer'}</p>
          </div>
          <button onClick={() => setTwoFa(!twoFa)}
            aria-label={twoFa ? "Disable two-factor authentication" : "Enable two-factor authentication"}
            className={`w-11 h-6 rounded-full transition-all flex-shrink-0 ${twoFa ? 'bg-ich-gold' : 'bg-white/10'}`}>
            <div className={`w-4 h-4 rounded-full bg-white mx-1 transition-transform ${twoFa ? 'translate-x-5' : ''}`} />
          </button>
        </GlassCard>

        {/* Login Activity */}
        <GlassCard className="overflow-hidden">
          <button onClick={() => setSection(section === 'activity' ? null : 'activity')}
            className="w-full p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
            <div className="w-10 h-10 rounded-xl bg-ich-gold/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-gold/70" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-ich-white">Login Activity</p>
              <p className="text-xs text-ich-neutral/50 mt-0.5">See your recent sessions</p>
            </div>
            <ChevronRight className={`w-4 h-4 text-ich-neutral/30 transition-transform ${section === 'activity' ? 'rotate-90' : ''}`} />
          </button>
          {section === 'activity' && (
            <div className="border-t border-white/5">
              {loginActivity.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.current ? 'bg-emerald-400' : 'bg-ich-neutral/30'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ich-white">{s.device}</p>
                    <p className="text-xs text-ich-neutral/50">{s.location} · {s.time}</p>
                  </div>
                  {s.current && <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">This device</span>}
                </div>
              ))}
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
}