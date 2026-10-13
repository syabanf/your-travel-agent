import { useState, useEffect } from "react";
import { backend } from "@/api/backend";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet } from "lucide-react";
import PageHeader from "../components/PageHeader";
import GlassCard from "../components/GlassCard";
import EmptyState from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { formatIDR } from "@/lib/currency";
import { BRAND } from "@/lib/brand";

const COLORS = [BRAND.accent, BRAND.ink, BRAND.info, BRAND.success, BRAND.accent, BRAND.warning, BRAND.chartMuted];

const categoryColors = {
  transport: BRAND.info,
  accommodation: BRAND.ink,
  dining: BRAND.warning,
  attraction: BRAND.success,
  activity: BRAND.accent,
  shopping: BRAND.warning,
  rest: BRAND.chartMuted,
  other: BRAND.chartMuted,
};

export default function BudgetView() {
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [tripsData, itemsData] = await Promise.all([
        backend.entities.Trip.list("-start_date", 20),
        backend.entities.ItineraryItem.list("-created_at", 200),
      ]);
      setTrips(tripsData.filter(t => t.budget_total > 0));
      setItems(itemsData);
      setLoading(false);
    };
    load();
  }, []);

  const getTripItems = (tripId) => items.filter(i => i.trip_id === tripId && i.budget > 0);

  const getCategoryBreakdown = (tripId) => {
    const tripItems = getTripItems(tripId);
    const map = {};
    tripItems.forEach(i => {
      map[i.category || "other"] = (map[i.category || "other"] || 0) + i.budget;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  const getSpent = (tripId) => getTripItems(tripId).reduce((s, i) => s + i.budget, 0);

  const focusTrip = selectedTrip ? trips.find(t => t.id === selectedTrip) : null;
  const breakdown = focusTrip ? getCategoryBreakdown(focusTrip.id) : [];
  const spent = focusTrip ? getSpent(focusTrip.id) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-fade-in pb-28">
      <PageHeader title="Budget Tracker" subtitle="Monitor your travel expenses" showBack />

      {/* Trip selector */}
      <div className="px-6 mb-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {trips.map(t => (
            <button key={t.id}
              onClick={() => setSelectedTrip(t.id === selectedTrip ? null : t.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedTrip === t.id ? "bg-accent-soft text-accent-strong" : "bg-card shadow-card text-muted"
              }`}>
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {focusTrip && (
        <>
          {/* Budget summary */}
          <div className="px-6 mb-4">
            <GlassCard className="p-5">
              <h3 className="text-sm font-display font-semibold text-foreground mb-4">{focusTrip.title}</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center min-w-0">
                  <p className="text-[10px] text-muted mb-1">Budget</p>
                  <p className="stat-value text-[15px] font-display font-bold text-foreground">{formatIDR(focusTrip.budget_total)}</p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-[10px] text-muted mb-1">Planned</p>
                  <p className="stat-value text-[15px] font-display font-bold text-accent-strong">{formatIDR(spent)}</p>
                </div>
                <div className="text-center min-w-0">
                  <p className="text-[10px] text-muted mb-1">Remaining</p>
                  <p className={`stat-value text-[15px] font-display font-bold ${focusTrip.budget_total - spent >= 0 ? "text-emerald-600" : "text-accent-strong"}`}>
                    {formatIDR(focusTrip.budget_total - spent)}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-accent rounded-full transition-all"
                  style={{ width: `${Math.min(100, (spent / focusTrip.budget_total) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-muted mt-1 text-right">
                {Math.round((spent / focusTrip.budget_total) * 100)}% used
              </p>
            </GlassCard>
          </div>

          {/* Pie chart */}
          {breakdown.length > 0 && (
            <div className="px-6 mb-4">
              <GlassCard className="p-5">
                <h4 className="text-xs font-semibold text-body uppercase tracking-widest mb-4">By Category</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      dataKey="value" paddingAngle={3}>
                      {breakdown.map((entry, i) => (
                        <Cell key={i} fill={categoryColors[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [formatIDR(v), ""]}
                      contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(15, 26, 21,0.12)", borderRadius: 12, color: BRAND.ink }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {breakdown.map((b, i) => (
                    <div key={b.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: categoryColors[b.name] || COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-muted capitalize">{b.name} {formatIDR(b.value)}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </>
      )}

      {/* All trips overview */}
      <div className="px-6">
        <h3 className="text-xs font-semibold text-body uppercase tracking-widest mb-3">All Trips</h3>
        {trips.length === 0 ? (
          <EmptyState icon={Wallet} title="No trips yet" hint="Create a trip to track its budget." />
        ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const s = getSpent(trip.id);
            const pct = trip.budget_total > 0 ? Math.min(100, (s / trip.budget_total) * 100) : 0;
            return (
              <Link key={trip.id} to={`/itinerary/${trip.id}`} className="block">
                <GlassCard className="p-4 hover:bg-surface transition-all lift">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-foreground truncate min-w-0">{trip.title}</h4>
                    <span className="stat-value text-xs text-accent-strong font-display shrink-0">{formatIDR(trip.budget_total)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-accent to-accent rounded-full"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-muted mt-1">{formatIDR(s)} planned · {Math.round(pct)}% of budget</p>
                </GlassCard>
              </Link>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}