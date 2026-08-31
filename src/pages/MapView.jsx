import { useState, useEffect, useMemo } from "react";
import { backend } from "@/api/backend";
import OLMap from "../components/OLMap";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { getDestinationActivities } from "@/data/destinations";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search, MapPin, ChevronLeft, ChevronRight,
  Waves, TreePine, Landmark, Mountain, Compass, Utensils, Building2, ShoppingBag, Flower2, Wine,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Activity category → icon + label (drives both the map dots and the list).
const CAT = {
  beach: { icon: Waves, label: "Beach" },
  nature: { icon: TreePine, label: "Nature" },
  culture: { icon: Landmark, label: "Culture" },
  views: { icon: Mountain, label: "Views" },
  adventure: { icon: Compass, label: "Adventure" },
  food: { icon: Utensils, label: "Food & drink" },
  landmark: { icon: Landmark, label: "Landmark" },
  city: { icon: Building2, label: "City" },
  shopping: { icon: ShoppingBag, label: "Shopping" },
  wellness: { icon: Flower2, label: "Wellness" },
  nightlife: { icon: Wine, label: "Nightlife" },
};
const catOf = (c) => CAT[c] || { icon: MapPin, label: c || "Spot" };

// Absolute coordinate for an activity, offset from its destination's center.
const actCoord = (dest, a) => ({ lat: dest.lat + (a.dLat || 0), lng: dest.lng + (a.dLng || 0) });

