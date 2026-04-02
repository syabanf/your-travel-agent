import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { CreditCard, Plus } from "lucide-react";

export default function ProfilePayments() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Payment Methods" subtitle="Cards & digital wallets" showBack />
      <div className="px-6 space-y-4 mt-2">
        <GlassCard className="p-8 text-center">
          <CreditCard className="w-10 h-10 text-mora-neutral/30 mx-auto mb-3" />
          <p className="text-sm text-mora-neutral/60 mb-1">No payment methods saved</p>
          <p className="text-xs text-mora-neutral/40">Add a card to book faster</p>
        </GlassCard>
        <button className="w-full py-4 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Payment Method
        </button>
      </div>
    </div>
  );
}