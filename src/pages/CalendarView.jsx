import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Calendar } from "lucide-react";

export default function CalendarView() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Calendar View" subtitle="Your trips on calendar" showBack />
      <div className="px-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 glass-gold rounded-2xl flex items-center justify-center">
          <Calendar className="w-8 h-8 text-gold" />
        </div>
        <p className="text-mora-white/70 text-sm font-display">Calendar coming soon</p>
        <p className="text-mora-neutral/40 text-xs text-center">View all your trips in a beautiful calendar layout</p>
      </div>
    </div>
  );
}