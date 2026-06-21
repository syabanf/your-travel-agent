import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import OLMap from "../components/OLMap";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

const destinationCoords = {
  "Bali": [-8.4095, 115.1889],
  "Bali, Indonesia": [-8.4095, 115.1889],
  "Santorini": [36.3932, 25.4615],
  "Santorini, Greece": [36.3932, 25.4615],
  "Tokyo": [35.6762, 139.6503],
  "Tokyo, Japan": [35.6762, 139.6503],
  "Kyoto, Japan": [35.0116, 135.7681],
  "Maldives": [3.2028, 73.2207],
  "Maldives, Indian Ocean": [3.2028, 73.2207],
  "Paris": [48.8566, 2.3522],
  "Paris, France": [48.8566, 2.3522],
};

export default function MapView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locationParam = searchParams.get("location") || "";
  const callback = searchParams.get("callback");

  const [trips, setTrips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pinpoints, setPinpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState(null);
  const [chosen, setChosen] = useState(locationParam);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    base44.entities.Trip.list("-start_date", 50)
      .then((data) => setTrips(data.filter((t) => destinationCoords[t.destination])))
      .finally(() => setLoading(false));
  }, []);

  // Center on an incoming ?location (geocode if it's not a known city).
  useEffect(() => {
    if (!locationParam) return;
    const known = destinationCoords[locationParam];
    if (known) { setFocus({ lat: known[0], lng: known[1] }); return; }
    let active = true;
    (async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationParam)}`);
        const d = await r.json();
        if (active && d.length) setFocus({ lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) });
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [locationParam]);

  const geocodeSearch = async () => {
    if (!searchInput.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`);
      const d = await r.json();
      if (d.length) { setFocus({ lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) }); setChosen(searchInput); }
    } catch { /* ignore */ }
  };

  const useThisLocation = () => {
    const label = chosen || locationParam;
    if (!callback || !label) return;
    navigate(callback + (callback.includes("?") ? "&" : "?") + "location=" + encodeURIComponent(label));
  };

  const mappedTrips = trips.filter((t) => destinationCoords[t.destination]);

  const markers = [
    ...mappedTrips.map((t) => ({ id: t.id, lat: destinationCoords[t.destination][0], lng: destinationCoords[t.destination][1] })),
    ...pinpoints.map((p) => ({ id: `pin-${p.id}`, lat: p.lat, lng: p.lng })),
    ...(focus ? [{ id: "focus", lat: focus.lat, lng: focus.lng }] : []),
  ];

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Map View" subtitle={locationParam || "Your destinations"} showBack />

      {callback && (
        <div className="px-6 mt-2">
          <button onClick={useThisLocation} className="w-full py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" /> Use {chosen || locationParam || "this location"}
          </button>
        </div>
      )}

      <div className="px-6 mt-4 mb-4">
        <GlassCard className="overflow-hidden h-64 p-0 relative">
          {/* Search overlay */}
          <div className="absolute top-3 left-3 right-3 z-[5] flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && geocodeSearch()}
                placeholder="Search location…"
                className="bg-white/95 border-mora-primary/10 text-mora-primary placeholder:text-mora-neutral/50 rounded-lg h-10 pl-9 shadow-sm"
              />
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
            </div>
            <button onClick={geocodeSearch} className="w-10 h-10 rounded-lg btn-primary flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <OLMap
            variant="dark"
            center={focus ? [focus.lng, focus.lat] : undefined}
            zoom={focus ? 7 : 2}
            markers={markers}
            onMarkerClick={(id) => { const t = mappedTrips.find((x) => x.id === id); if (t) setSelected(t); }}
            onClick={(lng, lat) => setPinpoints((prev) => [...prev, { lat, lng, id: Date.now() }])}
          />
        </GlassCard>
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gold uppercase tracking-widest">
            Destinations ({mappedTrips.length})
          </h3>
          {pinpoints.length > 0 && (
            <button onClick={() => setPinpoints([])} className="text-xs text-mora-neutral/60 hover:text-gold transition-colors">
              Clear pins ({pinpoints.length})
            </button>
          )}
        </div>
        <div className="space-y-3.5">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" /></div>
          ) : mappedTrips.length === 0 ? (
            <p className="text-sm text-mora-neutral/60 text-center py-6">No mapped destinations yet.</p>
          ) : mappedTrips.map((trip) => (
            <Link key={trip.id} to={`/itinerary/${trip.id}`} className="block">
              <GlassCard className={`p-4 flex items-center gap-4 hover:bg-white/10 transition-all ${selected?.id === trip.id ? "ring-1 ring-gold" : ""}`}>
                {trip.cover_image && (
                  <img src={trip.cover_image} alt={trip.title} onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-mora-white truncate">{trip.title}</h4>
                  <p className="text-xs text-mora-neutral/50 mt-1">{trip.destination}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