export default function MapView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locationParam = searchParams.get("location") || "";
  const callback = searchParams.get("callback");

  const [dests, setDests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);        // a specific point (activity / geocode / ?location=)
  const [pinpoints, setPinpoints] = useState([]);  // dropped pins (location-picker mode)
  const [chosen, setChosen] = useState(locationParam);
  const [searchInput, setSearchInput] = useState("");

  // Load catalog destinations and merge their curated activities.
  useEffect(() => {
    backend.entities.Destination.list("-created_date", 100)
      .then((data) => {
        const mapped = (data || [])
          .filter((d) => d.active !== false && d.lat != null && d.lng != null)
          .map((d) => {
            const slug = String(d.id).replace(/^dest_/, "");
            return { ...d, slug, activities: getDestinationActivities(slug) };
          });
        setDests(mapped);
      })
      .catch(() => setDests([]))
      .finally(() => setLoading(false));
  }, []);

  // Center on an incoming ?location= (geocoded) — used by "view on map" links and the picker.
  useEffect(() => {
    if (!locationParam) return;
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

  const selectedDest = dests.find((d) => d.id === selectedId) || null;

  const selectDest = (id) => { setSelectedId(id); setFocus(null); };
  const clearDest = () => { setSelectedId(null); setFocus(null); };

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

  const markers = useMemo(() => {
    const out = [];
    if (selectedDest) {
      out.push({ id: selectedDest.id, lat: selectedDest.lat, lng: selectedDest.lng });
      selectedDest.activities.forEach((a, i) => {
        const c = actCoord(selectedDest, a);
        out.push({ id: `act-${i}`, lat: c.lat, lng: c.lng, kind: "activity" });
      });
    } else {
      dests.forEach((d) => out.push({ id: d.id, lat: d.lat, lng: d.lng }));
    }
    pinpoints.forEach((p) => out.push({ id: `pin-${p.id}`, lat: p.lat, lng: p.lng }));
    if (focus) out.push({ id: "focus", lat: focus.lat, lng: focus.lng });
    return out;
  }, [dests, selectedDest, pinpoints, focus]);

  const center = focus ? [focus.lng, focus.lat] : selectedDest ? [selectedDest.lng, selectedDest.lat] : undefined;
  const zoom = focus ? (selectedDest ? 12 : 7) : selectedDest ? 11 : 2;

  const onMarkerClick = (id) => {
    if (typeof id === "string" && id.startsWith("act-")) {
      const a = selectedDest?.activities[Number(id.slice(4))];
      if (a && selectedDest) setFocus(actCoord(selectedDest, a));
      return;
    }
    const d = dests.find((x) => x.id === id);
    if (d) selectDest(d.id);
  };

  const onMapClick = (lng, lat) => { if (callback) setPinpoints((prev) => [...prev, { lat, lng, id: Date.now() }]); };

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader
        title={callback ? "Pick a location" : "Explore"}
        subtitle={callback ? "Search or tap the map" : (locationParam || (selectedDest ? `${selectedDest.name} · things to do` : "Destinations & things to do"))}
        showBack
      />

      {callback && (
        <div className="px-6 mt-2">
          <button onClick={useThisLocation} disabled={!(chosen || locationParam)} className="w-full py-3 btn-primary rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            <MapPin className="w-4 h-4" /> Use {chosen || locationParam || "selected location"}
          </button>
        </div>
      )}

      {/* Map */}
      <div className="px-6 mt-4 mb-4">
        <GlassCard className="overflow-hidden h-72 p-0 relative">
          {/* Search overlay */}
          <div className="absolute top-3 left-3 right-3 z-[5] flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && geocodeSearch()}
                placeholder="Search location…"
                aria-label="Search for a location"
                className="bg-white/95 border-ich-primary/10 text-ich-primary placeholder:text-ich-neutral/50 rounded-lg h-10 pl-9 shadow-sm"
              />
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
            </div>
            <button onClick={geocodeSearch} aria-label="Search" className="w-10 h-10 rounded-lg btn-primary flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Back to all destinations */}
          {selectedDest && (
            <button onClick={clearDest} className="absolute bottom-3 left-3 z-[5] px-3 py-1.5 rounded-full bg-white/95 shadow-sm text-xs font-semibold text-ich-primary flex items-center gap-1 press">
              <ChevronLeft className="w-3.5 h-3.5" /> All destinations
            </button>
          )}

          <OLMap
            variant="dark"
            center={center}
            zoom={zoom}
            markers={markers}
            onMarkerClick={onMarkerClick}
            onClick={onMapClick}
          />
        </GlassCard>

        {/* Legend (only meaningful once a destination is selected) */}
        {selectedDest && (
          <div className="flex items-center gap-4 mt-2 px-1 text-[11px] text-ich-neutral">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-3.5 rounded-sm bg-ich-gold inline-block" /> Destination</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#C99A3F" }} /> Things to do</span>
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-6">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-ich-gold/30 border-t-ich-gold rounded-full animate-spin" /></div>
        ) : selectedDest ? (
          <>
            {/* Selected destination header → opens full detail */}
            <Link to={`/destination/${selectedDest.id}`} className="block press mb-4">
              <GlassCard className="p-3 flex items-center gap-3 hover:bg-white/10 transition-all">
                {selectedDest.image && (
                  <img src={selectedDest.image} alt={selectedDest.name} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-ich-white truncate">{selectedDest.name}</h3>
                  <p className="text-xs text-ich-neutral/60 truncate">{selectedDest.country}</p>
                  <span className="text-[11px] text-amber-accent font-medium">View destination →</span>
                </div>
                <ChevronRight className="w-4 h-4 text-ich-neutral/40 flex-shrink-0" />
              </GlassCard>
            </Link>

            <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-3">
              Things to do ({selectedDest.activities.length})
            </h3>
            {selectedDest.activities.length === 0 ? (
              <p className="text-sm text-ich-neutral/60 py-4">No highlighted activities for this destination yet.</p>
            ) : (
              <div className="space-y-2.5">
                {selectedDest.activities.map((a, i) => {
                  const { icon: Icon, label } = catOf(a.category);
                  const c = actCoord(selectedDest, a);
                  const isFocus = focus && Math.abs(focus.lat - c.lat) < 1e-9 && Math.abs(focus.lng - c.lng) < 1e-9;
                  return (
                    <button key={i} onClick={() => setFocus(c)} className="w-full text-left press" aria-label={`Show ${a.name} on map`}>
                      <GlassCard className={`p-3.5 flex items-center gap-3 hover:bg-white/10 transition-all ${isFocus ? "ring-1 ring-ich-gold" : ""}`}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(201,154,63,0.14)" }}>
                          <Icon className="w-4 h-4 text-amber-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-ich-white truncate">{a.name}</h4>
                          <p className="text-[11px] text-ich-neutral/60">{label}</p>
                        </div>
                        <MapPin className="w-4 h-4 text-ich-neutral/40 flex-shrink-0" />
                      </GlassCard>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gold uppercase tracking-widest">
                Destinations ({dests.length})
              </h3>
              {pinpoints.length > 0 && (
                <button onClick={() => setPinpoints([])} className="text-xs text-ich-neutral/60 hover:text-gold transition-colors">
                  Clear pins ({pinpoints.length})
                </button>
              )}
            </div>

            {dests.length === 0 ? (
              <p className="text-sm text-ich-neutral/60 text-center py-6">No destinations available.</p>
            ) : (
              <div className="space-y-3">
                {dests.map((d) => (
                  <button key={d.id} onClick={() => selectDest(d.id)} className="w-full text-left press" aria-label={`Show ${d.name} and its activities on the map`}>
                    <GlassCard className="p-3 flex items-center gap-3 hover:bg-white/10 transition-all">
                      {d.image && (
                        <img src={d.image} alt={d.name} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-ich-white truncate">{d.name}</h4>
                        <p className="text-xs text-ich-neutral/60 truncate">{d.country}</p>
                        {d.activities?.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {d.activities.slice(0, 3).map((a, i) => {
                              const { icon: Icon } = catOf(a.category);
                              return <Icon key={i} className="w-3.5 h-3.5 text-amber-accent" />;
                            })}
                            <span className="text-[10px] text-ich-neutral/50 ml-0.5">{d.activities.length} things to do</span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-ich-neutral/40 flex-shrink-0" />
                    </GlassCard>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
