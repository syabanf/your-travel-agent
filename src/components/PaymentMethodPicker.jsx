import { useEffect, useState } from "react";
import { CreditCard, Wallet, Building2, Check } from "lucide-react";
import { DEFAULT_PAYMENT_METHODS } from "@/data/masterData";
import useMasterData from "@/lib/useMasterData";

const ICONS = { card: CreditCard, ewallet: Wallet, bank: Building2 };

// Reusable payment-method selector used by every payment flow. The options
// come from Master data > Payment methods; an active card option also lists
// the cards saved on this device (localStorage `ich_payment_methods`).
// Calls onChange(method) where method = { id, type, label, isNewCard? }.
export default function PaymentMethodPicker({ value, onChange }) {
  const [savedCards, setSavedCards] = useState([]);
  const options = useMasterData("PaymentMethod", DEFAULT_PAYMENT_METHODS);

  useEffect(() => {
    try { setSavedCards(JSON.parse(localStorage.getItem("ich_payment_methods") || "[]") || []); }
    catch { setSavedCards([]); }
  }, []);

  const methods = options.flatMap((o) => o.type === "card"
    ? [
        ...savedCards.map((c) => ({ id: c.id, type: "card", label: `${c.brand || "Card"} ···· ${c.last4 || "0000"}`, sub: c.label, icon: CreditCard })),
        { id: "new_card", type: "card", label: `New ${o.label.toLowerCase()}`, sub: o.detail, icon: CreditCard, isNewCard: true },
      ]
    : [{ id: o.key, type: o.type, label: o.label, sub: o.detail, icon: ICONS[o.type] || Building2 }]);

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Payment method">
      {methods.map((m) => {
        const selected = value?.id === m.id;
        const Icon = m.icon;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(m)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all press ${
              selected ? "bg-accent-strong border-accent/40" : "bg-card shadow-card border-border hover:border-border"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-accent-strong" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{m.label}</p>
              {m.sub && <p className="text-[11px] text-muted truncate">{m.sub}</p>}
            </div>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? "bg-accent-strong border-accent" : "border-muted/30"}`}>
              {selected && <Check className="w-3 h-3 text-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
