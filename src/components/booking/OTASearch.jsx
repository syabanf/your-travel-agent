import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Plane, Building2, Train, Bus, Ship, Car, Ticket, Search, MapPin, Calendar, Users, ArrowRight, Loader2, Star, Clock } from "lucide-react";
import GlassCard from "../GlassCard";
import DateTimePicker from "../DateTimePicker";
import { formatIDR } from "@/lib/currency";

const tabs = [
  { key: "my_bookings", label: "My Bookings", icon: Ticket },
  { key: "flight", label: "Flight", icon: Plane },
  { key: "hotel", label: "Hotel", icon: Building2 },
  { key: "train", label: "Train", icon: Train },
  { key: "bus", label: "Bus", icon: Bus },
  { key: "ship", label: "Ship", icon: Ship },
  { key: "car_rental", label: "Rental", icon: Car },
  { key: "attraction", label: "Attraction", icon: Ticket },
];

const statusColors = {
  pending: "bg-[#A5997E]/15 text-gold border-[#A5997E]/20",
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function OTASearch({ onSaveBooking }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("my_bookings");
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [form, setForm] = useState({
    from: "", to: "", checkin: "", checkout: "", guests: 1, date: ""
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const loadMyBookings = async () => {
    setLoadingBookings(true);
    const data = await base44.entities.Booking.list("-created_date", 50);
    setMyBookings(data);
    setLoadingBookings(false);
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

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: { results: { type: "array", items: { type: "object" } } }
      }
    });
    setResults(res.results || []);
    setLoading(false);
    setSearched(true);
  };

  const safeDate = (dateStr, timeStr) => {
    try {
      if (!dateStr) return undefined;
      const d = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
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
   await base44.entities.Booking.create(bookingData);
   queryClient.invalidateQueries({ queryKey: ["bookings"] });
   if (onSaveBooking) onSaveBooking();
   loadMyBookings();
   alert("Booking saved to your reservations!");
  };

  return (
    <div className="px-6 mb-8">
      {/* Tab selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all ${activeTab === key ? "glass-gold text-gold" : "glass-light text-mora-neutral/60"}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* My Bookings */}
      {activeTab === "my_bookings" && (
        <div className="space-y-3">
          {loadingBookings ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gold" /></div>
          ) : myBookings.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Ticket className="w-8 h-8 text-mora-neutral/30 mx-auto mb-2" />
              <p className="text-sm text-mora-neutral/50">No bookings yet</p>
            </GlassCard>
          ) : (
            myBookings.map((b) => (
              <GlassCard key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-mora-white">{b.title}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border flex-shrink-0 capitalize ${statusColors[b.status] || statusColors.pending}`}>{b.status}</span>
                </div>
                <p className="text-xs text-mora-neutral/50">{b.provider}{b.location ? ` · ${b.location}` : ""}</p>
                {b.price > 0 && <p className="text-sm font-display font-bold text-gold mt-1.5">{formatIDR(b.price)}</p>}
              </GlassCard>
            ))
          )}
        </div>
      )}

      {/* Search form */}
      {activeTab !== "my_bookings" && (
        <GlassCard className="p-4 space-y-3">
          {/* From / To */}
          <div className={`grid gap-3 ${(activeTab === "hotel" || activeTab === "car_rental" || activeTab === "attraction") ? "grid-cols-1" : "grid-cols-2"}`}>
            {activeTab !== "hotel" && activeTab !== "car_rental" && activeTab !== "attraction" && (
              <div>
                <label className="text-[10px] text-gold uppercase tracking-widest mb-1 block">From</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold/40" />
                  <input value={form.from} onChange={e => upd("from", e.target.value)}
                    placeholder="Origin"
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-10 pl-8 pr-3 text-sm text-mora-white placeholder:text-mora-neutral/30 outline-none" />
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] text-gold uppercase tracking-widest mb-1 block">
                {activeTab === "hotel" ? "Destination" : activeTab === "car_rental" ? "Pickup Location" : activeTab === "attraction" ? "Destination" : "To"}
              </label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold/40" />
                <input value={form.to} onChange={e => upd("to", e.target.value)}
                  placeholder={activeTab === "hotel" ? "City or area" : activeTab === "car_rental" ? "City or airport" : activeTab === "attraction" ? "City or destination" : "Destination"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-10 pl-8 pr-3 text-sm text-mora-white placeholder:text-mora-neutral/30 outline-none" />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            {(activeTab === "hotel" || activeTab === "car_rental") ? (
                <>
                  <DateTimePicker 
                    type="date"
                    value={form.checkin}
                    onChange={v => upd("checkin", v)}
                    label={activeTab === "car_rental" ? "Pickup Date" : "Check-in"}
                  />
                  <DateTimePicker 
                    type="date"
                    value={form.checkout}
                    onChange={v => upd("checkout", v)}
                    label={activeTab === "car_rental" ? "Return Date" : "Check-out"}
                  />
                </>
              ) : (
                <DateTimePicker 
                  type="date"
                  value={form.date}
                  onChange={v => upd("date", v)}
                  label="Travel Date"
                />
              )}
            <div className={(activeTab === "hotel" || activeTab === "car_rental") ? "hidden" : ""}>
              <label className="text-[10px] text-gold uppercase tracking-widest mb-1 block">{activeTab === "attraction" ? "Visitors" : "Passengers"}</label>
              <div className="relative">
                <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold/40" />
                <input type="number" min={1} max={9} value={form.guests} onChange={e => upd("guests", Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-10 pl-8 pr-3 text-sm text-mora-white outline-none" />
              </div>
            </div>
            {(activeTab === "hotel" || activeTab === "car_rental") && (
              <div className="col-span-2">
                <label className="text-[10px] text-gold uppercase tracking-widest mb-1 block">{activeTab === "car_rental" ? "Passengers" : "Guests"}</label>
                <div className="relative">
                  <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold/40" />
                  <input type="number" min={1} max={9} value={form.guests} onChange={e => upd("guests", Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-10 pl-8 pr-3 text-sm text-mora-white outline-none" />
                </div>
              </div>
            )}
          </div>

          <button onClick={handleSearch} disabled={loading || (!form.to && !form.from)}
            className="w-full py-3 glass-gold rounded-xl text-sm font-semibold text-gold hover:glow-gold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Searching..." : `Search ${tabs.find(t => t.key === activeTab)?.label}s`}
          </button>
        </GlassCard>
      )}

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="mt-4 text-center">
          <p className="text-sm text-mora-neutral/50">No results found. Try a different search.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-xs font-semibold text-mora-white/70 uppercase tracking-widest">{results.length} Results Found</h3>
          {results.map((item, i) => (
            <GlassCard key={i} className="p-4">
              {activeTab === "flight" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-mora-white">{item.airline}</p>
                      <p className="text-[10px] text-mora-neutral/50">{item.flight_number} · {item.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-gold">{formatIDR(item.price)}</p>
                      <p className="text-[10px] text-mora-neutral/40">per person</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-mora-white">{item.departure_time}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[10px] text-mora-neutral/40">{item.stops === 0 ? "Direct" : `${item.stops} stop`}</span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <span className="text-sm font-bold text-mora-white">{item.arrival_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-mora-neutral/50"><Clock className="w-3 h-3" />{item.duration}</span>
                    <button onClick={() => handleBook(item)} className="px-4 py-1.5 glass-gold rounded-lg text-xs font-semibold text-gold hover:glow-gold transition-all">Book Now</button>
                  </div>
                </div>
              )}

              {activeTab === "hotel" && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-mora-white">{item.name}</p>
                      <p className="text-[10px] text-mora-neutral/50 mt-0.5">{item.location}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: Math.round(item.rating || 4) }).map((_, j) => (
                          <Star key={j} className="w-2.5 h-2.5 text-gold fill-gold" />
                        ))}
                        <span className="text-[10px] text-mora-neutral/50 ml-1">{item.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-gold">{formatIDR(item.price_per_night)}</p>
                      <p className="text-[10px] text-mora-neutral/40">/ night</p>
                    </div>
                  </div>
                  <p className="text-xs text-mora-neutral/50 mb-3">{item.room_type} · {item.amenities?.join(" · ")}</p>
                  <button onClick={() => handleBook(item)} className="w-full py-2 glass-gold rounded-lg text-xs font-semibold text-gold hover:glow-gold transition-all">Reserve Now</button>
                </div>
              )}

              {(activeTab === "train" || activeTab === "bus" || activeTab === "ship") && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-mora-white">{item.operator}</p>
                      <p className="text-[10px] text-mora-neutral/50">{item.train_name || item.bus_type || item.ship_name} · {item.class || item.ship_type || ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-gold">{formatIDR(item.price)}</p>
                      <p className="text-[10px] text-mora-neutral/40">per person</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold text-mora-white">{item.departure_time}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="h-px flex-1 bg-white/10" />
                      <ArrowRight className="w-3 h-3 text-mora-neutral/30" />
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    <span className="text-sm font-bold text-mora-white">{item.arrival_time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-mora-neutral/50"><Clock className="w-3 h-3" />{item.duration}</span>
                    <button onClick={() => handleBook(item)} className="px-4 py-1.5 glass-gold rounded-lg text-xs font-semibold text-gold hover:glow-gold transition-all">Book Now</button>
                  </div>
                </div>
              )}

              {activeTab === "car_rental" && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-mora-white">{item.car_name}</p>
                      <p className="text-[10px] text-mora-neutral/50 mt-0.5">{item.provider} · {item.car_type} · {item.transmission}</p>
                      <p className="text-[10px] text-mora-neutral/40 mt-0.5">{item.seats} seats · {item.mileage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-gold">{formatIDR(item.price_per_day)}</p>
                      <p className="text-[10px] text-mora-neutral/40">/ day</p>
                    </div>
                  </div>
                  <p className="text-xs text-mora-neutral/50 mb-3">{item.features?.join(" · ")}</p>
                  <button onClick={() => handleBook(item)} className="w-full py-2 glass-gold rounded-lg text-xs font-semibold text-gold hover:glow-gold transition-all">Rent Now</button>
                </div>
              )}

              {activeTab === "attraction" && (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-mora-white">{item.name}</p>
                      <p className="text-[10px] text-mora-neutral/50 mt-0.5">{item.location} · {item.category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: Math.round(item.rating || 4) }).map((_, j) => (
                          <Star key={j} className="w-2.5 h-2.5 text-gold fill-gold" />
                        ))}
                        <span className="text-[10px] text-mora-neutral/50 ml-1">{item.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-display font-bold text-gold">{formatIDR(item.price_per_person)}</p>
                      <p className="text-[10px] text-mora-neutral/40">/ person</p>
                    </div>
                  </div>
                  <p className="text-xs text-mora-neutral/60 mb-2 leading-relaxed">{item.description}</p>
                  <p className="text-xs text-mora-neutral/50 mb-3"><Clock className="w-3 h-3 inline mr-1" />{item.duration_hours}h · Includes: {item.includes?.join(", ")}</p>
                  <button onClick={() => handleBook(item)} className="w-full py-2 glass-gold rounded-lg text-xs font-semibold text-gold hover:glow-gold transition-all">Book Activity</button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}