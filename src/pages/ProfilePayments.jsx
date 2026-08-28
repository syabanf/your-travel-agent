import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import EmptyState from "@/components/EmptyState";
import { CreditCard, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "ich_payment_methods";

const BRANDS = ["Visa", "Mastercard", "Amex", "JCB"];

function loadMethods() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMethods(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota / unavailable storage */
  }
}

export default function ProfilePayments() {
  const [methods, setMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [brand, setBrand] = useState(BRANDS[0]);

  useEffect(() => {
    setMethods(loadMethods());
  }, []);

  const persist = (rows) => {
    setMethods(rows);
    saveMethods(rows);
  };

  const resetForm = () => {
    setLabel("");
    setLast4("");
    setBrand(BRANDS[0]);
    setShowForm(false);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    const digits = last4.replace(/\D/g, "").slice(0, 4);
    if (!trimmedLabel) {
      toast.error("Card label is required");
      return;
    }
    if (digits.length !== 4) {
      toast.error("Enter the last 4 digits");
      return;
    }
    const method = {
      id: `pm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      label: trimmedLabel,
      last4: digits,
      brand,
    };
    persist([method, ...methods]);
    toast.success("Card added");
    resetForm();
  };

  const handleDelete = (id) => {
    persist(methods.filter((m) => m.id !== id));
    toast("Card removed");
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Payment Methods" subtitle="Cards & digital wallets" showBack />
      <div className="px-6 space-y-4 mt-2">
        <p className="text-[11px] text-ich-neutral/60 text-center">Demo only — no real charges</p>

        {showForm && (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-ich-primary">Add card</h2>
              <button
                onClick={resetForm}
                aria-label="Cancel"
                className="w-8 h-8 glass-light rounded-lg flex items-center justify-center text-ich-neutral hover:text-ich-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label (e.g. Personal Visa) *"
                autoFocus
                className="w-full glass-light rounded-xl px-4 py-3 text-sm text-ich-primary placeholder:text-ich-neutral/50 outline-none focus:ring-1 focus:ring-ich-gold/40"
              />
              <input
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
                placeholder="Last 4 digits *"
                className="w-full glass-light rounded-xl px-4 py-3 text-sm text-ich-primary placeholder:text-ich-neutral/50 outline-none focus:ring-1 focus:ring-ich-gold/40"
              />
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full glass-light rounded-xl px-4 py-3 text-sm text-ich-primary outline-none focus:ring-1 focus:ring-ich-gold/40"
              >
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full py-3 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all flex items-center justify-center gap-2 press"
              >
                <Plus className="w-4 h-4" /> Save card
              </button>
            </form>
          </GlassCard>
        )}

        {methods.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payment methods saved"
            hint="Add a card to book faster"
          />
        ) : (
          <div className="space-y-3 stagger">
            {methods.map((m) => (
              <GlassCard key={m.id} className="p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-ich-gold/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-gold" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ich-primary truncate">{m.label}</p>
                  <p className="text-xs text-ich-neutral mt-0.5">
                    {m.brand} ···· {m.last4}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  aria-label={`Remove ${m.label}`}
                  className="w-9 h-9 glass-light rounded-lg flex items-center justify-center text-red-600/70 hover:text-red-600 transition-colors flex-shrink-0 press"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </GlassCard>
            ))}
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all flex items-center justify-center gap-2 press"
          >
            <Plus className="w-4 h-4" /> Add Payment Method
          </button>
        )}
      </div>
    </div>
  );
}
