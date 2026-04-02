import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Shield, Lock, Eye, Smartphone } from "lucide-react";

const options = [
  { icon: Lock, label: "Change Password", desc: "Update your account password" },
  { icon: Smartphone, label: "Two-Factor Auth", desc: "Add extra security layer" },
  { icon: Eye, label: "Login Activity", desc: "See your recent sessions" },
];

export default function ProfileSecurity() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Privacy & Security" subtitle="Protect your account" showBack />
      <div className="px-6 space-y-3 mt-2">
        {options.map(({ icon: Icon, label, desc }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-[#A5997E]/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-gold/70" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-mora-white">{label}</p>
              <p className="text-xs text-mora-neutral/50 mt-0.5">{desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}