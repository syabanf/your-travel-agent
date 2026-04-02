import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Link } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const destinationCoords = {
  "Bali": [-8.4095, 115.1889],
  "Bali, Indonesia": [-8.4095, 115.1889],
  "Santorini": [36.3932, 25.4615],
  "Santorini, Greece": [36.3932, 25.4615],
  "Tokyo": [35.6762, 139.6503],
  "Tokyo, Japan": [35.6762, 139.6503],
  "Maldives": [3.2028, 73.2207],
  "Paris": [48.8566, 2.3522],
  "Paris, France": [48.8566, 2.3522],
};

const MapClickHandler = ({ onPinpoint }) => {
  const map = useMap();

  useEffect(() => {
    const handleMapClick = (e) => {
      onPinpoint(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, [map, onPinpoint]);

  return null;
};

const MapSearchControl = ({ onSearch }) => {
  const [searchInput, setSearchInput] = useState("");
  const map = useMap();

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`
      );
      const data = await response.json();
      if (data.length > 0) {
        const [lat, lon] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        map.setView([lat, lon], 8);
        onSearch && onSearch(searchInput);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2">
      <div className="flex-1 relative">
        <Input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleSearch()}
          placeholder="Search location..."
          className="bg-white/10 border-white/20 text-mora-white placeholder:text-mora-neutral/40 rounded-lg h-10 pl-10"
        />
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mora-gold/60" />
      </div>
      <button
        onClick={handleSearch}
        className="w-10 h-10 rounded-lg glass-gold flex items-center justify-center text-gold hover:glow-gold transition-all flex-shrink-0"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function MapView() {
  const [trips, setTrips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pinpoints, setPinpoints] = useState([]);

  useEffect(() => {
    base44.entities.Trip.list("-start_date", 50).then(data => {
      setTrips(data.filter(t => destinationCoords[t.destination]));
    });
  }, []);

  const mappedTrips = trips.filter(t => destinationCoords[t.destination]);

  const handlePinpoint = (lat, lng) => {
    setPinpoints([...pinpoints, { lat, lng, id: Date.now() }]);
  };

  const clearPinpoints = () => setPinpoints([]);

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Map View" subtitle="Your destinations" showBack />

      <div className="px-6 mt-4 mb-4">
        <GlassCard className="overflow-hidden h-64 p-0">
          <MapContainer
            center={[20, 60]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <MapSearchControl />
            <MapClickHandler onPinpoint={handlePinpoint} />
            {pinpoints.map(pin => (
              <Marker key={pin.id} position={[pin.lat, pin.lng]}>
                <Popup>Pinpoint</Popup>
              </Marker>
            ))}
            {mappedTrips.map(trip => {
              const coords = destinationCoords[trip.destination];
              return (
                <Marker key={trip.id} position={coords}
                  eventHandlers={{ click: () => setSelected(trip) }}>
                  <Popup>{trip.title}</Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </GlassCard>
      </div>

      <div className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gold uppercase tracking-widest">
            Destinations ({mappedTrips.length})
          </h3>
          {pinpoints.length > 0 && (
            <button
              onClick={clearPinpoints}
              className="text-xs text-mora-neutral/60 hover:text-gold transition-colors"
            >
              Clear pins ({pinpoints.length})
            </button>
          )}
        </div>
        <div className="space-y-3">
          {mappedTrips.map(trip => (
            <Link key={trip.id} to={`/itinerary/${trip.id}`}>
              <GlassCard className={`p-4 flex items-center gap-4 hover:bg-white/10 transition-all ${
                selected?.id === trip.id ? 'ring-1 ring-gold' : ''
              }`}>
                {trip.cover_image && (
                  <img src={trip.cover_image} alt={trip.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
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