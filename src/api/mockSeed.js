// First-run demo data for the local mock backend.
// Returns records with explicit ids + ISO timestamps so relationships
// (booking.trip_id, itinerary_item.trip_id, etc.) stay consistent and
// "-created_at" / "-start_date" sorting behaves.
//
// All monetary amounts are in Indonesian Rupiah (IDR).

import { DESTINATIONS } from '@/data/destinations';
import { DEFAULT_OTA_CATEGORIES } from '@/data/otaCategories';

const DAY = 86400000;

// Geo coords for the seeded destinations (used by the map + CMS).
const DEST_COORDS = {
  bali: [-8.4095, 115.1889], kyoto: [35.0116, 135.7681], santorini: [36.3932, 25.4615],
  maldives: [3.2028, 73.2207], paris: [48.8566, 2.3522], tokyo: [35.6762, 139.6503],
  'swiss-alps': [46.8182, 8.2275], dubai: [25.2048, 55.2708], reykjavik: [64.1466, -21.9426],
  queenstown: [-45.0312, 168.6626], marrakech: [31.6295, -7.9811], phuket: [7.8804, 98.3923],
};

export function buildSeed() {
  const now = Date.now();
  const at = (offsetDays) => new Date(now + offsetDays * DAY);
  const iso = (offsetDays) => at(offsetDays).toISOString();
  const date = (offsetDays) => at(offsetDays).toISOString().slice(0, 10); // YYYY-MM-DD
  const by = 'traveler@iconholiday.app';
  const cost = (p) => Math.round((p * 0.78) / 50000) * 50000; // indicative supplier cost

  // Payment plan fields, derived from the payment_status a row already carries so
  // the numbers and the badge can never disagree. `deposit` rows sit on a DP.
  const pay = (price, payment_status, dueOffset = 14) => {
    const dp_percent = payment_status === 'deposit' ? 30 : 100;
    const paid_amount =
      payment_status === 'paid' ? price
      : payment_status === 'deposit' ? Math.round((price * dp_percent) / 100)
      : 0;
    return {
      paid_amount,
      payment_plan: payment_status === 'deposit' ? 'dp' : 'full',
      dp_percent,
      balance_due_date: paid_amount < price ? date(dueOffset) : null,
    };
  };

  const Trip = [
    {
      id: 'trip_bali', created_at: iso(-12), updated_at: iso(-1), created_by: by,
      title: 'Bali Paradise Escape', destination: 'Bali, Indonesia',
      cover_image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
      start_date: date(-2), end_date: date(5), status: 'active', travelers: 2,
      travel_style: 'luxury', budget_total: 48000000, budget_currency: 'IDR',
      notes: 'Anniversary trip — focus on beaches, spas and fine dining.',
      pace: 'moderate', trip_type: 'couple', is_ai_generated: false, customer_id: 'cust_putri',
      lead_traveler: 'Putri Wijaya', adults: 2, children: 0, accommodation_pref: 'resort',
      special_requests: 'Ocean-view room, late checkout, anniversary cake.',
    },
    {
      id: 'trip_kyoto', created_at: iso(-8), updated_at: iso(-3), created_by: by,
      title: 'Kyoto Cultural Journey', destination: 'Kyoto, Japan',
      cover_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
      start_date: date(34), end_date: date(41), status: 'planned', travelers: 2,
      travel_style: 'cultural', budget_total: 62000000, budget_currency: 'IDR',
      notes: 'Temples, tea ceremonies, and autumn gardens.',
      pace: 'relaxed', trip_type: 'couple', is_ai_generated: true, customer_id: 'cust_kenji',
      lead_traveler: 'Kenji Sato', adults: 2, children: 0, accommodation_pref: 'hotel',
      special_requests: 'Tatami room with futon, vegetarian breakfast option.',
    },
    {
      id: 'trip_santorini', created_at: iso(-4), updated_at: iso(-4), created_by: by,
      title: 'Santorini Getaway', destination: 'Santorini, Greece',
      cover_image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
      start_date: date(70), end_date: date(75), status: 'draft', travelers: 4,
      travel_style: 'relaxation', budget_total: 54000000, budget_currency: 'IDR',
      notes: 'Caldera views, white villages, sunsets in Oia.',
      pace: 'relaxed', trip_type: 'group', is_ai_generated: false, customer_id: 'cust_andi',
      lead_traveler: 'Andi Pratama', adults: 3, children: 1, accommodation_pref: 'villa',
      special_requests: 'Connecting rooms, airport transfer, cliffside sunset dinner.',
    },
    {
      // Bought as a package and only half paid, so the day-by-day detail stays
      // sealed until the balance clears. Demonstrates the trip lock.
      id: 'trip_maldives', created_at: iso(-3), updated_at: iso(-3), created_by: by,
      title: 'Maldives Signature Overwater', destination: 'Maldives',
      cover_image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
      start_date: date(30), end_date: date(37), status: 'planned', travelers: 2,
      travel_style: 'luxury', budget_total: 129000000, budget_currency: 'IDR',
      notes: 'Signature package booking — balance due before departure.',
      pace: 'relaxed', trip_type: 'couple', is_ai_generated: false, customer_id: 'cust_putri',
      lead_traveler: 'Putri Wijaya', adults: 2, children: 0, accommodation_pref: 'resort',
      special_requests: 'Overwater villa with direct lagoon access.',
      locked_until_paid: true, booking_id: 'bk_pkg_maldives', package_id: 'pkg_maldives_signature',
    },
  ];

  const Booking = [
    {
      id: 'bk_pkg_maldives', created_at: iso(-3), updated_at: iso(-3), created_by: by,
      trip_id: 'trip_maldives', type: 'package', title: 'Maldives Signature Overwater — 2 pax',
      provider: 'Icon Holiday', check_in: date(30), check_out: date(37), location: 'Maldives',
      confirmation_code: 'ICH-PKG-MV21', price: 129000000, currency: 'IDR', status: 'confirmed',
      guests: 2, notes: 'Signature package, 50% deposit received.',
      customer_id: 'cust_putri', supplier_id: 'sup_azure', cost_price: 101000000,
      payment_status: 'deposit', ...pay(129000000, 'deposit', 20), dp_percent: 50,
      paid_amount: 64500000, payment_plan: 'dp', package_id: 'pkg_maldives_signature',
      channel: 'Direct', supplier_ref: 'MV-SIG-0021', commission: 12900000,
    },
    {
      id: 'bk_flight', created_at: iso(-11), updated_at: iso(-11), created_by: by,
      trip_id: 'trip_bali', type: 'flight', title: 'Garuda Indonesia — SIN → DPS',
      provider: 'Garuda Indonesia', check_in: iso(-2), location: 'Singapore → Bali',
      confirmation_code: 'GA-7Q2K', price: 6800000, currency: 'IDR', status: 'confirmed',
      guests: 2, notes: 'GA407 · Business · Direct',
      customer_id: 'cust_putri', supplier_id: 'sup_garuda', cost_price: cost(6800000),
      payment_status: 'paid', channel: 'Direct', supplier_ref: 'GA-PNR-7Q2K', commission: Math.round(6800000 * 0.1),
      ...pay(6800000, 'paid'),
    },
    {
      id: 'bk_hotel', created_at: iso(-10), updated_at: iso(-10), created_by: by,
      trip_id: 'trip_bali', type: 'hotel', title: 'Azure Bay Resort',
      provider: 'Azure Bay Resort', check_in: iso(-2), check_out: iso(5),
      location: 'Seminyak, Bali', confirmation_code: 'AB-558210',
      price: 4200000, currency: 'IDR', status: 'confirmed', guests: 2,
      image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      notes: 'Ocean Suite · Infinity pool, Spa, Free breakfast',
      customer_id: 'cust_putri', supplier_id: 'sup_azure', cost_price: cost(4200000),
      payment_status: 'deposit', channel: 'Booking.com', supplier_ref: 'AB-558210', commission: Math.round(4200000 * 0.12),
      ...pay(4200000, 'deposit'),
    },
    {
      id: 'bk_attraction', created_at: iso(-6), updated_at: iso(-6), created_by: by,
      trip_id: 'trip_bali', type: 'attraction', title: 'Mount Batur Sunrise Trek',
      provider: 'Bali Adventures', check_in: iso(1), location: 'Kintamani, Bali',
      price: 980000, currency: 'IDR', status: 'pending', guests: 2,
      notes: 'Adventure · 6h · Guide, Transport',
      customer_id: 'cust_putri', supplier_id: 'sup_baliadv', cost_price: cost(980000),
      payment_status: 'unpaid', channel: 'Traveloka', supplier_ref: 'BA-MTB-0091', commission: Math.round(980000 * 0.15),
      ...pay(980000, 'unpaid'),
    },
  ];

  const ItineraryItem = [
    // Behind the trip lock until the Maldives balance is settled.
    { id: 'it_mv_1', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 1, time: '09:00', activity_name: 'Seaplane to the atoll', location: 'Male Airport', description: 'Meet-and-greet, then a low pass over the reefs to your villa.', duration_minutes: 120, budget: 0, reservation_required: false, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_mv_2', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 2, time: '08:30', activity_name: 'House reef snorkel & spa', location: 'Resort house reef', description: 'Guided snorkel off your own ladder, then an afternoon over the water.', duration_minutes: 180, budget: 2400000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_mv_3', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 3, time: '16:00', activity_name: 'Dolphin cruise', location: 'North Male Atoll', description: 'A late-afternoon sail out to the spinner pods.', duration_minutes: 150, budget: 3100000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_mv_4', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 4, time: '18:30', activity_name: 'Private sandbank dinner', location: 'Private sandbank', description: 'A stretch of sand, a table for two, and nothing else for miles.', duration_minutes: 180, budget: 6800000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_mv_5', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 5, time: '07:30', activity_name: 'Manta point', location: 'Cleaning station', description: 'A boat morning at the manta cleaning station.', duration_minutes: 240, budget: 4200000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_mv_6', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 6, time: '10:00', activity_name: 'Slow day', location: 'Overwater villa', description: 'Deliberately unplanned.', duration_minutes: 60, budget: 0, reservation_required: false, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_mv_7', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 7, time: '17:00', activity_name: 'Sunset fishing', location: 'Lagoon edge', description: 'Traditional handline fishing, then your catch grilled on the beach.', duration_minutes: 150, budget: 2700000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_mv_8', created_at: iso(-3), created_by: by, trip_id: 'trip_maldives', day_number: 8, time: '11:00', activity_name: 'Departure', location: 'Male Airport', description: 'Seaplane back to Male.', duration_minutes: 90, budget: 0, reservation_required: false, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_1', created_at: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 1, date: date(-2), time: '10:00', activity_name: 'Beach Club & Lunch', location: 'Seminyak Beach', description: 'Day beds, ocean swim, and a long lunch.', duration_minutes: 180, budget: 1400000, reservation_required: true, booking_status: 'confirmed', is_completed: true, category: 'dining', sort_order: 1 },
    { id: 'it_2', created_at: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 1, date: date(-2), time: '18:30', activity_name: 'Sunset at Tanah Lot', location: 'Tanah Lot Temple', description: 'Iconic sea temple at golden hour.', duration_minutes: 120, budget: 150000, reservation_required: false, booking_status: 'not_booked', is_completed: true, category: 'attraction', sort_order: 2 },
    { id: 'it_3', created_at: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 2, date: date(-1), time: '09:00', activity_name: 'Ubud Rice Terraces', location: 'Tegallalang', description: 'Walk the emerald terraces before crowds.', duration_minutes: 150, budget: 200000, reservation_required: false, booking_status: 'not_booked', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_4', created_at: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 2, date: date(-1), time: '14:00', activity_name: 'Spa Afternoon', location: 'Ubud Wellness Spa', description: 'Traditional Balinese massage and flower bath.', duration_minutes: 120, budget: 850000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 2 },
    { id: 'it_5', created_at: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 3, date: date(0), time: '04:00', activity_name: 'Mount Batur Sunrise Trek', location: 'Kintamani', description: 'Guided dawn hike to the summit.', duration_minutes: 360, budget: 980000, reservation_required: true, booking_status: 'pending', is_completed: false, category: 'attraction', sort_order: 1 },
    { id: 'it_6', created_at: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 3, date: date(0), time: '19:30', activity_name: 'Fine-Dining Tasting Menu', location: 'Jimbaran Bay', description: 'Seafood degustation by the water.', duration_minutes: 150, budget: 2600000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'dining', sort_order: 2 },
  ];

  const Notification = [
    { id: 'nt_1', created_at: iso(-0.2), created_by: by, title: 'Trek starts early tomorrow', message: 'Mount Batur Sunrise Trek pickup is at 04:00. Get some rest!', type: 'activity_reminder', is_read: false, related_trip_id: 'trip_bali' },
    { id: 'nt_2', created_at: iso(-1), created_by: by, title: 'Booking confirmed', message: 'Your stay at Azure Bay Resort is confirmed (AB-558210).', type: 'booking_update', is_read: false, related_trip_id: 'trip_bali', related_booking_id: 'bk_hotel' },
    { id: 'nt_3', created_at: iso(-2.5), created_by: by, title: 'Your concierge is ready', message: 'Maya is available to help plan your Kyoto trip.', type: 'assistant', is_read: true, related_trip_id: 'trip_kyoto' },
  ];

  const PersonalAssistant = [
    { id: 'pa_maya', created_at: iso(-30), created_by: by, name: 'Maya Tanaka', specialization: 'Luxury & Cultural Travel', photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', languages: ['English', 'Japanese', 'Indonesian'], rating: 4.9, reviews_count: 214, bio: 'Twelve years curating immersive luxury journeys across Asia.', is_available: true, hourly_rate: 650000, currency: 'IDR', specialties: ['Itinerary design', 'Fine dining', 'Hidden gems'], packages: [{ name: 'Day Planner', description: 'A bespoke single-day plan', price: 750000 }, { name: 'Full Trip', description: 'End-to-end trip concierge', price: 4500000 }] },
    { id: 'pa_leo', created_at: iso(-28), created_by: by, name: 'Leo Fernandes', specialization: 'Adventure & Outdoors', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80', languages: ['English', 'Portuguese', 'Spanish'], rating: 4.8, reviews_count: 167, bio: 'Former mountain guide — treks, dives, and off-grid escapes.', is_available: true, hourly_rate: 550000, currency: 'IDR', specialties: ['Trekking', 'Diving', 'Eco-travel'], packages: [{ name: 'Adventure Day', description: 'Adrenaline-packed day plan', price: 600000 }, { name: 'Expedition', description: 'Multi-day adventure logistics', price: 3800000 }] },
    { id: 'pa_sofia', created_at: iso(-25), created_by: by, name: 'Sofia Rossi', specialization: 'Family & Relaxation', photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80', languages: ['English', 'Italian', 'French'], rating: 4.7, reviews_count: 132, bio: 'Helping families travel smoothly and actually relax.', is_available: false, hourly_rate: 500000, currency: 'IDR', specialties: ['Family-friendly', 'Resorts', 'Slow travel'], packages: [{ name: 'Family Day', description: 'Kid-friendly day plan', price: 500000 }, { name: 'Relaxation Week', description: 'A full week, fully unwound', price: 2900000 }] },
  ];

  // Per-destination travel metadata (keyed by destination id, see DEST_COORDS above).
  const DEST_META = {
    bali: { best_season: 'Apr–Oct (dry)', currency: 'IDR', timezone: 'WITA (UTC+8)', languages: 'Indonesian, English', visa_note: 'Visa on arrival for many nationalities.' },
    kyoto: { best_season: 'Mar–May & Oct–Nov', currency: 'JPY', timezone: 'JST (UTC+9)', languages: 'Japanese', visa_note: 'Visa-free short stays for many passports.' },
    santorini: { best_season: 'May–Oct (warm, dry)', currency: 'EUR', timezone: 'EET (UTC+2)', languages: 'Greek, English', visa_note: 'Schengen visa rules apply.' },
    maldives: { best_season: 'Nov–Apr (dry)', currency: 'MVR', timezone: 'MVT (UTC+5)', languages: 'Dhivehi, English', visa_note: 'Free 30-day visa on arrival for all.' },
    paris: { best_season: 'Apr–Jun & Sep–Oct', currency: 'EUR', timezone: 'CET (UTC+1)', languages: 'French', visa_note: 'Schengen visa rules apply.' },
    tokyo: { best_season: 'Mar–May & Oct–Nov', currency: 'JPY', timezone: 'JST (UTC+9)', languages: 'Japanese', visa_note: 'Visa-free short stays for many passports.' },
    'swiss-alps': { best_season: 'Dec–Mar (ski) & Jun–Sep (hike)', currency: 'CHF', timezone: 'CET (UTC+1)', languages: 'German, French, Italian', visa_note: 'Schengen visa rules apply.' },
    dubai: { best_season: 'Nov–Mar (cooler)', currency: 'AED', timezone: 'GST (UTC+4)', languages: 'Arabic, English', visa_note: 'Visa on arrival or e-visa for many nationalities.' },
    reykjavik: { best_season: 'Jun–Aug (midnight sun)', currency: 'ISK', timezone: 'GMT (UTC+0)', languages: 'Icelandic, English', visa_note: 'Schengen visa rules apply.' },
    queenstown: { best_season: 'Dec–Feb (summer) & Jun–Aug (ski)', currency: 'NZD', timezone: 'NZST (UTC+12)', languages: 'English, Māori', visa_note: 'NZeTA required before arrival for many nationalities.' },
    marrakech: { best_season: 'Mar–May & Sep–Nov', currency: 'MAD', timezone: 'WET (UTC+1)', languages: 'Arabic, Berber, French', visa_note: 'Visa-free short stays for many passports.' },
    phuket: { best_season: 'Nov–Apr (dry)', currency: 'THB', timezone: 'ICT (UTC+7)', languages: 'Thai, English', visa_note: 'Visa exemption or visa on arrival for many nationalities.' },
  };

  const Destination = DESTINATIONS.map((d, i) => ({
    id: `dest_${d.id}`,
    created_at: iso(-50 + i), updated_at: iso(-50 + i), created_by: by,
    name: d.name, country: d.country, tagline: d.tagline, vibes: d.vibes,
    fromPrice: d.fromPrice, emoji: d.emoji, gradient: d.gradient,
    image: d.image, images: d.images || (d.image ? [d.image] : []),
    lat: DEST_COORDS[d.id] ? DEST_COORDS[d.id][0] : null,
    lng: DEST_COORDS[d.id] ? DEST_COORDS[d.id][1] : null,
    active: true,
    ...(DEST_META[d.id] || {}),
  }));

  const Promotion = [
    { id: 'promo_villas', created_at: iso(-3), created_by: by, type: 'promo', title: 'Flash Sale: Bali Villas', description: 'Up to 35% off luxury villas in Seminyak & Ubud — book before they vanish.', discount: 35, price: 2900000, valid_until: date(14), location: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', cta: 'Book now', featured: true, terms: 'New bookings only. Min. 3 nights. Subject to availability.', promo_code: 'BALI35', max_redemptions: 200, audience: 'all' },
    { id: 'promo_flights', created_at: iso(-2), created_by: by, type: 'promo', title: 'Garuda Weekend Deal', description: 'Domestic return flights from Rp 750.000. Limited seats available.', discount: 20, price: 750000, valid_until: date(7), location: 'Nationwide', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', cta: 'Find flights', featured: false, terms: 'Travel on weekends only. Non-refundable fare class.', promo_code: 'GARUDAWKND', max_redemptions: 500, audience: 'all' },
    { id: 'event_arts', created_at: iso(-5), created_by: by, type: 'event', title: 'Bali Arts Festival', description: 'A month of Balinese dance, gamelan and craft markets.', date: date(30), location: 'Denpasar, Bali', image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80', cta: 'Learn more', featured: false, terms: 'Free public event. Some performances ticketed separately.', promo_code: '', max_redemptions: 0, audience: 'all' },
    { id: 'event_jazz', created_at: iso(-6), created_by: by, type: 'event', title: 'Java Jazz Festival', description: 'Three nights of world-class jazz in the capital.', date: date(45), location: 'Jakarta', image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80', cta: 'Get tickets', featured: false, terms: 'Tickets sold via official partners. 18+ for evening sets.', promo_code: '', max_redemptions: 0, audience: 'all' },
    { id: 'news_visa', created_at: iso(-1), created_by: by, type: 'news', title: 'New visa-on-arrival countries', description: 'Indonesia adds 10 more nationalities to its visa-on-arrival list this month.', date: date(-1), location: '', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', cta: 'Read more', featured: false, terms: 'Informational only. Check official immigration guidance.', promo_code: '', max_redemptions: 0, audience: 'all' },
  ];

  const Customer = [
    { id: 'cust_putri', created_at: iso(-300), updated_at: iso(-2), created_by: by, name: 'Putri Wijaya', email: 'putri.wijaya@example.com', phone: '+62 812 1100 2200', city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, tier: 'platinum', status: 'active', lifetime_spend: 86500000, joined_date: date(-300), notes: 'Frequent business traveler — prefers window seats.', company: 'Nusantara Capital', date_of_birth: '1985-09-21', passport_no: 'C1234567', nationality: 'Indonesian', preferred_language: 'Indonesian', address: 'Jl. Sudirman No. 45, Jakarta 10210, Indonesia', marketing_opt_in: true, source: 'referral' },
    { id: 'cust_andi', created_at: iso(-240), updated_at: iso(-10), created_by: by, name: 'Andi Pratama', email: 'andi.pratama@example.com', phone: '+62 813 3300 4400', city: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521, tier: 'gold', status: 'active', lifetime_spend: 42300000, joined_date: date(-240), notes: '', company: 'Pratama Logistics', date_of_birth: '1990-02-14', passport_no: 'C2345678', nationality: 'Indonesian', preferred_language: 'Indonesian', address: 'Jl. Pemuda No. 12, Surabaya 60271, Indonesia', marketing_opt_in: false, source: 'website' },
    { id: 'cust_maria', created_at: iso(-180), updated_at: iso(-5), created_by: by, name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+62 821 5500 6600', city: 'Denpasar', country: 'Indonesia', lat: -8.6705, lng: 115.2126, tier: 'silver', status: 'active', lifetime_spend: 18900000, joined_date: date(-180), notes: 'Loves beach & wellness trips.', company: '', date_of_birth: '1993-11-30', passport_no: 'C3456789', nationality: 'Indonesian', preferred_language: 'English', address: 'Jl. Danau Tamblingan No. 88, Sanur, Denpasar 80228, Indonesia', marketing_opt_in: true, source: 'instagram' },
    { id: 'cust_kenji', created_at: iso(-150), updated_at: iso(-20), created_by: by, name: 'Kenji Sato', email: 'kenji.sato@example.com', phone: '+81 90 1234 5678', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, tier: 'gold', status: 'active', lifetime_spend: 51200000, joined_date: date(-150), notes: '', company: 'Sato Trading K.K.', date_of_birth: '1982-06-07', passport_no: 'TR1029384', nationality: 'Japanese', preferred_language: 'Japanese', address: '2-7-1 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan', marketing_opt_in: true, source: 'ota' },
    { id: 'cust_sarah', created_at: iso(-90), updated_at: iso(-40), created_by: by, name: 'Sarah Lee', email: 'sarah.lee@example.com', phone: '+65 8123 4567', city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, tier: 'bronze', status: 'inactive', lifetime_spend: 6400000, joined_date: date(-90), notes: 'Dormant since last quarter.', company: '', date_of_birth: '1996-03-18', passport_no: 'E7654321', nationality: 'Singaporean', preferred_language: 'English', address: '10 Marina Boulevard, #14-02, Singapore 018983', marketing_opt_in: false, source: 'walk-in' },
    { id: 'cust_budi', created_at: iso(-45), updated_at: iso(-1), created_by: by, name: 'Budi Hartono', email: 'budi.hartono@example.com', phone: '+62 856 7700 8800', city: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191, tier: 'silver', status: 'active', lifetime_spend: 22750000, joined_date: date(-45), notes: '', company: 'Hartono Textiles', date_of_birth: '1988-04-12', passport_no: 'C4567890', nationality: 'Indonesian', preferred_language: 'Indonesian', address: 'Jl. Asia Afrika No. 100, Bandung 40111, Indonesia', marketing_opt_in: true, source: 'website' },
  ];

  const StaffMember = [
    { id: 'staff_alex', created_at: iso(-400), created_by: by, name: 'Alex Rivera', email: 'alex@iconholiday.app', role: 'admin', status: 'active', last_active: iso(-0.05) },
    { id: 'staff_dewi', created_at: iso(-300), created_by: by, name: 'Dewi Lestari', email: 'dewi@iconholiday.app', role: 'manager', status: 'active', last_active: iso(-1) },
    { id: 'staff_tom', created_at: iso(-200), created_by: by, name: 'Tom Becker', email: 'tom@iconholiday.app', role: 'editor', status: 'active', last_active: iso(-3) },
    { id: 'staff_rina', created_at: iso(-30), created_by: by, name: 'Rina Putri', email: 'rina@iconholiday.app', role: 'viewer', status: 'invited', last_active: null },
  ];

  // Trip rosters — who is travelling on each trip.
  const TripMember = [
    { id: 'tm_bali_alex', created_at: iso(-12), created_by: by, trip_id: 'trip_bali', name: 'Alex Rivera', email: 'traveler@iconholiday.app', phone: '+62 811 2233 4455', role: 'organizer', status: 'confirmed' },
    { id: 'tm_bali_mia', created_at: iso(-11), created_by: by, trip_id: 'trip_bali', name: 'Mia Tan', email: 'mia.tan@example.com', phone: '+65 8111 2222', role: 'traveler', status: 'confirmed' },
    { id: 'tm_kyoto_alex', created_at: iso(-8), created_by: by, trip_id: 'trip_kyoto', name: 'Alex Rivera', email: 'traveler@iconholiday.app', phone: '+62 811 2233 4455', role: 'organizer', status: 'confirmed' },
    { id: 'tm_kyoto_kenji', created_at: iso(-7), created_by: by, trip_id: 'trip_kyoto', name: 'Kenji Sato', email: 'kenji.sato@example.com', phone: '+81 90 1234 5678', role: 'traveler', status: 'invited' },
    { id: 'tm_san_alex', created_at: iso(-4), created_by: by, trip_id: 'trip_santorini', name: 'Alex Rivera', email: 'traveler@iconholiday.app', phone: '+62 811 2233 4455', role: 'organizer', status: 'confirmed' },
    { id: 'tm_san_sara', created_at: iso(-4), created_by: by, trip_id: 'trip_santorini', name: 'Sara Putri', email: 'sara.putri@example.com', phone: '+62 822 9090 1010', role: 'traveler', status: 'confirmed' },
    { id: 'tm_san_leo', created_at: iso(-3), created_by: by, trip_id: 'trip_santorini', name: 'Leo Fernandes', email: 'leo.f@example.com', phone: '+351 912 345 678', role: 'traveler', status: 'invited' },
    { id: 'tm_san_guest', created_at: iso(-3), created_by: by, trip_id: 'trip_santorini', name: 'Hana Kim', email: 'hana.kim@example.com', phone: '+82 10 5555 6666', role: 'guest', status: 'invited' },
  ];

  // Suppliers travel products are sourced from (flights, hotels, activities, DMCs).
  const Supplier = [
    { id: 'sup_garuda', created_at: iso(-200), created_by: by, name: 'Garuda Indonesia', type: 'flight', contact_email: 'agency@garuda.example', contact_phone: '+62 21 2351 9999', country: 'Indonesia', commission_rate: 7, rating: 4.6, status: 'active', notes: 'National carrier — strong domestic network.', contact_person: 'Rama Saputra', website: 'https://www.garuda-indonesia.com', payment_terms: 'Net 14', address: 'Garuda City Center, Soekarno-Hatta Airport, Tangerang 19120, Indonesia' },
    { id: 'sup_azure', created_at: iso(-180), created_by: by, name: 'Azure Bay Resort', type: 'hotel', contact_email: 'sales@azurebay.example', contact_phone: '+62 361 555 200', country: 'Indonesia', commission_rate: 12, rating: 4.8, status: 'active', notes: 'Preferred Seminyak partner.', contact_person: 'Wayan Adnyana', website: 'https://www.azurebayresort.example', payment_terms: 'Net 30', address: 'Jl. Kayu Aya No. 9, Seminyak, Bali 80361, Indonesia' },
    { id: 'sup_baliadv', created_at: iso(-160), created_by: by, name: 'Bali Adventures', type: 'activity', contact_email: 'book@baliadv.example', contact_phone: '+62 361 555 311', country: 'Indonesia', commission_rate: 15, rating: 4.7, status: 'active', notes: 'Treks, rafting, sunrise tours.', contact_person: 'Komang Restu', website: 'https://www.baliadventures.example', payment_terms: 'Net 7', address: 'Jl. Raya Kintamani No. 21, Bangli, Bali 80652, Indonesia' },
    { id: 'sup_hotelbeds', created_at: iso(-140), created_by: by, name: 'Hotelbeds (DMC)', type: 'dmc', contact_email: 'partners@hotelbeds.example', contact_phone: '+34 971 000 000', country: 'Spain', commission_rate: 10, rating: 4.5, status: 'active', notes: 'Global hotel & transfer aggregator.', contact_person: 'Marta Gómez', website: 'https://www.hotelbeds.com', payment_terms: 'Net 45', address: "Carrer de l'Anella Mediterrània 2, 07014 Palma, Spain" },
    { id: 'sup_viator', created_at: iso(-120), created_by: by, name: 'Viator', type: 'activity', contact_email: 'supply@viator.example', contact_phone: '+1 415 000 0000', country: 'United States', commission_rate: 18, rating: 4.4, status: 'active', notes: 'Worldwide tours & experiences.', contact_person: 'Jordan Miller', website: 'https://www.viator.com', payment_terms: 'Net 30', address: '400 1st Avenue North, Suite 100, Seattle, WA 98109, USA' },
    { id: 'sup_railink', created_at: iso(-90), created_by: by, name: 'Railink Express', type: 'transport', contact_email: 'b2b@railink.example', contact_phone: '+62 21 2555 700', country: 'Indonesia', commission_rate: 6, rating: 4.2, status: 'inactive', notes: 'Airport & intercity rail.', contact_person: 'Siti Rahmawati', website: 'https://www.railink.example', payment_terms: 'Net 30', address: 'Stasiun BNI City, Jl. Tanah Abang, Jakarta 10250, Indonesia' },
  ];

  // Sales pipeline — enquiries that have not yet converted to customers/trips.
  const Lead = [
    { id: 'lead_dimas', created_at: iso(-9), created_by: by, name: 'Dimas Aji', email: 'dimas.aji@example.com', phone: '+62 812 7777 1234', source: 'website', destination: 'Maldives', budget: 60000000, status: 'new', assigned_to: 'Dewi Lestari', notes: 'Honeymoon, overwater villa, July.', expected_travel_date: date(38), party_size: 2, priority: 'high' },
    { id: 'lead_clara', created_at: iso(-7), created_by: by, name: 'Clara Wijaya', email: 'clara.w@example.com', phone: '+62 813 2222 8899', source: 'instagram', destination: 'Japan', budget: 45000000, status: 'contacted', assigned_to: 'Tom Becker', notes: 'Family of 4, cherry blossom season.', expected_travel_date: date(95), party_size: 4, priority: 'medium' },
    { id: 'lead_arjun', created_at: iso(-6), created_by: by, name: 'Arjun Mehta', email: 'arjun.m@example.com', phone: '+91 98 1010 2020', source: 'referral', destination: 'Bali', budget: 30000000, status: 'quoted', assigned_to: 'Dewi Lestari', notes: 'Group of 6, villa + activities. Quote sent.', expected_travel_date: date(52), party_size: 6, priority: 'high' },
    { id: 'lead_sophie', created_at: iso(-4), created_by: by, name: 'Sophie Martin', email: 'sophie.m@example.com', phone: '+33 6 12 34 56 78', source: 'whatsapp', destination: 'Switzerland', budget: 80000000, status: 'won', assigned_to: 'Tom Becker', notes: 'Booked alpine tour — converted.', expected_travel_date: date(120), party_size: 2, priority: 'medium' },
    { id: 'lead_budi', created_at: iso(-3), created_by: by, name: 'Budi Santoso', email: 'budi.s@example.com', phone: '+62 856 4545 6767', source: 'walk-in', destination: 'Dubai', budget: 25000000, status: 'lost', assigned_to: 'Dewi Lestari', notes: 'Went with another agency on price.', expected_travel_date: date(28), party_size: 3, priority: 'low' },
    { id: 'lead_mei', created_at: iso(-2), created_by: by, name: 'Mei Lin', email: 'mei.lin@example.com', phone: '+65 9123 4567', source: 'website', destination: 'Santorini', budget: 55000000, status: 'contacted', assigned_to: 'Dewi Lestari', notes: 'Anniversary, sunset suite.', expected_travel_date: date(75), party_size: 2, priority: 'medium' },
  ];

  // Marketing campaigns across channels.
  const Campaign = [
    { id: 'camp_flash', created_at: iso(-10), created_by: by, name: 'Bali Flash Sale Blast', channel: 'email', segment: 'all', promo_code: 'BALI35', discount: 35, status: 'sent', scheduled_date: date(-9), sent_count: 1240 },
    { id: 'camp_vip', created_at: iso(-5), created_by: by, name: 'Platinum VIP Preview', channel: 'whatsapp', segment: 'platinum', promo_code: 'VIPONLY', discount: 15, status: 'sent', scheduled_date: date(-4), sent_count: 86 },
    { id: 'camp_winback', created_at: iso(-2), created_by: by, name: 'We Miss You — Winback', channel: 'email', segment: 'inactive', promo_code: 'COMEBACK20', discount: 20, status: 'scheduled', scheduled_date: date(3), sent_count: 0 },
    { id: 'camp_summer', created_at: iso(-1), created_by: by, name: 'Summer Escapes Teaser', channel: 'push', segment: 'all', promo_code: '', discount: 0, status: 'draft', scheduled_date: '', sent_count: 0 },
  ];

  // CMS content pages — hero copy, info pages, FAQs and announcements.
  const Page = [
    { id: 'page_hero', created_at: iso(-40), created_by: by, type: 'hero', title: 'Your journey begins with Icon Holiday', slug: 'home-hero', excerpt: 'Plan, book and travel — beautifully.', body: 'Discover handpicked destinations, build day-by-day itineraries, and book everything in one place.', cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', status: 'published', order: 1 },
    { id: 'page_about', created_at: iso(-38), created_by: by, type: 'page', title: 'About Icon Holiday', slug: 'about', excerpt: 'Who we are.', body: 'Icon Holiday is your AI-powered travel concierge — blending curated destinations, smart itineraries and one-tap booking into a single, beautiful experience.', cover_image: '', status: 'published', order: 2 },
    { id: 'page_faq_book', created_at: iso(-30), created_by: by, type: 'faq', title: 'How do I make a booking?', slug: 'faq-booking', excerpt: '', body: 'Open the Book (OTA) page, choose a category (flight, hotel, train, and more), search, and tap Book. You can also add bookings directly to a trip.', cover_image: '', status: 'published', order: 1 },
    { id: 'page_faq_cancel', created_at: iso(-29), created_by: by, type: 'faq', title: 'What is the cancellation policy?', slug: 'faq-cancellation', excerpt: '', body: 'Most bookings can be cancelled from the booking detail screen. Refund amounts depend on the supplier policy and how close to travel you cancel.', cover_image: '', status: 'published', order: 2 },
    { id: 'page_faq_pay', created_at: iso(-28), created_by: by, type: 'faq', title: 'Which payment methods are supported?', slug: 'faq-payments', excerpt: '', body: 'In this demo, payments are simulated. A live deployment supports cards and e-wallets via a secure payment gateway.', cover_image: '', status: 'published', order: 3 },
    { id: 'page_ann_ai', created_at: iso(-3), created_by: by, type: 'announcement', title: 'New: AI Report Generator', slug: 'announcement-ai-reports', excerpt: 'Generate business reports from plain English.', body: 'Admins can now generate full business reports just by describing what they need.', cover_image: '', status: 'draft', order: 1 },
  ];

  // Reusable media library (images referenced across the CMS).
  const MediaAsset = [
    { id: 'media_bali', created_at: iso(-40), created_by: by, title: 'Bali rice terraces', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80', tags: ['bali', 'beach', 'indonesia'] },
    { id: 'media_kyoto', created_at: iso(-39), created_by: by, title: 'Kyoto temple', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80', tags: ['kyoto', 'japan', 'culture'] },
    { id: 'media_santorini', created_at: iso(-38), created_by: by, title: 'Santorini domes', url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80', tags: ['santorini', 'greece', 'views'] },
    { id: 'media_resort', created_at: iso(-30), created_by: by, title: 'Azure Bay Resort', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', tags: ['hotel', 'resort', 'pool'] },
    { id: 'media_flight', created_at: iso(-28), created_by: by, title: 'Airplane wing', url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', tags: ['flight', 'sky', 'travel'] },
    { id: 'media_beach', created_at: iso(-20), created_by: by, title: 'Tropical beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', tags: ['beach', 'tropical', 'hero'] },
    { id: 'media_maldives', created_at: iso(-18), created_by: by, title: 'Maldives overwater', url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80', tags: ['maldives', 'luxury', 'beach'] },
    { id: 'media_market', created_at: iso(-10), created_by: by, title: 'Bali Arts Festival', url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80', tags: ['event', 'culture', 'market'] },
  ];

  // Ready-made holiday packages sold in the app (managed in the dashboard CMS).
  const pkg = (id, o) => ({
    id, created_at: iso(o.age ?? -40), updated_at: iso(-2), created_by: by,
    status: 'active', featured: false, rating: 4.7, reviews_count: 60,
    min_pax: 2, max_pax: 12, slots_left: 8, currency: 'IDR',
    min_dp_percent: 30, ...o,
  });

  const TourPackage = [
    pkg('pkg_bali_honeymoon', {
      title: 'Bali Honeymoon Escape', destination: 'Bali, Indonesia', category: 'honeymoon',
      summary: 'Five nights of private villas, candlelit dinners and spa afternoons.',
      description: 'A slow, romantic week in Bali — a private pool villa in Seminyak, a floating breakfast, sunset at Tanah Lot, and a couples spa ritual in Ubud. Airport transfers and a dedicated trip concierge included.',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
      ],
      duration_days: 6, duration_nights: 5, price: 18500000, price_before: 22000000,
      highlights: ['Private pool villa', 'Floating breakfast', 'Couples spa ritual', 'Sunset at Tanah Lot'],
      includes: ['5 nights villa accommodation', 'Daily breakfast', 'Airport transfers', 'Couples spa treatment', 'Trip concierge'],
      excludes: ['Domestic flights', 'Travel insurance', 'Personal expenses'],
      itinerary: [
        { day: 1, title: 'Arrival & Seminyak sunset', detail: 'Private transfer to your villa, welcome drinks, and a beach-club sunset.' },
        { day: 2, title: 'Floating breakfast & beach day', detail: 'A slow morning in the villa, then a private stretch of Seminyak sand.' },
        { day: 3, title: 'Ubud rice terraces', detail: 'Tegallalang terraces before the crowds, then a long lunch over the valley.' },
        { day: 4, title: 'Couples spa ritual', detail: 'Balinese massage, flower bath, and an afternoon of nothing at all.' },
        { day: 5, title: 'Tanah Lot & farewell dinner', detail: 'The sea temple at golden hour, then seafood in Jimbaran Bay.' },
        { day: 6, title: 'Departure', detail: 'Late checkout and a private transfer to the airport.' },
      ],
      departure_dates: [date(21), date(35), date(52), date(70)],
      rating: 4.9, reviews_count: 184, slots_left: 4, featured: true, min_pax: 2, max_pax: 2, age: -55,
    }),
    pkg('pkg_kyoto_culture', {
      title: 'Kyoto Cultural Journey', destination: 'Kyoto, Japan', category: 'cultural',
      summary: 'Temples, tea ceremonies and autumn gardens, at an unhurried pace.',
      description: 'Seven days through old Japan — Fushimi Inari at dawn, a private tea ceremony, the bamboo grove at Arashiyama, and a night in a traditional ryokan with kaiseki dinner.',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80'],
      duration_days: 7, duration_nights: 6, price: 32500000, price_before: 36000000,
      highlights: ['Fushimi Inari at dawn', 'Private tea ceremony', 'Ryokan night with kaiseki', 'Arashiyama bamboo grove'],
      includes: ['6 nights accommodation', 'Daily breakfast', 'JR rail pass (7 days)', 'English-speaking guide (3 days)', 'Tea ceremony'],
      excludes: ['International flights', 'Visa fees', 'Lunches & dinners (except kaiseki)'],
      itinerary: [
        { day: 1, title: 'Arrival in Kyoto', detail: 'Airport express, check in, and an evening stroll along Pontocho.' },
        { day: 2, title: 'Fushimi Inari at dawn', detail: 'Beat the crowds through the vermilion gates, then Gion in the afternoon.' },
        { day: 3, title: 'Arashiyama', detail: 'Bamboo grove, the monkey park, and a riverside lunch.' },
        { day: 4, title: 'Tea ceremony & Nishiki market', detail: 'A private ceremony, then Kyoto’s kitchen for lunch.' },
        { day: 5, title: 'Ryokan & kaiseki', detail: 'Tatami, onsen, and a multi-course dinner in your room.' },
        { day: 6, title: 'Nara day trip', detail: 'Todai-ji, the deer park, and back to Kyoto by evening.' },
        { day: 7, title: 'Departure', detail: 'Final morning at leisure before your transfer.' },
      ],
      departure_dates: [date(45), date(80), date(115)],
      rating: 4.8, reviews_count: 132, slots_left: 6, featured: true, max_pax: 10, age: -50,
    }),
    pkg('pkg_labuan_bajo', {
      title: 'Labuan Bajo & Komodo Sailing', destination: 'Labuan Bajo, Indonesia', category: 'adventure',
      summary: 'Four days aboard a phinisi — Komodo dragons, Padar, and Pink Beach.',
      description: 'Sail the Komodo archipelago on a traditional phinisi. Trek Padar Island at sunrise, meet the dragons on Rinca, snorkel Manta Point, and sleep on deck under the stars.',
      image: 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=1200&q=80'],
      duration_days: 4, duration_nights: 3, price: 9800000, price_before: 11500000,
      highlights: ['Padar Island sunrise', 'Komodo dragons on Rinca', 'Snorkelling at Manta Point', 'Pink Beach'],
      includes: ['3 nights aboard a phinisi', 'All meals on board', 'Snorkelling gear', 'Park entry fees', 'Local guide'],
      excludes: ['Flights to Labuan Bajo', 'Diving supplements', 'Tips'],
      itinerary: [
        { day: 1, title: 'Board & set sail', detail: 'Board at midday, sail to Kelor Island for a first swim.' },
        { day: 2, title: 'Padar & Pink Beach', detail: 'Sunrise trek up Padar, then an afternoon on the pink sand.' },
        { day: 3, title: 'Komodo & Manta Point', detail: 'Dragons on Rinca in the morning, mantas in the afternoon.' },
        { day: 4, title: 'Kanawa & disembark', detail: 'A last snorkel, then back to Labuan Bajo by noon.' },
      ],
      departure_dates: [date(14), date(28), date(42), date(56)],
      rating: 4.8, reviews_count: 96, slots_left: 3, min_pax: 1, max_pax: 16, age: -45,
    }),
    pkg('pkg_raja_ampat', {
      title: 'Raja Ampat Diving Week', destination: 'Raja Ampat, Indonesia', category: 'adventure',
      summary: 'A week of the richest reefs on earth, from an eco-resort in Waigeo.',
      description: 'Twelve guided dives across Cape Kri, Blue Magic and Melissa’s Garden, plus the Piaynemo viewpoint at sunrise. Eco-resort accommodation over the water.',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80'],
      duration_days: 7, duration_nights: 6, price: 27500000,
      highlights: ['12 guided dives', 'Piaynemo viewpoint', 'Overwater eco-resort', 'Cape Kri reef'],
      includes: ['6 nights overwater bungalow', 'Full board', '12 dives with guide', 'Tanks & weights', 'Marine park fee'],
      excludes: ['Flights to Sorong', 'Equipment rental', 'Nitrox supplement'],
      itinerary: [
        { day: 1, title: 'Sorong to Waigeo', detail: 'Ferry and speedboat transfer, check-in, and a check dive.' },
        { day: 2, title: 'Cape Kri', detail: 'Two dives on the world’s most fish-dense reef.' },
        { day: 3, title: 'Blue Magic', detail: 'Manta cleaning stations and pelagic action.' },
        { day: 4, title: 'Piaynemo', detail: 'Sunrise at the viewpoint, then two dives around the karsts.' },
        { day: 5, title: 'Melissa’s Garden', detail: 'Hard coral gardens in gin-clear water.' },
        { day: 6, title: 'Free dives & village visit', detail: 'Two more dives, then a Papuan village welcome.' },
        { day: 7, title: 'Departure', detail: 'Transfer back to Sorong.' },
      ],
      departure_dates: [date(38), date(66), date(94)],
      rating: 4.9, reviews_count: 71, slots_left: 5, max_pax: 8, age: -38,
    }),
    pkg('pkg_yogya_family', {
      title: 'Yogyakarta Family Adventure', destination: 'Yogyakarta, Indonesia', category: 'family',
      summary: 'Borobudur sunrise, batik workshops and a Merapi jeep tour — built for kids.',
      description: 'A four-day family week in Java: sunrise over Borobudur, Prambanan at dusk, a hands-on batik class the kids will actually enjoy, and a jeep ride on the slopes of Merapi.',
      image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80'],
      duration_days: 4, duration_nights: 3, price: 6250000, price_before: 7400000,
      highlights: ['Borobudur sunrise', 'Prambanan at dusk', 'Batik workshop', 'Merapi jeep tour'],
      includes: ['3 nights hotel (family room)', 'Daily breakfast', 'All entrance tickets', 'Private car & driver', 'Batik workshop'],
      excludes: ['Flights', 'Lunches & dinners', 'Personal expenses'],
      itinerary: [
        { day: 1, title: 'Arrival & Malioboro', detail: 'Check in, then dinner and street life on Malioboro.' },
        { day: 2, title: 'Borobudur sunrise', detail: 'Early start for sunrise, then a batik workshop in the afternoon.' },
        { day: 3, title: 'Merapi & Prambanan', detail: 'Morning jeep tour on the volcano, Prambanan at golden hour.' },
        { day: 4, title: 'Departure', detail: 'Souvenir shopping and a transfer to the airport.' },
      ],
      departure_dates: [date(10), date(24), date(38), date(60)],
      rating: 4.6, reviews_count: 143, slots_left: 10, min_pax: 3, max_pax: 8, age: -30,
    }),
    pkg('pkg_santorini', {
      title: 'Santorini Sunset Week', destination: 'Santorini, Greece', category: 'beach',
      summary: 'Caldera-view cave suites, a catamaran day, and the best sunset in Oia.',
      description: 'Six nights on the caldera rim: a cave suite in Imerovigli, a private catamaran cruise with dinner on board, wine tasting in Pyrgos, and the Oia sunset from a reserved terrace.',
      image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200&q=80'],
      duration_days: 7, duration_nights: 6, price: 41000000, price_before: 47500000,
      highlights: ['Caldera-view cave suite', 'Private catamaran cruise', 'Santorini wine tasting', 'Reserved Oia sunset terrace'],
      includes: ['6 nights cave suite', 'Daily breakfast', 'Catamaran cruise with dinner', 'Wine tasting', 'Airport transfers'],
      excludes: ['International flights', 'Most lunches & dinners', 'Travel insurance'],
      itinerary: [
        { day: 1, title: 'Arrival in Imerovigli', detail: 'Transfer to your cave suite and an easy first evening.' },
        { day: 2, title: 'Fira to Oia hike', detail: 'The caldera path, with stops for coffee and views.' },
        { day: 3, title: 'Catamaran day', detail: 'Red Beach, hot springs, and dinner as the sun goes down.' },
        { day: 4, title: 'Wine country', detail: 'Assyrtiko tasting in Pyrgos and a village lunch.' },
        { day: 5, title: 'Beach day', detail: 'Perissa black sand, or nothing at all by the pool.' },
        { day: 6, title: 'Oia sunset', detail: 'A reserved terrace for the sunset, then a farewell dinner.' },
        { day: 7, title: 'Departure', detail: 'Transfer to the airport.' },
      ],
      departure_dates: [date(60), date(88), date(120)],
      rating: 4.8, reviews_count: 118, slots_left: 6, max_pax: 6, age: -25,
    }),
    pkg('pkg_singapore_city', {
      title: 'Singapore City Break', destination: 'Singapore', category: 'city',
      summary: 'Three nights of skyline views, hawker food and Gardens by the Bay.',
      description: 'A short, easy city break — Marina Bay, a Universal Studios day, hawker-centre dinners, and the light show at Gardens by the Bay. Ideal for a long weekend.',
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80'],
      duration_days: 4, duration_nights: 3, price: 8900000,
      highlights: ['Gardens by the Bay light show', 'Universal Studios day', 'Hawker food trail', 'Marina Bay skyline'],
      includes: ['3 nights 4-star hotel', 'Daily breakfast', 'Universal Studios ticket', 'Airport transfers'],
      excludes: ['Flights', 'Most meals', 'Optional tours'],
      itinerary: [
        { day: 1, title: 'Arrival & Marina Bay', detail: 'Check in, then the Gardens by the Bay light show after dark.' },
        { day: 2, title: 'Sentosa & Universal', detail: 'A full day at Universal Studios, cable car back at dusk.' },
        { day: 3, title: 'Culture & food trail', detail: 'Chinatown, Little India, and a hawker-centre crawl.' },
        { day: 4, title: 'Departure', detail: 'Orchard Road shopping before your transfer.' },
      ],
      departure_dates: [date(7), date(18), date(32), date(46)],
      rating: 4.5, reviews_count: 207, slots_left: 12, min_pax: 1, max_pax: 20, age: -20,
    }),
    // The two commercial tiers. Signature asks a larger deposit; Cost Saver a
    // smaller one, which is much of the point of the tier.
    pkg('pkg_maldives_signature', {
      title: 'Maldives Signature Overwater', destination: 'Maldives', category: 'signature',
      summary: 'Seven nights in an overwater villa, seaplane transfers, and a private sandbank dinner.',
      description: 'Our flagship escape. A private overwater villa with a glass floor and a direct lagoon ladder, seaplane transfers over the atolls, a reserved sandbank for one candlelit dinner, and a dedicated host for the week.',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
      images: [
        'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&q=80',
      ],
      duration_days: 8, duration_nights: 7, price: 64500000, price_before: 72000000,
      min_dp_percent: 50,
      highlights: ['Overwater villa with glass floor', 'Seaplane transfers', 'Private sandbank dinner', 'Dedicated host'],
      includes: ['7 nights overwater villa', 'All meals', 'Return seaplane transfers', 'Sandbank dinner', 'Snorkelling excursions'],
      excludes: ['International flights', 'Travel insurance', 'Premium spirits'],
      itinerary: [
        { day: 1, title: 'Seaplane to the atoll', detail: 'Meet-and-greet in Male, then a low pass over the reefs to your villa.' },
        { day: 2, title: 'House reef & spa', detail: 'Guided snorkel off your own ladder, then an afternoon over the water.' },
        { day: 3, title: 'Dolphin cruise', detail: 'A late-afternoon sail out to the spinner pods.' },
        { day: 4, title: 'Sandbank dinner', detail: 'A private stretch of sand, a table for two, and nothing else for miles.' },
        { day: 5, title: 'Manta point', detail: 'A boat morning at the cleaning station.' },
        { day: 6, title: 'Slow day', detail: 'Deliberately unplanned.' },
        { day: 7, title: 'Sunset fishing', detail: 'Traditional handline fishing, then your catch grilled on the beach.' },
        { day: 8, title: 'Departure', detail: 'Seaplane back to Male.' },
      ],
      departure_dates: [date(30), date(48), date(66), date(90)],
      rating: 5.0, reviews_count: 96, slots_left: 2, featured: true, min_pax: 2, max_pax: 4, age: -50,
    }),
    pkg('pkg_bromo_cost_saver', {
      title: 'Bromo Sunrise Cost Saver', destination: 'East Java, Indonesia', category: 'cost_saver',
      summary: 'Three days, shared jeeps, and the best sunrise in Java for under two million.',
      description: 'The classic Bromo run, stripped to what matters. Overnight train from Surabaya, a shared jeep to Penanjakan for first light, the crater rim on foot, and a night in a clean guesthouse in Cemoro Lawang. Small group, fixed departures, no hidden extras.',
      image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=80'],
      duration_days: 3, duration_nights: 2, price: 1850000, price_before: 2400000,
      min_dp_percent: 20,
      highlights: ['Penanjakan sunrise', 'Crater rim walk', 'Shared jeep transfers', 'Small group'],
      includes: ['2 nights guesthouse', 'Daily breakfast', 'Shared jeep to sunrise point', 'Park entrance fees', 'Local guide'],
      excludes: ['Train tickets to Surabaya', 'Lunch and dinner', 'Horse hire at the crater'],
      itinerary: [
        { day: 1, title: 'Arrive Cemoro Lawang', detail: 'Transfer up to the rim village, an early dinner, and an early night.' },
        { day: 2, title: 'Sunrise & crater', detail: '3am jeep to Penanjakan, then the sea of sand and the 250 steps to the rim.' },
        { day: 3, title: 'Madakaripura & departure', detail: 'The waterfall on the way down, then back to Surabaya.' },
      ],
      departure_dates: [date(12), date(19), date(26), date(40)],
      rating: 4.6, reviews_count: 312, slots_left: 9, min_pax: 1, max_pax: 16, age: -45,
    }),
    pkg('pkg_lombok_draft', {
      title: 'Lombok & Gili Islands Retreat', destination: 'Lombok, Indonesia', category: 'beach',
      summary: 'Island-hopping the Gilis with a Rinjani foothills finish.',
      description: 'Draft itinerary — five nights split between Gili Trawangan and the quiet south of Lombok, with snorkelling, a sunrise at Bukit Merese, and waterfalls in the Rinjani foothills.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'],
      duration_days: 6, duration_nights: 5, price: 11200000,
      highlights: ['Gili Trawangan snorkelling', 'Bukit Merese sunrise', 'Rinjani waterfalls'],
      includes: ['5 nights accommodation', 'Daily breakfast', 'Fast boat transfers'],
      excludes: ['Flights', 'Most meals', 'Activities not listed'],
      itinerary: [
        { day: 1, title: 'Arrival in Lombok', detail: 'Transfer to the coast and settle in.' },
        { day: 2, title: 'Gili Trawangan', detail: 'Fast boat across, snorkelling with turtles.' },
        { day: 3, title: 'Island life', detail: 'Bikes, beaches, and a sunset on the west side.' },
      ],
      departure_dates: [date(75)],
      status: 'draft', rating: 0, reviews_count: 0, slots_left: 0, age: -8,
    }),
  ];

  // OTA booking categories — drive the mobile app's OTA search tabs.
  const OtaCategory = DEFAULT_OTA_CATEGORIES.map((c, i) => ({
    id: `otacat_${c.key}`, created_at: iso(-60 + i), updated_at: iso(-60 + i), created_by: by, ...c,
  }));

  // Single app-wide settings record (brand, support, social, feature flags).
  const Setting = [
    { id: 'app', created_at: iso(-400), created_by: by, brand_name: 'Icon Holiday', tagline: 'Your Travel Agent', support_email: 'support@iconholiday.app', support_phone: '+62 21 5000 1234', support_whatsapp: '+62 811 2233 4455', currency: 'IDR', instagram: '@iconholiday.travel', facebook: 'Icon Holiday Travel', hero_title: 'Your journey begins with Icon Holiday', hero_subtitle: 'Plan, book and travel — beautifully.', flag_promotions: true, flag_ai_assistant: true, flag_consultations: true, flag_ota: true },
  ];

  /* ----------------------------------------------------------------------------
   * Generated history — spreads bookings, trips, customers and leads across the
   * past ~18 months so the analytics pages and the period-over-period comparison
   * have real data in every window (this month vs last, YoY, last 30 days, …).
   * Tagged created_by: agency so they fill the admin dashboard without crowding
   * the mobile traveller's personal lists.
   * -------------------------------------------------------------------------- */
  const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const agencyBy = 'agency@iconholiday.app';
  const custIds = Customer.map((c) => c.id);
  const firstNames = ['Rizki', 'Ayu', 'Hendra', 'Nadia', 'Fajar', 'Lina', 'Bayu', 'Citra', 'Galih', 'Sari', 'Dewa', 'Indah', 'Reza', 'Maya', 'Yoga', 'Wulan'];
  const lastNames = ['Saputra', 'Wibowo', 'Halim', 'Kusuma', 'Permata', 'Anggraini', 'Nugroho', 'Pertiwi', 'Santoso', 'Wijaya'];
  const sources = ['referral', 'website', 'instagram', 'ota', 'walk-in'];
  const histDest = ['Bali, Indonesia', 'Kyoto, Japan', 'Santorini, Greece', 'Maldives', 'Phuket, Thailand', 'Dubai, UAE', 'Paris, France', 'Tokyo, Japan'];

  const bookingKinds = [
    { type: 'flight', sup: 'sup_garuda', prov: 'Garuda Indonesia', base: 6500000, ch: 'Direct' },
    { type: 'hotel', sup: 'sup_azure', prov: 'Azure Bay Resort', base: 4200000, ch: 'Booking.com' },
    { type: 'activity', sup: 'sup_baliadv', prov: 'Bali Adventures', base: 950000, ch: 'Traveloka' },
    { type: 'hotel', sup: 'sup_hotelbeds', prov: 'Hotelbeds', base: 5200000, ch: 'Agoda' },
    { type: 'activity', sup: 'sup_viator', prov: 'Viator', base: 1300000, ch: 'Expedia' },
    { type: 'transport', sup: 'sup_railink', prov: 'Railink Express', base: 380000, ch: 'Direct' },
  ];
  const bkStatusCycle = ['confirmed', 'confirmed', 'confirmed', 'completed', 'pending', 'cancelled'];
  const payCycle = ['paid', 'paid', 'paid', 'deposit', 'unpaid'];
  for (let i = 0; i < 40; i++) {
    const off = -16 - i * 13;                       // ~13 days apart → spans ~16–520 days ago
    const k = bookingKinds[i % bookingKinds.length];
    const dst = histDest[i % histDest.length];
    const price = Math.round((k.base * (1 + ((i * 17) % 13) / 20)) / 50000) * 50000; // ×1.0–1.6
    const status = bkStatusCycle[i % bkStatusCycle.length];
    Booking.push({
      id: `bk_h${i}`, created_at: iso(off), updated_at: iso(off + 1), created_by: agencyBy,
      trip_id: '', type: k.type, title: `${cap(k.type)} · ${dst.split(',')[0]}`,
      provider: k.prov, check_in: iso(off + 18), location: dst,
      confirmation_code: `ICH-H${1000 + i}`, price, currency: 'IDR', status,
      guests: 1 + (i % 4), notes: 'Past booking.',
      customer_id: custIds[i % custIds.length], supplier_id: k.sup, cost_price: cost(price),
      payment_status: status === 'cancelled' ? 'refunded' : payCycle[i % payCycle.length],
      ...pay(price, status === 'cancelled' ? 'refunded' : payCycle[i % payCycle.length], -(off + 12)),
      channel: k.ch, supplier_ref: `REF-H${1000 + i}`, commission: Math.round(price * 0.1),
    });
  }

  const tripStyles = ['luxury', 'cultural', 'relaxation', 'adventure', 'family', 'beach'];
  const accomPrefs = ['hotel', 'resort', 'villa'];
  for (let i = 0; i < 22; i++) {
    const off = -18 - i * 22;                       // ~22 days apart → spans ~18–480 days ago
    const dst = histDest[i % histDest.length];
    const c = Customer[i % custIds.length];
    const status = off < -30 ? 'completed' : (i % 2 ? 'active' : 'planned');
    Trip.push({
      id: `trip_h${i}`, created_at: iso(off), updated_at: iso(off + 2), created_by: agencyBy,
      title: `${dst.split(',')[0]} ${cap(tripStyles[i % tripStyles.length])} Escape`,
      destination: dst, cover_image: '',
      start_date: date(off + 25), end_date: date(off + 32), status,
      travelers: 1 + (i % 5), travel_style: tripStyles[i % tripStyles.length],
      budget_total: 18000000 + (i % 6) * 9000000, budget_currency: 'IDR',
      notes: 'Past trip.', pace: 'moderate', trip_type: 'couple', is_ai_generated: i % 3 === 0,
      customer_id: c.id, lead_traveler: c.name, adults: 1 + (i % 4), children: i % 2,
      accommodation_pref: accomPrefs[i % accomPrefs.length], special_requests: '',
    });
  }

  const cities = [['Jakarta', 'Indonesia'], ['Bandung', 'Indonesia'], ['Surabaya', 'Indonesia'], ['Singapore', 'Singapore'], ['Kuala Lumpur', 'Malaysia'], ['Tokyo', 'Japan'], ['Sydney', 'Australia'], ['Seoul', 'South Korea']];
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  for (let i = 0; i < 14; i++) {
    const off = -18 - i * 27;                       // ~27 days apart → spans ~18–370 days ago
    const [city, country] = cities[i % cities.length];
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    Customer.push({
      id: `cust_h${i}`, created_at: iso(off), updated_at: iso(off + 3), created_by: agencyBy,
      name, email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
      phone: `+62 81${10 + i} ${1000 + i} ${2000 + i}`, city, country, lat: null, lng: null,
      tier: tiers[i % tiers.length], status: i % 7 === 0 ? 'inactive' : 'active',
      lifetime_spend: 4500000 + (i % 8) * 7500000, joined_date: date(off),
      notes: '', company: '', date_of_birth: '', passport_no: '', nationality: country,
      preferred_language: country === 'Indonesia' ? 'Indonesian' : 'English',
      address: '', marketing_opt_in: i % 2 === 0, source: sources[i % sources.length],
    });
  }

  const leadStatuses = ['new', 'contacted', 'quoted', 'won', 'lost'];
  const priorities = ['low', 'medium', 'high'];
  for (let i = 0; i < 18; i++) {
    const off = -10 - i * 16;                       // ~16 days apart → spans ~10–300 days ago
    const dst = histDest[i % histDest.length];
    const name = `${firstNames[(i + 5) % firstNames.length]} ${lastNames[(i + 3) % lastNames.length]}`;
    Lead.push({
      id: `lead_h${i}`, created_at: iso(off), created_by: agencyBy, name,
      email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
      phone: `+62 82${10 + i} ${3000 + i} ${4000 + i}`, source: sources[i % sources.length],
      destination: dst.split(',')[0], budget: 18000000 + (i % 6) * 10000000,
      status: leadStatuses[i % leadStatuses.length], assigned_to: ['Dewi Lestari', 'Tom Becker'][i % 2],
      notes: 'Past enquiry.', expected_travel_date: date(off + 60),
      party_size: 1 + (i % 6), priority: priorities[i % priorities.length],
    });
  }

  // Sign-ups awaiting an admin decision before they can log in.
  const Registration = [
    { id: 'reg_1', created_at: iso(-0.4), created_by: by, full_name: 'Sinta Halim', email: 'sinta.halim@example.com', phone: '+62 812 7788 9900', source: 'mobile_app', status: 'pending', note: 'Honeymoon enquiry via Instagram.' },
    { id: 'reg_2', created_at: iso(-1.2), created_by: by, full_name: 'Bagus Nugroho', email: 'bagus.n@example.com', phone: '+62 813 4455 6677', source: 'mobile_app', status: 'pending', note: '' },
    { id: 'reg_3', created_at: iso(-6), created_by: by, full_name: 'Alex Rivera', email: 'traveler@iconholiday.app', phone: '+62 811 2233 4455', source: 'mobile_app', status: 'approved', reviewed_by: 'Dewi Lestari', reviewed_at: iso(-5.5), note: '' },
    { id: 'reg_4', created_at: iso(-9), created_by: by, full_name: 'Spam Account', email: 'noreply@spam.example', phone: '', source: 'mobile_app', status: 'rejected', reviewed_by: 'Dewi Lestari', reviewed_at: iso(-8.6), note: 'Disposable address.' },
  ];

  // Paid add-ons a traveller has unlocked. Empty for new users by design —
  // Virtual Guiding and AI itinerary building are bought, not given.
  const FeatureAccess = [];

  return { Registration, FeatureAccess, Trip, Booking, ItineraryItem, Notification, PersonalAssistant, ChatMessage: [], Destination, Promotion, Customer, StaffMember, TripMember, Supplier, Lead, Campaign, AuditLog: [], Page, MediaAsset, Setting, OtaCategory, TourPackage };
}
