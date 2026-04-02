import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Calendar, DollarSign, Hash, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import moment from "moment";

const statusColors = {
  pending: "bg-[#A5997E]/15 text-gold border-[#A5997E]/20",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function BookingDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const results = await base44.entities.Booking.filter({ id: bookingId });
      if (results.length > 0) setBooking(results[0]);
      setLoading(false);
    };
    load();
  }, [bookingId]);

  const handleDelete = async () => {
    await base44.entities.Booking.delete(bookingId);
    navigate("/booking");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-mora-gold/30 border-t-mora-gold rounded-full animate-spin" />
    </div>
  );

  if (!booking) return null;

  return (
    <div className="animate-fade-in">
      {booking.image_url && (
        <div className="relative h-52">
          <img src={booking.image_url} alt={booking.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e22] via-[#1a2e22]/40 to-transparent" />
          <div className="absolute top-0 left-0 right-0">
            <PageHeader showBack title="" />
          </div>
        </div>
      )}
      {!booking.image_url && <PageHeader title="Booking Detail" showBack />}

      <div className="px-6 mt-4 space-y-4">
        <GlassCard className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-xl font-display font-bold text-mora-white">{booking.title}</h1>
            <span className={`text-[10px] px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${statusColors[booking.status] || statusColors.pending}`}>
              {booking.status}
            </span>
          </div>
          <div className="space-y-3">
            {booking.provider && (
              <div className="flex items-center gap-3 text-sm text-mora-neutral/70">
                <Hash className="w-4 h-4 text-gold/50 flex-shrink-0" />
                <span>{booking.provider}</span>
              </div>
            )}
            {booking.location && (
              <div className="flex items-center gap-3 text-sm text-mora-neutral/70">
                <MapPin className="w-4 h-4 text-gold/50 flex-shrink-0" />
                <span>{booking.location}</span>
              </div>
            )}
            {booking.check_in && (
              <div className="flex items-center gap-3 text-sm text-mora-neutral/70">
                <Calendar className="w-4 h-4 text-gold/50 flex-shrink-0" />
                <span>{moment(booking.check_in).format("MMM D, YYYY")} {booking.check_out && `→ ${moment(booking.check_out).format("MMM D, YYYY")}`}</span>
              </div>
            )}
            {booking.price > 0 && (
              <div className="flex items-center gap-3 text-sm text-mora-neutral/70">
                <DollarSign className="w-4 h-4 text-gold/50 flex-shrink-0" />
                <span className="font-display font-semibold text-gold">${booking.price} {booking.currency}</span>
              </div>
            )}
            {booking.confirmation_code && (
              <div className="flex items-center gap-3 text-sm text-mora-neutral/70">
                <Hash className="w-4 h-4 text-gold/50 flex-shrink-0" />
                <span>Confirmation: <span className="text-mora-white font-medium">{booking.confirmation_code}</span></span>
              </div>
            )}
          </div>
          {booking.notes && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-mora-neutral/50 mb-1.5">Notes</p>
              <p className="text-sm text-mora-neutral/70 leading-relaxed">{booking.notes}</p>
            </div>
          )}
        </GlassCard>

        <button
          onClick={handleDelete}
          className="w-full py-3.5 glass-light rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 flex items-center justify-center gap-2 transition-all"
        >
          <Trash2 className="w-4 h-4" /> Delete Booking
        </button>
      </div>
    </div>
  );
}