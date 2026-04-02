import PageHeader from "../components/PageHeader";
import { CheckSquare } from "lucide-react";

export default function ChecklistView() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Checklist" subtitle="Travel preparation checklist" showBack />
      <div className="px-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 glass-gold rounded-2xl flex items-center justify-center">
          <CheckSquare className="w-8 h-8 text-gold" />
        </div>
        <p className="text-mora-white/70 text-sm font-display">Checklist coming soon</p>
        <p className="text-mora-neutral/40 text-xs text-center">Never forget anything with smart packing lists</p>
      </div>
    </div>
  );
}