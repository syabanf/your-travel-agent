import OTASearch from "../components/booking/OTASearch";
import PageHeader from "../components/PageHeader";

export default function OTA() {
  return (
    <div className="animate-fade-in pb-28">
      <PageHeader
        title="Book Travel"
        subtitle="Search & book flights, hotels & more"
        showBack
        showNotification
      />

      {/* OTA search engine — its tab row is the category selector; standalone bookings (not tied to a trip) */}
      <OTASearch defaultTab="flight" showMyBookings={false} tripId={null} onSaveBooking={() => {}} />

      {/* Standalone note */}
      <div className="px-6">
        <p className="text-xs text-ich-neutral/60 leading-relaxed">
          Bookings made here are standalone. To book inside a trip, open the trip and use its booking flow.
        </p>
      </div>
    </div>
  );
}
