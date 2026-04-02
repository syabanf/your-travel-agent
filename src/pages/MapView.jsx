import PageHeader from "../components/PageHeader";
import { Map } from "lucide-react";

export default function MapView() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Map View" subtitle="Explore your destinations" showBack />
      <div className="px-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 glass-gold rounded-2xl flex items-center justify-center">
          <Map className="w-8 h-8 text-gold" />
        </div>
        <p className="text-mora-white/70 text-sm font-display">Map view coming soon</p>
        <p className="text-mora-neutral/40 text-xs text-center">Visualize all your trips on an interactive map</p>
      </div>
    </div>
  );
}