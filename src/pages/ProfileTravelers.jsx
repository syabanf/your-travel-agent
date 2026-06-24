import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import EmptyState from "@/components/EmptyState";
import { Users, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "mora_travelers";

function loadTravelers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTravelers(rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota / unavailable storage */
  }
}

export default function ProfileTravelers() {
  const [travelers, setTravelers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("");

  useEffect(() => {
    setTravelers(loadTravelers());
  }, []);

  const persist = (rows) => {
    setTravelers(rows);
    saveTravelers(rows);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setRelation("");
    setShowForm(false);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }
    const traveler = {
      id: `tv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      email: email.trim(),
      relation: relation.trim(),
    };
    persist([traveler, ...travelers]);
    toast.success("Traveler added");
    resetForm();
  };

  const handleDelete = (id) => {
    persist(travelers.filter((t) => t.id !== id));
    toast("Traveler removed");
  };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Saved Travelers" subtitle="Companions & family members" showBack />
      <div className="px-6 space-y-4 mt-2">
        {showForm && (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-mora-primary">Add traveler</h2>
              <button
                onClick={resetForm}
                aria-label="Cancel"
                className="w-8 h-8 glass-light rounded-lg flex items-center justify-center text-mora-neutral hover:text-mora-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name *"
                aria-label="Full name"
                autoFocus
                className="w-full glass-light rounded-xl px-4 py-3 text-sm text-mora-primary placeholder:text-mora-neutral/50 outline-none focus:ring-1 focus:ring-mora-gold/40"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email (optional)"
                aria-label="Email (optional)"
                className="w-full glass-light rounded-xl px-4 py-3 text-sm text-mora-primary placeholder:text-mora-neutral/50 outline-none focus:ring-1 focus:ring-mora-gold/40"
              />
              <input
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="Relation (e.g. Spouse, Child)"
                aria-label="Relation"
                className="w-full glass-light rounded-xl px-4 py-3 text-sm text-mora-primary placeholder:text-mora-neutral/50 outline-none focus:ring-1 focus:ring-mora-gold/40"
              />
              <button
                type="submit"
                className="w-full py-3 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all flex items-center justify-center gap-2 press"
              >
                <Plus className="w-4 h-4" /> Save traveler
              </button>
            </form>
          </GlassCard>
        )}

        {travelers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No travelers saved yet"
            hint="Add companions for quicker booking"
          />
        ) : (
          <div className="space-y-3 stagger">
            {travelers.map((t) => (
              <GlassCard key={t.id} className="p-4 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-mora-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-display text-gold">{t.name?.[0]?.toUpperCase() || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-mora-primary truncate">{t.name}</p>
                  {(t.relation || t.email) && (
                    <p className="text-xs text-mora-neutral mt-0.5 truncate">
                      {[t.relation, t.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  aria-label={`Remove ${t.name}`}
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
            <Plus className="w-4 h-4" /> Add Traveler
          </button>
        )}
      </div>
    </div>
  );
}
