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
    <div className="animate-fade-in pb-28">
      <PageHeader title="Map View" subtitle="Your destinations" showBack />



      <div className="px-6">
        <h3 className="text-xs font-semibold text-gold uppercase tracking-widest mb-4">
          Destinations ({mappedTrips.length})
        </h3>
        <div className="space-y-2">
          {mappedTrips.map(trip => (
            <Link key={trip.id} to={`/itinerary/${trip.id}`}>
              <GlassCard className={`p-3 flex items-center gap-3 hover:bg-white/10 transition-all ${
                selected?.id === trip.id ? 'ring-1 ring-gold' : ''
              }`}>
                {trip.cover_image && (
                  <img src={trip.cover_image} alt={trip.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
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