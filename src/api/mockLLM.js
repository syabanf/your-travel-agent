// Stubbed AI for the local mock backend.
//
// Backs backend.ask() with canned, schema-aware responses so the app's AI
// features work offline with no API key.
//
// To plug in a REAL provider later, call configureLLM() once at app startup:
//
//   import { configureLLM } from '@/api/mockLLM';
//   configureLLM(async ({ prompt, schema }) => {
//     // call Claude / OpenAI / your proxy here and return either a string
//     // (when no schema) or an object matching schema.
//   });

import { formatIDR } from '@/lib/currency';

let handler = defaultHandler;

/**
 * Point backend.ask() at a real LLM implementation.
 * @param {(args: {prompt?: string, schema?: object}) => (Promise<any>|any)} fn
 */
export function configureLLM(fn) {
  handler = typeof fn === 'function' ? fn : defaultHandler;
}

export async function askLLM(args = {}) {
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

async function defaultHandler({ prompt = '', schema } = {}) {
  await wait(rand(500, 1100)); // simulate latency

  // No schema => free-form chat / markdown itinerary
  if (!schema) return chatResponse(prompt);

  // AI report generator shape: { report: {...} }
  if (schema?.properties?.report) {
    return { report: reportFor(prompt) };
  }

  // OTA search shape: { results: [...] }
  if (schema?.properties?.results) {
    return { results: otaResults(prompt) };
  }

  // Everything else: synthesize an object from the JSON schema
  return buildFromSchema(schema, makeCtx(prompt));
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

/* ----------------------------- AI reports -------------------------- */
// A stubbed "analytics AI": reads the local data store and synthesises a
// structured business report from a natural-language prompt. Swap in a real
// model via configureLLM() and return the same { report } shape.

const DB_PREFIX = 'ich_db_';
function readCol(name) {
  try { return JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem(DB_PREFIX + name)) || '[]') || []; } catch { return []; }
}
const sumBy = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthOf = (d) => { try { return MONTHS[new Date(d).getMonth()]; } catch { return null; } };

function reportType(p = '') {
  const s = p.toLowerCase();
  if (/margin|revenue|sales|financ|profit|income/.test(s)) return 'financial';
  if (/supplier|partner|commission|procure|vendor/.test(s)) return 'suppliers';
  if (/lead|funnel|conversion|pipeline|enquir/.test(s)) return 'leads';
  if (/customer|tier|loyal|crm|spend|ltv/.test(s)) return 'customers';
  if (/market|campaign|email|promo|outreach/.test(s)) return 'marketing';
  if (/booking|reservation/.test(s)) return 'bookings';
  return 'overview';
}

