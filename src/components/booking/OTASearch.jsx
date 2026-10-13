import { useState, useEffect, useRef } from "react";
import { backend } from "@/api/backend";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Ticket, Search, MapPin, Users, ArrowRight, ArrowUpDown, Loader2, Star, Clock, Minus, Plus, PlaneTakeoff, PlaneLanding } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "../GlassCard";
import DateTimePicker, { DateRangePicker } from "../DateTimePicker";
import LocationPicker from "./LocationPicker";
import { formatIDR } from "@/lib/currency";
import { DEFAULT_OTA_CATEGORIES, iconFor } from "@/data/otaCategories";

const MY_BOOKINGS_TAB = { key: "my_bookings", label: "My Bookings", icon: Ticket };
// Tabs that search a route (origin to destination) rather than one place.
const ROUTE_TABS = new Set(["flight", "train", "bus", "ship"]);
const todayISO = () => new Date().toLocaleDateString("en-CA");

// Booking an option navigates to checkout, which unmounts this component.
// The search is kept in sessionStorage so coming back shows the same results
// instead of an empty form the traveller has to fill in and re-run.
const SEARCH_KEY = "ota:search";

function readSearch() {
  try {
    const raw = sessionStorage.getItem(SEARCH_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

const statusColors = {
  pending: "bg-accent/10 text-accent-strong border-accent/20",
  confirmed: "bg-success-soft text-success border-emerald-500/20",
  cancelled: "bg-accent-soft text-accent-strong border-red-500/20",
  completed: "bg-info-soft text-info border-blue-500/20",
};

export default function OTASearch({ onSaveBooking, defaultTo = "", tripId = null, defaultTab = "my_bookings", showMyBookings = true }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const savingRef = useRef(false);
  // Read once, on mount. A saved search only belongs to the screen it was run
  // on, so it is ignored when the destination this component was opened with
  // has changed.
  const [restored] = useState(() => {
    const saved = readSearch();
    return saved && saved.context === defaultTo ? saved : null;
  });
  const [cats, setCats] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = restored?.activeTab;
    return tab && (showMyBookings || tab !== "my_bookings") ? tab : defaultTab;
  });

  // Categories are managed in the dashboard (OtaCategory) and drive these tabs.
  // Each tab's key is the category's `behavior`, so the built-in search/book
  // flows below stay unchanged and new categories reuse a built-in flow.
  useEffect(() => {
    backend.entities.OtaCategory.list("order", 50)
      .then((rows) => setCats((rows || []).length ? rows : DEFAULT_OTA_CATEGORIES))
      .catch(() => setCats(DEFAULT_OTA_CATEGORIES));
  }, []);
  const categoryTabs = (cats || DEFAULT_OTA_CATEGORIES)
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((c) => ({ key: c.behavior || c.key, label: c.label, icon: iconFor(c.icon), uid: c.id || c.key }));
  const visibleTabs = showMyBookings ? [MY_BOOKINGS_TAB, ...categoryTabs] : categoryTabs;
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [form, setForm] = useState(() => ({
    from: "", to: defaultTo, checkin: "", checkout: "", guests: 1, date: "",
    ...(restored?.form && typeof restored.form === "object" ? restored.form : {}),
  }));
  const [results, setResults] = useState(() => (Array.isArray(restored?.results) ? restored.results : []));
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(() => !!restored?.searched);

  // Keep the stored search in step with what's on screen.
  useEffect(() => {
    try {
      sessionStorage.setItem(SEARCH_KEY, JSON.stringify({ context: defaultTo, activeTab, form, results, searched }));
    } catch {
      /* ignore — storage is a convenience, never a requirement */
    }
  }, [defaultTo, activeTab, form, results, searched]);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [spun, setSpun] = useState(false);
  const swap = () => {
    setForm((p) => ({ ...p, from: p.to, to: p.from }));
    setSpun((v) => !v);
  };
  const guestNoun = activeTab === "hotel" ? "Guests" : activeTab === "attraction" ? "Visitors" : "Passengers";

  const loadMyBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await backend.entities.Booking.list("-created_at", 50);
      setMyBookings(data || []);
    } catch {
      setMyBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => { loadMyBookings(); }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setResults([]);
    setSearched(false);
    if (key === "my_bookings") loadMyBookings();
  };

  const handleSearch = async () => {
    if (!form.to && !form.from) return;
    setLoading(true);
    setResults([]);
    setSearched(false);

    let prompt = "";
    if (activeTab === "flight") {
      prompt = `Generate 5 realistic flight options from ${form.from || "Jakarta"} to ${form.to} on ${form.date || "a travel date"} for ${form.guests} passenger(s). Return as JSON array with fields: airline, flight_number, departure_time, arrival_time, duration, price (number IDR), class (Economy/Business), stops (0=direct), available_seats.`;
    } else if (activeTab === "hotel") {
      prompt = `Generate 5 realistic hotel options in ${form.to} for ${form.guests} guest(s), check-in ${form.checkin || "travel date"}, check-out ${form.checkout || "next week"}. Return as JSON array with fields: name, location, rating (1-5), price_per_night (number IDR), amenities (array of 3 strings), room_type, image_keyword (one word for the hotel style e.g. "resort" "boutique" "luxury").`;
    } else if (activeTab === "train") {
      prompt = `Generate 5 realistic train options from ${form.from || "Jakarta"} to ${form.to} on ${form.date || "a travel date"} for ${form.guests} passenger(s). Return as JSON array with fields: operator, train_name, departure_time, arrival_time, duration, price (number IDR), class (Economy/Business/Executive), available_seats.`;
    } else if (activeTab === "bus") {
      prompt = `Generate 5 realistic bus options from ${form.from || "Jakarta"} to ${form.to} on ${form.date || "a travel date"} for ${form.guests} passenger(s). Return as JSON array with fields: operator, bus_type (e.g. Express/Luxury/Sleeper), departure_time, arrival_time, duration, price (number IDR), available_seats, amenities (array of 2 strings).`;
    } else if (activeTab === "ship") {
      prompt = `Generate 5 realistic ferry or cruise ship options from ${form.from || "a port"} to ${form.to} on ${form.date || "a travel date"} for ${form.guests} passenger(s). Return as JSON array with fields: operator, ship_name, ship_type (Ferry/Cruise/Speedboat), departure_time, arrival_time, duration, price (number IDR), class (Economy/Business/VIP), available_seats.`;
    } else if (activeTab === "car_rental") {
      prompt = `Generate 5 realistic car rental options in ${form.to || form.from || "the destination"} from ${form.checkin || form.date || "pickup date"} to ${form.checkout || "return date"} for ${form.guests} person(s). Return as JSON array with fields: provider, car_name, car_type (Economy/SUV/Luxury/Van), seats, price_per_day (number IDR), transmission (Auto/Manual), features (array of 3 strings), mileage (Unlimited or limited).`;
    } else if (activeTab === "attraction") {
      prompt = `Generate 5 realistic tourist attractions or activities in ${form.to || form.from || "the destination"} on ${form.date || "a visit date"} for ${form.guests} person(s). Return as JSON array with fields: name, location, category (Museum/Theme Park/Tour/Adventure/Cultural/Nature), duration_hours (number), price_per_person (number IDR), rating (number 1-5), description (one sentence), includes (array of 2 strings).`;
    }

    try {
      const res = await backend.ask({
        prompt,
        schema: {
          type: "object",
          properties: { results: { type: "array", items: { type: "object" } } }
        }
      });
      setResults(res.results || []);
      setSearched(true);
    } catch {
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const safeDate = (dateStr, timeStr) => {
    try {
      if (!dateStr) return undefined;
      const d = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr);
      if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return undefined;
      return d.toISOString();
    } catch { return undefined; }
  };

  const handleBook = async (item) => {
   let bookingData = {};
   if (activeTab === "flight") {
     bookingData = { type: "flight", title: `${item.airline} — ${form.from} → ${form.to}`, provider: item.airline, check_in: safeDate(form.date, item.departure_time), location: `${form.from} → ${form.to}`, price: item.price, currency: "IDR", status: "pending", guests: form.guests, notes: `Flight ${item.flight_number} · ${item.class} · ${item.stops === 0 ? "Direct" : item.stops + " stop(s)"}` };
   } else if (activeTab === "hotel") {
     bookingData = { type: "hotel", title: item.name, provider: item.name, check_in: safeDate(form.checkin), check_out: safeDate(form.checkout), location: item.location || form.to, price: item.price_per_night, currency: "IDR", status: "pending", guests: form.guests, notes: `${item.room_type} · ${item.amenities?.join(", ")}` };
   } else if (activeTab === "train") {
     bookingData = { type: "train", title: `${item.operator} — ${form.from} → ${form.to}`, provider: item.operator, check_in: safeDate(form.date, item.departure_time), location: `${form.from} → ${form.to}`, price: item.price, currency: "IDR", status: "pending", guests: form.guests, notes: `${item.train_name} · ${item.class}` };
   } else if (activeTab === "bus") {
     bookingData = { type: "bus", title: `${item.operator} — ${form.from} → ${form.to}`, provider: item.operator, check_in: safeDate(form.date, item.departure_time), location: `${form.from} → ${form.to}`, price: item.price, currency: "IDR", status: "pending", guests: form.guests, notes: `${item.bus_type} · ${item.amenities?.join(", ")}` };
   } else if (activeTab === "ship") {
     bookingData = { type: "ship", title: `${item.operator} — ${form.from} → ${form.to}`, provider: item.operator, check_in: safeDate(form.date, item.departure_time), location: `${form.from} → ${form.to}`, price: item.price, currency: "IDR", status: "pending", guests: form.guests, notes: `${item.ship_name} · ${item.ship_type} · ${item.class}` };
   } else if (activeTab === "car_rental") {
     bookingData = { type: "car_rental", title: `${item.provider} — ${item.car_name}`, provider: item.provider, check_in: safeDate(form.checkin), check_out: safeDate(form.checkout), location: form.to || form.from, price: item.price_per_day, currency: "IDR", status: "pending", guests: form.guests, notes: `${item.car_type} · ${item.transmission} · ${item.mileage} · ${item.features?.join(", ")}` };
   } else if (activeTab === "attraction") {
     bookingData = { type: "attraction", title: item.name, provider: item.name, check_in: safeDate(form.date), location: item.location, price: item.price_per_person, currency: "IDR", status: "pending", guests: form.guests, notes: `${item.category} · ${item.duration_hours}h · ${item.includes?.join(", ")}` };
   }
   if (savingRef.current) return;
   savingRef.current = true;
   try {
     const created = await backend.entities.Booking.create({ ...bookingData, ...(tripId ? { trip_id: tripId } : {}) });
     queryClient.invalidateQueries({ queryKey: ["bookings"] });
     if (onSaveBooking) onSaveBooking();
     toast.success("Booking created — continue to checkout.");
     navigate(`/booking/${created.id}/checkout`);
   } catch {
     toast.error("Couldn't start booking. Please try again.");
   } finally {
     savingRef.current = false;
   }
  };

  return (
    <div className="px-6 mb-8">
      {/* Tab selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.uid || t.key} onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${activeTab === t.key ? "bg-accent-soft text-accent-strong" : "bg-card shadow-card text-muted"}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* My Bookings */}
      {activeTab === "my_bookings" && (
        <div className="space-y-3">
          {loadingBookings ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent-strong" /></div>
          ) : myBookings.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Ticket className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No bookings yet</p>
            </GlassCard>
          ) : (
            myBookings.map((b) => (
              <GlassCard key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">{b.title}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${statusColors[b.status] || statusColors.pending}`}>{b.status}</span>
                </div>
                <p className="text-xs text-muted">{b.provider}{b.location ? ` · ${b.location}` : ""}</p>
                {b.price > 0 && <p className="text-sm font-display font-bold text-accent-strong mt-1.5">{formatIDR(b.price)}</p>}
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Search form */}
      {activeTab !== "my_bookings" && (
        <GlassCard className="p-4 space-y-2">
          {ROUTE_TABS.has(activeTab) ? (
            <div className="relative space-y-2">
              <LocationPicker mode={activeTab} label="From" icon={activeTab === "flight" ? PlaneTakeoff : MapPin} value={form.from} onChange={(v) => upd("from", v)} placeholder="Where from?" exclude={form.to} />
              <LocationPicker mode={activeTab} label="To" icon={activeTab === "flight" ? PlaneLanding : MapPin} value={form.to} onChange={(v) => upd("to", v)} placeholder="Where to?" exclude={form.from} />
              <button
                type="button"
                onClick={swap}
                aria-label="Swap origin and destination"
                className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card text-accent-strong shadow-card ring-1 ring-border transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              >
                <ArrowUpDown className={`size-4 transition-transform duration-300 ${spun ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <LocationPicker
              mode={activeTab}
              label={activeTab === "car_rental" ? "Pickup location" : "Destination"}
              value={form.to}
              onChange={(v) => upd("to", v)}
              placeholder={activeTab === "hotel" ? "City, area or hotel" : activeTab === "car_rental" ? "City or airport" : "City or destination"}
            />
          )}

          {activeTab === "hotel" || activeTab === "car_rental" ? (
            <DateRangePicker
              from={form.checkin}
              to={form.checkout}
              onChange={({ from, to }) => setForm((p) => ({ ...p, checkin: from, checkout: to }))}
              labels={activeTab === "car_rental" ? ["Pickup", "Return"] : ["Check-in", "Check-out"]}
              unit={activeTab === "car_rental" ? "day" : "night"}
            />
          ) : (
            <DateTimePicker type="date" caption={activeTab === "attraction" ? "Visit date" : "Departure date"} value={form.date} onChange={(v) => upd("date", v)} min={todayISO()} />
          )}

          <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-3 py-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card shadow-card">
              <Users className="size-4 text-accent" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="eyebrow block">{guestNoun}</span>
              <span className="block text-sm font-semibold tabular-nums text-foreground" aria-live="polite">{form.guests} {guestNoun.toLowerCase().slice(0, form.guests > 1 ? undefined : -1)}</span>
            </span>
            {[[Minus, -1, `Fewer ${guestNoun.toLowerCase()}`, form.guests <= 1], [Plus, 1, `More ${guestNoun.toLowerCase()}`, form.guests >= 9]].map(([Icon, step, aria, off]) => (
              <button
                key={step}
                type="button"
                onClick={() => upd("guests", form.guests + step)}
                disabled={off}
                aria-label={aria}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-card transition-colors hover:bg-surface disabled:opacity-40 disabled:hover:bg-card"
              >
                <Icon className="size-4" aria-hidden="true" />
              </button>
            ))}
          </div>

          <button onClick={handleSearch} disabled={loading || (!form.to && !form.from)}
            className="!mt-3 w-full py-3 bg-accent-strong rounded-xl text-sm font-semibold text-white shadow-glow hover:bg-accent-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2 sheen">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Searching..." : `Search ${visibleTabs.find(t => t.key === activeTab)?.label || ""}s`}
          </button>
        </GlassCard>
      )}

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted">No results found. Try a different search.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-xs font-semibold text-body uppercase tracking-widest">{results.length} Results Found</h3>
          {results.map((item, i) => (
            <GlassCard key={i} className="p-4">
              {activeTab === "flight" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.airline}</p>
                      <p className="text-[10px] text-muted">{item.flight_number} · {item.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-accent-strong">{formatIDR(item.price)}</p>
                      <p className="text-[10px] text-muted">per person</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-foreground">{item.departure_time}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-px flex-1 bg-surface" />
                      <span className="text-[10px] text-muted">{item.stops === 0 ? "Direct" : `${item.stops} stop`}</span>
                      <div className="h-px flex-1 bg-surface" />
                    </div>
                    <span className="text-sm font-bold text-foreground">{item.arrival_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted"><Clock className="w-3 h-3" />{item.duration}</span>
                    <button onClick={() => handleBook(item)} className="px-4 py-1.5 bg-accent-soft rounded-lg text-xs font-semibold text-accent-strong hover:shadow-glow transition-all">Book Now</button>
                  </div>
                </div>
              )}

              {activeTab === "hotel" && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{item.location}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: Math.round(item.rating || 4) }).map((_, j) => (
                          <Star key={j} className="w-2.5 h-2.5 text-accent-strong fill-accent" />
                        ))}
                        <span className="text-[10px] text-muted ml-1">{item.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-accent-strong">{formatIDR(item.price_per_night)}</p>
                      <p className="text-[10px] text-muted">/ night</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted mb-3">{item.room_type} · {item.amenities?.join(" · ")}</p>
                  <button onClick={() => handleBook(item)} className="w-full py-2 bg-accent-strong rounded-lg text-xs font-semibold text-white shadow-glow hover:bg-accent-dark transition-all">Reserve Now</button>
                </div>
              )}

              {(activeTab === "train" || activeTab === "bus" || activeTab === "ship") && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.operator}</p>
                      <p className="text-[10px] text-muted">{item.train_name || item.bus_type || item.ship_name} · {item.class || item.ship_type || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-accent-strong">{formatIDR(item.price)}</p>
                      <p className="text-[10px] text-muted">per person</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-foreground">{item.departure_time}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-px flex-1 bg-surface" />
                      <ArrowRight className="w-3 h-3 text-muted" />
                      <div className="h-px flex-1 bg-surface" />
                    </div>
                    <span className="text-sm font-bold text-foreground">{item.arrival_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted"><Clock className="w-3 h-3" />{item.duration}</span>
                    <button onClick={() => handleBook(item)} className="px-4 py-1.5 bg-accent-soft rounded-lg text-xs font-semibold text-accent-strong hover:shadow-glow transition-all">Book Now</button>
                  </div>
                </div>
              )}

              {activeTab === "car_rental" && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.car_name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{item.provider} · {item.car_type} · {item.transmission}</p>
                      <p className="text-[10px] text-muted mt-0.5">{item.seats} seats · {item.mileage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-accent-strong">{formatIDR(item.price_per_day)}</p>
                      <p className="text-[10px] text-muted">/ day</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted mb-3">{item.features?.join(" · ")}</p>
                  <button onClick={() => handleBook(item)} className="w-full py-2 bg-accent-strong rounded-lg text-xs font-semibold text-white shadow-glow hover:bg-accent-dark transition-all">Rent Now</button>
                </div>
              )}

              {activeTab === "attraction" && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{item.location} · {item.category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: Math.round(item.rating || 4) }).map((_, j) => (
                          <Star key={j} className="w-2.5 h-2.5 text-accent-strong fill-accent" />
                        ))}
                        <span className="text-[10px] text-muted ml-1">{item.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-accent-strong">{formatIDR(item.price_per_person)}</p>
                      <p className="text-[10px] text-muted">/ person</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted mb-2 leading-relaxed">{item.description}</p>
                  <p className="text-xs text-muted mb-3"><Clock className="w-3 h-3 inline mr-1" />{item.duration_hours}h · Includes: {item.includes?.join(", ")}</p>
                  <button onClick={() => handleBook(item)} className="w-full py-2 bg-accent-strong rounded-lg text-xs font-semibold text-white shadow-glow hover:bg-accent-dark transition-all">Book Activity</button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}