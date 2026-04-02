import PageHeader from "../components/PageHeader";
import { DollarSign } from "lucide-react";

export default function BudgetView() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Budget Tracker" subtitle="Track your travel expenses" showBack />
      <div className="px-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 glass-gold rounded-2xl flex items-center justify-center">
          <DollarSign className="w-8 h-8 text-gold" />
        </div>
        <p className="text-mora-white/70 text-sm font-display">Budget tracker coming soon</p>
        <p className="text-mora-neutral/40 text-xs text-center">Monitor and manage your travel budget in one place</p>
      </div>
    </div>
  );
}