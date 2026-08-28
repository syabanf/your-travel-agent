import { useEffect, useState } from "react";
import { CreditCard, Wallet, Building2, Check } from "lucide-react";

// Reusable payment-method selector used by every payment flow.
// Reads saved cards from localStorage `ich_payment_methods`, and offers
// e-wallets + bank transfer. Calls onChange(method) where method =
// { id, type: 'card'|'ewallet'|'bank', label, isNewCard? }.
const EWALLETS = [
  { id: "gopay", label: "GoPay" },
  { id: "ovo", label: "OVO" },
  { id: "dana", label: "DANA" },
];

export default function PaymentMethodPicker({ value, onChange }) {
  const [savedCards, setSavedCards] = useState([]);

  useEffect(() => {
    try { setSavedCards(JSON.parse(localStorage.getItem("ich_payment_methods") || "[]") || []); }
    catch { setSavedCards([]); }
  }, []);

  const methods = [
    ...savedCards.map((c) => ({ id: c.id, type: "card", label: `${c.brand || "Card"} ···· ${c.last4 || "0000"}`, sub: c.label, icon: CreditCard })),
    { id: "new_card", type: "card", label: "New debit / credit card", sub: "Visa, Mastercard, JCB", icon: CreditCard, isNewCard: true },
    ...EWALLETS.map((w) => ({ id: w.id, type: "ewallet", label: w.label, sub: "E-wallet", icon: Wallet })),
    { id: "bank_va", type: "bank", label: "Bank transfer", sub: "Virtual account", icon: Building2 },
  ];

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
              selected ? "glass-gold border-ich-gold/40" : "glass-light border-white/10 hover:border-white/20"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-ich-gold/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ich-primary truncate">{m.label}</p>
              {m.sub && <p className="text-[11px] text-ich-neutral truncate">{m.sub}</p>}
            </div>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selected ? "bg-gold border-gold" : "border-ich-neutral/30"}`}>
              {selected && <Check className="w-3 h-3 text-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
