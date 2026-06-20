// Stubbed AI for the local mock backend.
//
// Replaces base44.integrations.Core.InvokeLLM with canned, schema-aware
// responses so the app's AI features work offline with no API key.
//
// To plug in a REAL provider later, call configureLLM() once at app startup:
//
//   import { configureLLM } from '@/api/mockLLM';
//   configureLLM(async ({ prompt, response_json_schema }) => {
//     // call Claude / OpenAI / your proxy here and return either a string
//     // (when no schema) or an object matching response_json_schema.
//   });

import { formatIDR } from '@/lib/currency';

let handler = defaultHandler;

/**
 * Point InvokeLLM at a real LLM implementation.
 * @param {(args: {prompt?: string, response_json_schema?: object}) => (Promise<any>|any)} fn
 */
export function configureLLM(fn) {
  handler = typeof fn === 'function' ? fn : defaultHandler;
}

export async function invokeLLM(args = {}) {
  return handler(args);
}

/* ------------------------------------------------------------------ */
/* default (stub) implementation                                       */
/* ------------------------------------------------------------------ */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const money = (min, max) => Math.round(rand(min, max) / 50000) * 50000; // clean IDR (nearest 50k)
const pick = (arr, i) => arr[((i == null ? rand(0, arr.length - 1) : i) % arr.length + arr.length) % arr.length];
const cap = (s) => (s || '').replace(/\b\w/g, (c) => c.toUpperCase());

async function defaultHandler({ prompt = '', response_json_schema } = {}) {
  await wait(rand(500, 1100)); // simulate latency

  // No schema => free-form chat / markdown itinerary
  if (!response_json_schema) return chatResponse(prompt);

  // OTA search shape: { results: [...] }
  if (response_json_schema?.properties?.results) {
    return { results: otaResults(prompt) };
  }

  // Everything else: synthesize an object from the JSON schema
  return buildFromSchema(response_json_schema, makeCtx(prompt));
}

/* ------------------------------ context ---------------------------- */

function makeCtx(prompt) {
  return { prompt, dest: parseDestination(prompt), days: parseDays(prompt), i: 0 };
}