export function reportFor(prompt = '') {
  const type = reportType(prompt);
  const bookings = readCol('Booking'), trips = readCol('Trip'), customers = readCol('Customer'),
    leads = readCol('Lead'), suppliers = readCol('Supplier'), campaigns = readCol('Campaign');
  const confirmed = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed');
  const revenue = sumBy(confirmed, (b) => b.price);
  const cost = sumBy(confirmed, (b) => b.cost_price);
  const margin = revenue - cost;
  const marginPct = revenue ? Math.round((margin / revenue) * 100) : 0;
  const sub = `Generated from your live data for: “${prompt || 'business overview'}”`;

  if (type === 'financial') {
    const byMonth = {};
    confirmed.forEach((b) => { const m = monthOf(b.check_in || b.created_at); if (m) { byMonth[m] = byMonth[m] || { n: 0, rev: 0 }; byMonth[m].n++; byMonth[m].rev += b.price || 0; } });
    const monthRows = MONTHS.filter((m) => byMonth[m]).map((m) => [m, String(byMonth[m].n), formatIDR(byMonth[m].rev)]);
    const byType = {};
    bookings.forEach((b) => { const t = b.type || 'other'; byType[t] = byType[t] || { n: 0, rev: 0 }; byType[t].n++; byType[t].rev += b.price || 0; });
    const typeRows = Object.entries(byType).sort((a, b) => b[1].rev - a[1].rev).map(([t, v]) => [cap(t), String(v.n), formatIDR(v.rev)]);
    const pend = bookings.filter((b) => b.status === 'pending').length;
    return {
      title: 'Revenue & Margin Report', subtitle: sub,
      summary: `Icon Holiday recorded ${formatIDR(revenue)} in confirmed revenue across ${confirmed.length} booking(s), at an estimated ${marginPct}% gross margin (${formatIDR(margin)}).${typeRows[0] ? ` ${typeRows[0][0]} is the highest-grossing category.` : ''}`,
      kpis: [
        { label: 'Confirmed revenue', value: formatIDR(revenue) },
        { label: 'Gross margin', value: `${formatIDR(margin)} · ${marginPct}%` },
        { label: 'Avg booking value', value: formatIDR(confirmed.length ? Math.round(revenue / confirmed.length) : 0) },
        { label: 'Confirmed bookings', value: String(confirmed.length) },
      ],
      tables: [
        { title: 'Revenue by month', columns: ['Month', 'Bookings', 'Revenue'], rows: monthRows.length ? monthRows : [['—', '0', formatIDR(0)]] },
        { title: 'Revenue by type', columns: ['Type', 'Count', 'Revenue'], rows: typeRows.length ? typeRows : [['—', '0', formatIDR(0)]] },
      ],
      recommendations: [
        marginPct < 20 ? `Gross margin is ${marginPct}% — renegotiate supplier rates or lift markups on low-margin products.` : `Gross margin is healthy at ${marginPct}% — protect it as volume grows.`,
        typeRows[0] ? `Lean into ${typeRows[0][0]} — your top category by revenue; build a targeted promotion around it.` : 'Add more bookings to reveal category trends.',
        pend ? `${pend} pending booking(s) await confirmation — chase them to bank the revenue.` : 'No pending bookings outstanding.',
      ],
    };
  }

  if (type === 'suppliers') {
    const map = Object.fromEntries(suppliers.map((s) => [s.id, s]));
    const agg = {};
    bookings.forEach((b) => { if (!b.supplier_id) return; const s = map[b.supplier_id]; const k = b.supplier_id; agg[k] = agg[k] || { name: s?.name || k, n: 0, sales: 0, comm: 0 }; agg[k].n++; agg[k].sales += b.price || 0; agg[k].comm += (b.price || 0) * ((s?.commission_rate || 0) / 100); });
    const list = Object.values(agg).sort((a, b) => b.sales - a.sales);
    const rows = list.map((v) => [v.name, String(v.n), formatIDR(v.sales), formatIDR(Math.round(v.comm))]);
    const totalComm = Math.round(sumBy(list, (v) => v.comm));
    const active = suppliers.filter((s) => s.status === 'active').length;
    const avgRate = suppliers.length ? Math.round(sumBy(suppliers, (s) => s.commission_rate) / suppliers.length) : 0;
    return {
      title: 'Supplier Performance Report', subtitle: sub,
      summary: `You work with ${suppliers.length} supplier(s) (${active} active), accounting for ${formatIDR(sumBy(list, (v) => v.sales))} in sourced sales and ${formatIDR(totalComm)} in estimated commission.`,
      kpis: [
        { label: 'Suppliers', value: String(suppliers.length) },
        { label: 'Active', value: String(active) },
        { label: 'Est. commission', value: formatIDR(totalComm) },
        { label: 'Avg commission rate', value: `${avgRate}%` },
      ],
      tables: [{ title: 'Performance by supplier', columns: ['Supplier', 'Bookings', 'Sales', 'Est. commission'], rows: rows.length ? rows : [['—', '0', formatIDR(0), formatIDR(0)]] }],
      recommendations: [
        list[0] ? `${list[0].name} is your top-producing partner — formalise preferred rates.` : 'Link bookings to suppliers to unlock partner analytics.',
        suppliers.some((s) => s.status === 'inactive') ? 'Some suppliers are inactive — review whether to re-activate or retire them.' : 'All suppliers are active.',
        'Concentrate volume with high-commission partners to grow margin.',
      ],
    };
  }

  if (type === 'leads') {
    const total = leads.length, won = leads.filter((l) => l.status === 'won').length;
    const conv = total ? Math.round((won / total) * 100) : 0;
    const pipeline = sumBy(leads.filter((l) => ['new', 'contacted', 'quoted'].includes(l.status)), (l) => l.budget);
    const stageRows = ['new', 'contacted', 'quoted', 'won', 'lost'].map((s) => [cap(s), String(leads.filter((l) => l.status === s).length)]);
    const byAgent = {};
    leads.forEach((l) => { const a = l.assigned_to || 'Unassigned'; byAgent[a] = byAgent[a] || { n: 0, won: 0 }; byAgent[a].n++; if (l.status === 'won') byAgent[a].won++; });
    const agentRows = Object.entries(byAgent).sort((a, b) => b[1].n - a[1].n).map(([a, v]) => [a, String(v.n), String(v.won), `${v.n ? Math.round((v.won / v.n) * 100) : 0}%`]);
    return {
      title: 'Sales Pipeline Report', subtitle: sub,
      summary: `You have ${total} lead(s) with a ${conv}% conversion rate. Open pipeline value is ${formatIDR(pipeline)}.`,
      kpis: [
        { label: 'Total leads', value: String(total) },
        { label: 'Won', value: String(won) },
        { label: 'Conversion', value: `${conv}%` },
        { label: 'Pipeline value', value: formatIDR(pipeline) },
      ],
      tables: [
        { title: 'Leads by stage', columns: ['Stage', 'Leads'], rows: stageRows },
        { title: 'Agent performance', columns: ['Agent', 'Leads', 'Won', 'Conversion'], rows: agentRows.length ? agentRows : [['—', '0', '0', '0%']] },
      ],
      recommendations: [
        conv < 30 ? `Conversion is ${conv}% — tighten follow-up on 'contacted' and 'quoted' leads.` : `Conversion is strong at ${conv}%.`,
        pipeline ? `${formatIDR(pipeline)} sits in open pipeline — prioritise the highest-budget enquiries.` : 'Pipeline is empty — invest in lead generation.',
        agentRows[0] ? `${agentRows[0][0]} handles the most leads — share their playbook with the team.` : 'Assign owners to every lead for accountability.',
      ],
    };
  }

  if (type === 'customers') {
    const tierRows = ['platinum', 'gold', 'silver', 'bronze'].map((t) => { const list = customers.filter((c) => c.tier === t); return [cap(t), String(list.length), formatIDR(sumBy(list, (c) => c.lifetime_spend))]; });
    const ltv = sumBy(customers, (c) => c.lifetime_spend);
    const active = customers.filter((c) => c.status === 'active').length;
    const inactive = customers.length - active;
    const top = [...customers].sort((a, b) => (b.lifetime_spend || 0) - (a.lifetime_spend || 0)).slice(0, 5).map((c) => [c.name, cap(c.tier || ''), formatIDR(c.lifetime_spend || 0)]);
    return {
      title: 'Customer Insights Report', subtitle: sub,
      summary: `Your base of ${customers.length} customer(s) (${active} active) represents ${formatIDR(ltv)} in lifetime value.`,
      kpis: [
        { label: 'Customers', value: String(customers.length) },
        { label: 'Active', value: String(active) },
        { label: 'Lifetime value', value: formatIDR(ltv) },
        { label: 'Avg LTV', value: formatIDR(customers.length ? Math.round(ltv / customers.length) : 0) },
      ],
      tables: [
        { title: 'By tier', columns: ['Tier', 'Customers', 'Lifetime value'], rows: tierRows },
        { title: 'Top customers', columns: ['Name', 'Tier', 'Lifetime spend'], rows: top.length ? top : [['—', '—', formatIDR(0)]] },
      ],
      recommendations: [
        inactive ? `${inactive} inactive customer(s) — launch a win-back campaign.` : 'All customers are active.',
        top[0] ? `${top[0][0]} is your highest-value customer — offer a VIP perk to retain them.` : 'Grow your customer base to surface VIPs.',
        'Upsell silver/bronze tiers with curated packages to lift average LTV.',
      ],
    };
  }

  if (type === 'marketing') {
    const sent = campaigns.filter((c) => c.status === 'sent');
    const reach = sumBy(campaigns, (c) => c.sent_count);
    const byChannel = {};
    campaigns.forEach((c) => { const ch = c.channel || 'other'; byChannel[ch] = byChannel[ch] || { n: 0, reach: 0 }; byChannel[ch].n++; byChannel[ch].reach += c.sent_count || 0; });
    const chanRows = Object.entries(byChannel).map(([ch, v]) => [cap(ch), String(v.n), String(v.reach)]);
    const drafts = campaigns.filter((c) => c.status === 'draft').length;
    return {
      title: 'Marketing Performance Report', subtitle: sub,
      summary: `You have ${campaigns.length} campaign(s); ${sent.length} sent, reaching ${reach} recipient(s).`,
      kpis: [
        { label: 'Campaigns', value: String(campaigns.length) },
        { label: 'Sent', value: String(sent.length) },
        { label: 'Recipients reached', value: String(reach) },
        { label: 'Scheduled', value: String(campaigns.filter((c) => c.status === 'scheduled').length) },
      ],
      tables: [{ title: 'By channel', columns: ['Channel', 'Campaigns', 'Reach'], rows: chanRows.length ? chanRows : [['—', '0', '0']] }],
      recommendations: [
        drafts ? `${drafts} draft campaign(s) — finish and schedule them.` : 'No drafts pending.',
        'Segment by tier for higher engagement — send VIP offers to platinum/gold.',
        'A/B test subject lines on your next email blast.',
      ],
    };
  }

  // overview (default)
  const openLeads = leads.filter((l) => !['won', 'lost'].includes(l.status)).length;
  const pend = bookings.filter((b) => b.status === 'pending').length;
  return {
    title: 'Business Overview Report', subtitle: sub,
    summary: `Snapshot: ${formatIDR(revenue)} confirmed revenue (${marginPct}% margin) across ${bookings.length} booking(s), ${trips.length} trip(s), ${customers.length} customer(s) and ${leads.length} lead(s).`,
    kpis: [
      { label: 'Revenue', value: formatIDR(revenue) },
      { label: 'Bookings', value: String(bookings.length) },
      { label: 'Customers', value: String(customers.length) },
      { label: 'Open leads', value: String(openLeads) },
    ],
    tables: [
      { title: 'Bookings by status', columns: ['Status', 'Count'], rows: ['pending', 'confirmed', 'completed', 'cancelled'].map((s) => [cap(s), String(bookings.filter((b) => b.status === s).length)]) },
      { title: 'Customers by tier', columns: ['Tier', 'Count'], rows: ['platinum', 'gold', 'silver', 'bronze'].map((t) => [cap(t), String(customers.filter((c) => c.tier === t).length)]) },
    ],
    recommendations: [
      openLeads ? `${openLeads} open lead(s) — keep the pipeline moving.` : 'No open leads — invest in lead generation.',
      pend ? `${pend} pending booking(s) to confirm.` : 'No pending bookings.',
      'Ask for a focused report (e.g. “revenue and margin”, “supplier commissions”, “lead funnel”) for deeper analysis.',
    ],
  };
}
