import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import { Link } from "react-router-dom";
import moment from "moment";

const statusColors = {
  active: "bg-emerald-500",
  planned: "bg-mora-gold",
  draft: "bg-mora-neutral/50",
  completed: "bg-blue-400",
  cancelled: "bg-red-400",
};

export default function CalendarView() {
  const [trips, setTrips] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());

  useEffect(() => {
    base44.entities.Trip.list("-start_date", 50).then(setTrips);
  }, []);

  const startOfMonth = currentMonth.clone().startOf("month");
  const endOfMonth = currentMonth.clone().endOf("month");
  const startDay = startOfMonth.day(); // 0=Sun
  const daysInMonth = currentMonth.daysInMonth();

  const getTripsForDay = (day) => {
    const date = currentMonth.clone().date(day);
    return trips.filter((t) => {
      if (!t.start_date) return false;
      const start = moment(t.start_date);
      const end = t.end_date ? moment(t.end_date) : start;
      return date.isSameOrAfter(start, "day") && date.isSameOrBefore(end, "day");
    });
  };

  const monthTrips = trips.filter((t) => {
    if (!t.start_date) return false;
    const start = moment(t.start_date);
    const end = t.end_date ? moment(t.end_date) : start;
    return start.isBefore(endOfMonth, "day") && end.isAfter(startOfMonth, "day");
  });

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Calendar" subtitle="Your trips timeline" showBack />

      {/* Month navigator */}
      <div className="px-6 mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(m => m.clone().subtract(1, "month"))}
              className="w-8 h-8 glass-light rounded-lg flex items-center justify-center text-mora-neutral/70 hover:text-gold transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-display font-semibold text-mora-white">
              {currentMonth.format("MMMM YYYY")}
            </h2>
            <button onClick={() => setCurrentMonth(m => m.clone().add(1, "month"))}
              className="w-8 h-8 glass-light rounded-lg flex items-center justify-center text-mora-neutral/70 hover:text-gold transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="text-center text-[10px] text-mora-neutral/40 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayTrips = getTripsForDay(day);
              const isToday = moment().isSame(currentMonth.clone().date(day), "day");
              return (
                <div key={day}
                  className={`min-h-[40px] rounded-lg p-1 flex flex-col items-center ${isToday ? "glass-gold" : ""}`}>
                  <span className={`text-xs font-medium mb-0.5 ${isToday ? "text-gold" : "text-mora-white/70"}`}>{day}</span>
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dayTrips.slice(0, 2).map(t => (
                      <div key={t.id}
                        className={`w-1.5 h-1.5 rounded-full ${statusColors[t.status] || "bg-mora-neutral/50"}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Trips this month */}
      <div className="px-6">
        <h3 className="text-xs font-semibold text-mora-white/70 uppercase tracking-widest mb-3">
          {currentMonth.format("MMMM")} Trips ({monthTrips.length})
        </h3>
        {monthTrips.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-mora-neutral/50">No trips this month</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {monthTrips.map(trip => (
              <Link key={trip.id} to={`/itinerary/${trip.id}`} className="block">
                <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-all">
                  {trip.cover_image && (
                    <img src={trip.cover_image} alt={trip.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-mora-white truncate">{trip.title}</h4>
                    <p className="text-xs text-mora-neutral/50 mt-0.5">{trip.destination}</p>
                    <p className="text-[10px] text-gold mt-1">
                      {moment(trip.start_date).format("MMM D")} — {trip.end_date ? moment(trip.end_date).format("MMM D") : "—"}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                    trip.status === "active" ? "bg-emerald-500/15 text-emerald-600" :
                    trip.status === "planned" ? "bg-mora-gold/10 text-gold" :
                    "bg-white/5 text-mora-neutral/50"
                  }`}>{trip.status}</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}