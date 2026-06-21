import { Plane, Building2, Train, Bus, Ship, Car, Ticket } from "lucide-react";
import OTASearch from "../components/booking/OTASearch";
import PageHeader from "../components/PageHeader";

const categories = [
  { icon: Plane, label: "Flights" },
  { icon: Building2, label: "Hotels" },
  { icon: Train, label: "Trains" },
  { icon: Bus, label: "Buses" },
  { icon: Ship, label: "Ships" },
  { icon: Car, label: "Rentals" },
  { icon: Ticket, label: "Attractions" },
];

export default function OTA() {
  return (
    <div className="animate-fade-in pb-28">
      <PageHeader
        title="Book Travel"
        subtitle="Search & book flights, hotels & more"
        showBack
        showNotification
      />

      {/* Category strip */}
      <div className="px-6 mb-6">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
          {categories.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass-light rounded-2xl px-4 py-3 flex flex-col items-center gap-2 flex-shrink-0 min-w-[72px]"
            >
              <Icon className="w-5 h-5 text-gold" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-mora-neutral/70 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OTA search engine — standalone bookings (not tied to a trip) */}
      <OTASearch defaultTab="flight" showMyBookings={false} tripId={null} onSaveBooking={() => {}} />

      {/* Standalone note */}
      <div className="px-6">
        <p className="text-xs text-mora-neutral/40 leading-relaxed">
          Bookings made here are standalone. To book inside a trip, open the trip and use its booking flow.
        </p>
      </div>
    </div>
  );
}
