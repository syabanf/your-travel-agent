import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Link } from "react-router-dom";

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

export default function MapView() {
  const [trips, setTrips] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.Trip.list("-start_date", 50).then(data => {
      setTrips(data.filter(t => destinationCoords[t.destination]));
    });
  }, []);

  const mappedTrips = trips.filter(t => destinationCoords[t.destination]);

  return (
    <div className="animate-fade-in pb-8">
      <PageHeader title="Map View" subtitle="Your destinations" showBack />

      <div className="px-6 mb-4">
        <div className="rounded-2xl overflow-hidden h-64 border border-white/10">
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
        </div>
      </div>

      {selected && (
        <div className="px-6 mb-4">
          <Link to={`/itinerary/${selected.id}`}>
            <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
              {selected.cover_image && (
                <img src={selected.cover_image} alt={selected.title}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              )}
              <div>
                <p className="text-[10px] text-gold uppercase tracking-widest">Selected</p>
                <h3 className="text-sm font-semibold text-mora-white">{selected.title}</h3>
                <p className="text-xs text-mora-neutral/50">{selected.destination}</p>
              </div>
            </GlassCard>
          </Link>
        </div>
      )}

      <div className="px-6">
        <h3 className="text-xs font-semibold text-mora-white/70 uppercase tracking-widest mb-3">
          Destinations ({mappedTrips.length})
        </h3>
        <div className="space-y-3">
          {mappedTrips.map(trip => (
            <Link key={trip.id} to={`/itinerary/${trip.id}`}>
              <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                {trip.cover_image && (
                  <img src={trip.cover_image} alt={trip.title}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-mora-white truncate">{trip.title}</h4>
                  <p className="text-xs text-mora-neutral/50">{trip.destination}</p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}