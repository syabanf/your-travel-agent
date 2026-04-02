import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

const defaultCategories = [
  {
    id: "docs", name: "Documents", items: [
      { id: "passport", label: "Passport / ID Card", checked: false },
      { id: "visa", label: "Visa / Entry Permit", checked: false },
      { id: "insurance", label: "Travel Insurance", checked: false },
      { id: "bookings", label: "Booking Confirmations Printed", checked: false },
    ]
  },
  {
    id: "clothing", name: "Clothing", items: [
      { id: "tshirts", label: "T-Shirts / Tops", checked: false },
      { id: "pants", label: "Pants / Shorts", checked: false },
      { id: "jacket", label: "Light Jacket", checked: false },
      { id: "swimwear", label: "Swimwear", checked: false },
      { id: "shoes", label: "Comfortable Shoes", checked: false },
    ]
  },
  {
    id: "health", name: "Health & Hygiene", items: [
      { id: "meds", label: "Medications", checked: false },
      { id: "sunscreen", label: "Sunscreen", checked: false },
      { id: "firstaid", label: "First Aid Kit", checked: false },
      { id: "toothbrush", label: "Toothbrush & Toothpaste", checked: false },
      { id: "shampoo", label: "Shampoo / Conditioner", checked: false },
    ]
  },
  {
    id: "tech", name: "Tech & Gadgets", items: [
      { id: "phone", label: "Phone & Charger", checked: false },
      { id: "adapter", label: "Power Adapter", checked: false },
      { id: "camera", label: "Camera", checked: false },
      { id: "earphones", label: "Earphones / AirPods", checked: false },
      { id: "powerbank", label: "Power Bank", checked: false },
    ]
  },
];

export default function ChecklistView() {
  const [categories, setCategories] = useState(defaultCategories);
  const [newItem, setNewItem] = useState({});

  const toggle = (catId, itemId) => {
    setCategories(prev => prev.map(cat =>
      cat.id !== catId ? cat : {
        ...cat,
        items: cat.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
      }
    ));
  };

  const deleteItem = (catId, itemId) => {
    setCategories(prev => prev.map(cat =>
      cat.id !== catId ? cat : { ...cat, items: cat.items.filter(i => i.id !== itemId) }
    ));
  };

  const addItem = (catId) => {
    const val = newItem[catId]?.trim();
    if (!val) return;
    setCategories(prev => prev.map(cat =>
      cat.id !== catId ? cat : {
        ...cat,
        items: [...cat.items, { id: Date.now().toString(), label: val, checked: false }]
      }
    ));
    setNewItem(prev => ({ ...prev, [catId]: "" }));
  };

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const checkedItems = categories.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0);

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title="Checklist" subtitle="Never forget anything" showBack />

      {/* Progress */}
      <div className="px-6 mb-5">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-mora-white">{checkedItems} / {totalItems} packed</p>
            <p className="text-xs text-gold">{Math.round((checkedItems / totalItems) * 100)}%</p>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-mora-gold to-gold rounded-full transition-all duration-500"
              style={{ width: `${(checkedItems / totalItems) * 100}%` }} />
          </div>
        </GlassCard>
      </div>

      {/* Categories */}
      <div className="px-6 space-y-4">
        {categories.map(cat => (
          <GlassCard key={cat.id} className="p-4">
            <h3 className="text-xs font-semibold text-mora-white/70 uppercase tracking-widest mb-3">{cat.name}</h3>
            <div className="space-y-2">
              {cat.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <button onClick={() => toggle(cat.id, item.id)} className="flex-shrink-0">
                    {item.checked
                      ? <CheckSquare className="w-4.5 h-4.5 text-emerald-400" />
                      : <Square className="w-4.5 h-4.5 text-mora-neutral/30" />}
                  </button>
                  <span className={`flex-1 text-sm transition-all ${item.checked ? "text-mora-neutral/40 line-through" : "text-mora-white"}`}>
                    {item.label}
                  </span>
                  <button onClick={() => deleteItem(cat.id, item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {/* Add item input */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <input
                value={newItem[cat.id] || ""}
                onChange={e => setNewItem(prev => ({ ...prev, [cat.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addItem(cat.id)}
                placeholder="Add item..."
                className="flex-1 bg-transparent text-xs text-mora-white placeholder:text-mora-neutral/30 outline-none"
              />
              <button onClick={() => addItem(cat.id)}
                className="w-6 h-6 glass-light rounded-md flex items-center justify-center text-mora-neutral/50 hover:text-gold transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}