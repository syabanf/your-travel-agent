import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";

const styles = ["luxury", "adventure", "cultural", "relaxation", "business", "family", "budget"];
const paces = ["relaxed", "moderate", "packed"];
const interests = ["Fine Dining", "Beach", "Mountains", "City Breaks", "History", "Art", "Nightlife", "Wellness", "Shopping", "Nature"];

export default function ProfilePreferences() {
  const [selectedStyle, setSelectedStyle] = useState("luxury");
  const [selectedPace, setSelectedPace] = useState("moderate");
  const [selectedInterests, setSelectedInterests] = useState(["Fine Dining", "Beach"]);

  const toggleInterest = (i) => setSelectedInterests(prev =>
    prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
  );

  const handleSave = () => {
    localStorage.setItem("ich_preferences", JSON.stringify({
      style: selectedStyle,
      pace: selectedPace,
      interests: selectedInterests,
    }));
    toast.success("Preferences saved");
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Travel Preferences" subtitle="Personalize your experience" showBack />
      <div className="px-6 space-y-5 mt-2">
        <GlassCard className="p-5">
          <p className="text-xs text-gold uppercase tracking-widest mb-4">Preferred Travel Style</p>
          <div className="flex flex-wrap gap-2">
            {styles.map(s => (
              <button key={s} onClick={() => setSelectedStyle(s)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium capitalize transition-all ${selectedStyle === s ? "glass-gold text-gold" : "glass-light text-ich-neutral/60"}`}>
                {s}
              </button>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-gold uppercase tracking-widest mb-4">Trip Pace</p>
          <div className="grid grid-cols-3 gap-2">
            {paces.map(p => (
              <button key={p} onClick={() => setSelectedPace(p)}
                className={`py-3 rounded-xl text-xs font-medium capitalize transition-all ${selectedPace === p ? "glass-gold text-gold" : "glass-light text-ich-neutral/60"}`}>
                {p}
              </button>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-gold uppercase tracking-widest mb-4">Interests</p>
          <div className="flex flex-wrap gap-2">
            {interests.map(i => (
              <button key={i} onClick={() => toggleInterest(i)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${selectedInterests.includes(i) ? "glass-gold text-gold" : "glass-light text-ich-neutral/60"}`}>
                {i}
              </button>
            ))}
          </div>
        </GlassCard>
        <button onClick={handleSave} className="w-full py-4 glass-gold rounded-xl text-sm font-medium text-gold hover:glow-gold transition-all mb-6">
          Save Preferences
        </button>
      </div>
    </div>
  );
}