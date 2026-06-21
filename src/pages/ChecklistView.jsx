import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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

const getStorageKey = (tripId) => `checklist_${tripId}`;

const loadChecklist = (tripId) => {
  try {
    const saved = localStorage.getItem(getStorageKey(tripId));
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultCategories));
  } catch {
    return JSON.parse(JSON.stringify(defaultCategories));
  }
};

const saveChecklist = (tripId, categories) => {
  localStorage.setItem(getStorageKey(tripId), JSON.stringify(categories));
};

export default function ChecklistView() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newItem, setNewItem] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Trip.list("-created_date", 30).then(data => {
      setTrips(data);
      if (data.length > 0) {
        const first = data[0];
        setSelectedTripId(first.id);
        setCategories(loadChecklist(first.id));
      }
      setLoading(false);
    });
  }, []);

  const selectTrip = (tripId) => {
    setSelectedTripId(tripId);
    setCategories(loadChecklist(tripId));
    setNewItem({});
  };

  const updateCategories = (tripId, updated) => {
    setCategories(updated);
    saveChecklist(tripId, updated);
  };

  const toggle = (catId, itemId) => {
    const updated = categories.map(cat =>
      cat.id !== catId ? cat : {
        ...cat,
        items: cat.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i)
      }
    );
    updateCategories(selectedTripId, updated);
  };

  const deleteItem = (catId, itemId) => {
    const updated = categories.map(cat =>
      cat.id !== catId ? cat : { ...cat, items: cat.items.filter(i => i.id !== itemId) }
    );
    updateCategories(selectedTripId, updated);
  };

  const addItem = (catId) => {
    const val = newItem[catId]?.trim();
    if (!val) return;
    const updated = categories.map(cat =>
      cat.id !== catId ? cat : {
        ...cat,
        items: [...cat.items, { id: Date.now().toString(), label: val, checked: false }]
      }
    );
    updateCategories(selectedTripId, updated);
    setNewItem(prev => ({ ...prev, [catId]: "" }));
  };

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const checkedItems = categories.reduce((s, c) => s + c.items.filter(i => i.checked).length, 0);
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Checklist" subtitle="Never forget anything" showBack />

      {/* Trip selector */}
      {!loading && trips.length > 0 && (
        <div className="px-6 mb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {trips.map(t => (
              <button key={t.id}
                onClick={() => selectTrip(t.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedTripId === t.id ? "glass-gold text-gold" : "glass-light text-mora-neutral/60"
                }`}>
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
        </div>
      ) : !selectedTripId ? (
        <div className="px-6">
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-mora-neutral/50">No trips found. Create a trip first.</p>
          </GlassCard>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div className="px-6 mb-6">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-mora-white">{checkedItems} / {totalItems} packed</p>
                <p className="text-xs text-gold">{pct}%</p>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-mora-gold to-gold rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }} />
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
                          ? <CheckSquare className="w-4 h-4 text-emerald-400" />
                          : <Square className="w-4 h-4 text-mora-neutral/30" />}
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
        </>
      )}
    </div>
  );
}