function parseDestination(p = '') {
  const m = p.match(
    /(?:itinerary (?:for|in)|trip to|travel to|to|in|for)\s+([A-Za-z][A-Za-z'’.\- ]{1,40}?)(?:\s+(?:from|on|for|with|over|during|based)\b|[.,\n!?]|$)/i,
  );
  const d = m ? m[1].trim().replace(/\s+/g, ' ') : '';
  return d && d.length > 1 ? d : 'your destination';
}

function parseDays(p = '') {
  const m = p.match(/(\d+)[ -]?day/i);
  const n = m ? parseInt(m[1], 10) : 3;
  return Math.min(Math.max(n, 1), 10);
}

/* ------------------------------ pools ------------------------------ */

const TIMES = ['08:30', '11:00', '13:30', '16:00', '19:30'];
const ACT_NAMES = [
  'Sunrise viewpoint hike', 'Old town walking tour', 'Local market & street food',
  'Boutique spa afternoon', 'Sunset rooftop dinner', 'Hidden beach excursion',
  'Artisan workshop visit', 'Scenic coastal drive', 'Cultural museum tour',
  'Fine-dining tasting menu',
];
const LOCATIONS = ['Old Town', 'Marina District', 'Hillside Quarter', 'Seaside Promenade', 'Arts District', 'Central Park'];
const DESCS = [
  'A handpicked experience blending comfort and local character.',
  'Unhurried, scenic, and easy on the schedule.',
  'A standout highlight travelers consistently rave about.',
  'Authentic local flavor away from the crowds.',
  'An elegant way to wind down the day.',
];
const TIPS = [
  'Book popular restaurants 2–3 days ahead — the best tables go fast.',
  'Carry a light layer; evenings near the water get breezy.',
  'Mornings are quietest at major sights — start before 9am.',
  'Keep one afternoon flexible for spontaneous discoveries.',
];

function daySlots(dest, day) {
  return [0, 1, 2].map((s) => {
    const idx = (day * 3 + s) % ACT_NAMES.length;
    return {
      time: TIMES[s % TIMES.length],
      name: ACT_NAMES[idx],
      desc: DESCS[idx % DESCS.length],
      cost: money(150000, 1800000),
    };
  });
}

function chatResponse(prompt) {
  const { dest, days } = makeCtx(prompt);
  const today = new Date();
  let out = `Here's a curated **${days}-day** itinerary for **${cap(dest)}** ✨\n\n`;
  for (let d = 1; d <= days; d++) {
    const date = new Date(today.getTime() + (d - 1) * 86400000);
    const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    out += `### Day ${d} — ${label}\n`;
    for (const s of daySlots(dest, d)) {
      out += `- **${s.time}** · ${s.name} — ${s.desc} _(≈ ${formatIDR(s.cost)})_\n`;
    }
    out += '\n';
  }
  out += `**Travel tip:** ${pick(TIPS, days)}\n\n`;
  out += `Want me to adjust the pace, add dining reservations, or tailor this to a specific budget?`;
  return out;
}

/* ------------------------- schema synthesis ------------------------ */

function buildFromSchema(schema, ctx, key) {
  if (!schema || typeof schema !== 'object') return null;
  const type = schema.type || (schema.properties ? 'object' : 'string');

  if (type === 'object') {
    const out = {};
    const props = schema.properties || {};
    for (const k of Object.keys(props)) out[k] = buildFromSchema(props[k], ctx, k);
    return out;
  }
  if (type === 'array') {
    const n = key === 'activities' ? Math.max(ctx.days * 2, 2) : 3;
    const items = [];
    for (let i = 0; i < n; i++) {
      items.push(buildFromSchema(schema.items || { type: 'string' }, { ...ctx, i }, singular(key)));
    }
    return items;
  }
  if (type === 'number' || type === 'integer') return numberFor(key, ctx);
  if (type === 'boolean') return true;
  return stringFor(key, ctx);
}

const singular = (k = '') => k.replace(/ies$/, 'y').replace(/s$/, '');

function stringFor(key = '', ctx) {
  const i = ctx.i || 0;
  const k = key.toLowerCase();
  if (k === 'title') return `${cap(ctx.dest)} ${pick(['Escape', 'Adventure', 'Discovery', 'Retreat', 'Journey'], ctx.days)}`;
  if (k === 'destination') return cap(ctx.dest);
  if (k === 'travel_style') return 'luxury';
  if (k === 'pace') return 'moderate';
  if (k === 'trip_type') return 'couple';
  if (k === 'category') return pick(['attraction', 'dining', 'activity', 'transport', 'accommodation', 'shopping'], i);
  if (k === 'time') return pick(TIMES, i);
  if (k.includes('name')) return pick(ACT_NAMES, i);
  if (k === 'location') return `${pick(LOCATIONS, i)}, ${cap(ctx.dest)}`;
  if (k === 'description' || k === 'notes' || k === 'highlights') return pick(DESCS, i);
  return '';
}

function numberFor(key = '', ctx) {
  const i = ctx.i || 0;
  const k = key.toLowerCase();
  if (k === 'day') return Math.floor(i / 2) + 1;        // 2 activities per day
  if (k === 'days') return ctx.days;
  if (k === 'travelers') return 2;
  if (k === 'duration_minutes') return pick([60, 90, 120, 150], i);
  if (k === 'budget_total') return money(15000000, 75000000);
  if (k.includes('budget') || k.includes('price') || k.includes('cost')) return money(150000, 2500000);
  if (k.includes('rating')) return 5;
  return rand(1, 5);
}

/* --------------------------- OTA results --------------------------- */

function otaResults(prompt = '') {
  const p = prompt.toLowerCase();
  if (p.includes('flight')) return flights();
  if (p.includes('hotel')) return hotels();
  if (p.includes('train')) return trains();
  if (p.includes('bus')) return buses();
  if (p.includes('ferry') || p.includes('cruise') || p.includes('ship')) return ships();
  if (p.includes('car rental') || p.includes('rental')) return cars();
  if (p.includes('attraction') || p.includes('activit') || p.includes('tour')) return attractions();
  return [];
}

const five = (fn) => Array.from({ length: 5 }, (_, i) => fn(i));
const DEP = ['06:15', '09:40', '12:20', '15:05', '18:50'];
const ARR = ['09:05', '12:25', '15:10', '18:00', '21:35'];
const DUR = ['2h 50m', '2h 45m', '2h 50m', '2h 55m', '2h 45m'];

const flights = () =>
  five((i) => ({
    airline: pick(['Garuda Indonesia', 'Singapore Airlines', 'Qatar Airways', 'Emirates', 'Cathay Pacific'], i),
    flight_number: `${pick(['GA', 'SQ', 'QR', 'EK', 'CX'], i)}${rand(100, 999)}`,
    departure_time: DEP[i], arrival_time: ARR[i], duration: DUR[i],
    price: money(1500000, 9500000), class: i % 4 === 0 ? 'Business' : 'Economy',
    stops: i % 3 === 0 ? 1 : 0, available_seats: rand(3, 40),
  }));

const hotels = () =>
  five((i) => ({
    name: pick(['The Ritz Reserve', 'Azure Bay Resort', 'Heritage Boutique', 'Cloud Nine Suites', 'Lagoon Villas'], i),
    location: pick(LOCATIONS, i),
    rating: pick([4.4, 4.6, 4.8, 4.9, 5], i),
    price_per_night: money(700000, 6500000),
    amenities: pick([['Infinity pool', 'Spa', 'Free breakfast'], ['Beachfront', 'Bar', 'Gym'], ['Rooftop', 'Concierge', 'WiFi']], i),
    room_type: pick(['Deluxe King', 'Ocean Suite', 'Garden Villa', 'Premier Room', 'Penthouse'], i),
    image_keyword: pick(['resort', 'boutique', 'luxury', 'beach', 'villa'], i),
  }));

const trains = () =>
  five((i) => ({
    operator: pick(['KAI Argo', 'JR Express', 'EuroRail', 'Bullet Line', 'Coastal Rail'], i),
    train_name: pick(['Argo Bromo', 'Nozomi', 'Le Sud', 'Skyliner', 'Seabreeze'], i),
    departure_time: DEP[i], arrival_time: ARR[i], duration: DUR[i],
    price: money(150000, 1200000), class: pick(['Economy', 'Business', 'Executive'], i), available_seats: rand(5, 60),
  }));

const buses = () =>
  five((i) => ({
    operator: pick(['Rosalia Express', 'GreenLine', 'CityHopper', 'NightRider', 'Metro Coach'], i),
    bus_type: pick(['Express', 'Luxury', 'Sleeper', 'Double-Decker', 'Standard'], i),
    departure_time: DEP[i], arrival_time: ARR[i], duration: DUR[i],
    price: money(60000, 450000), available_seats: rand(4, 45),
    amenities: pick([['WiFi', 'Reclining seats'], ['USB ports', 'Snacks'], ['AC', 'Restroom']], i),
  }));

const ships = () =>
  five((i) => ({
    operator: pick(['Blue Star', 'Aegean Lines', 'Pacific Cruises', 'IslandLink', 'Marina Ferry'], i),
    ship_name: pick(['Sea Pearl', 'Ocean Voyager', 'Blue Horizon', 'Island Star', 'Wave Dancer'], i),
    ship_type: pick(['Ferry', 'Cruise', 'Speedboat'], i),
    departure_time: DEP[i], arrival_time: ARR[i], duration: DUR[i],
    price: money(150000, 3500000), class: pick(['Economy', 'Business', 'VIP'], i), available_seats: rand(6, 120),
  }));

const cars = () =>
  five((i) => ({
    provider: pick(['Hertz', 'Avis', 'Sixt', 'Enterprise', 'Local Drive'], i),
    car_name: pick(['Toyota Avanza', 'Honda CR-V', 'Tesla Model 3', 'VW Transporter', 'Suzuki Jimny'], i),
    car_type: pick(['Economy', 'SUV', 'Luxury', 'Van', 'Compact'], i),
    seats: pick([4, 5, 5, 8, 4], i), price_per_day: money(250000, 1800000),
    transmission: i % 2 === 0 ? 'Auto' : 'Manual',
    features: pick([['GPS', 'Bluetooth', 'AC'], ['Sunroof', 'Cruise control', 'AC'], ['4WD', 'Roof rack', 'AC']], i),
    mileage: i % 2 === 0 ? 'Unlimited' : '200 km/day',
  }));

const attractions = () =>
  five((i) => ({
    name: pick(['Old Temple Tour', 'Volcano Sunrise Trek', 'Reef Snorkel Trip', 'Heritage Walk', 'Waterfall Adventure'], i),
    location: pick(LOCATIONS, i),
    category: pick(['Cultural', 'Adventure', 'Nature', 'Tour', 'Museum'], i),
    duration_hours: pick([2, 3, 4, 5, 6], i), price_per_person: money(100000, 1500000),
    rating: pick([4.3, 4.5, 4.7, 4.8, 5], i),
    description: pick(DESCS, i),
    includes: pick([['Guide', 'Transport'], ['Equipment', 'Snacks'], ['Tickets', 'Hotel pickup']], i),
  }));
