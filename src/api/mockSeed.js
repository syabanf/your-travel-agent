// First-run demo data for the local mock backend.
// Returns records with explicit ids + ISO timestamps so relationships
// (booking.trip_id, itinerary_item.trip_id, etc.) stay consistent and
// "-created_date" / "-start_date" sorting behaves.
//
// All monetary amounts are in Indonesian Rupiah (IDR).

import { DESTINATIONS } from '@/data/destinations';

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
  const by = 'traveler@mora.app';
  const cost = (p) => Math.round((p * 0.78) / 50000) * 50000; // indicative supplier cost

  const Trip = [
    {
      id: 'trip_bali', created_date: iso(-12), updated_date: iso(-1), created_by: by,
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
      id: 'trip_kyoto', created_date: iso(-8), updated_date: iso(-3), created_by: by,
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
      id: 'trip_santorini', created_date: iso(-4), updated_date: iso(-4), created_by: by,
      title: 'Santorini Getaway', destination: 'Santorini, Greece',
      cover_image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
      start_date: date(70), end_date: date(75), status: 'draft', travelers: 4,
      travel_style: 'relaxation', budget_total: 54000000, budget_currency: 'IDR',
      notes: 'Caldera views, white villages, sunsets in Oia.',
      pace: 'relaxed', trip_type: 'group', is_ai_generated: false, customer_id: 'cust_andi',
      lead_traveler: 'Andi Pratama', adults: 3, children: 1, accommodation_pref: 'villa',
      special_requests: 'Connecting rooms, airport transfer, cliffside sunset dinner.',
    },
  ];

  const Booking = [
    {
      id: 'bk_flight', created_date: iso(-11), updated_date: iso(-11), created_by: by,
      trip_id: 'trip_bali', type: 'flight', title: 'Garuda Indonesia — SIN → DPS',
      provider: 'Garuda Indonesia', check_in: iso(-2), location: 'Singapore → Bali',
      confirmation_code: 'GA-7Q2K', price: 6800000, currency: 'IDR', status: 'confirmed',
      guests: 2, notes: 'GA407 · Business · Direct',
      customer_id: 'cust_putri', supplier_id: 'sup_garuda', cost_price: cost(6800000),
      payment_status: 'paid', channel: 'Direct', supplier_ref: 'GA-PNR-7Q2K', commission: Math.round(6800000 * 0.1),
    },
    {
      id: 'bk_hotel', created_date: iso(-10), updated_date: iso(-10), created_by: by,
      trip_id: 'trip_bali', type: 'hotel', title: 'Azure Bay Resort',
      provider: 'Azure Bay Resort', check_in: iso(-2), check_out: iso(5),
      location: 'Seminyak, Bali', confirmation_code: 'AB-558210',
      price: 4200000, currency: 'IDR', status: 'confirmed', guests: 2,
      image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
      notes: 'Ocean Suite · Infinity pool, Spa, Free breakfast',
      customer_id: 'cust_putri', supplier_id: 'sup_azure', cost_price: cost(4200000),
      payment_status: 'deposit', channel: 'Booking.com', supplier_ref: 'AB-558210', commission: Math.round(4200000 * 0.12),
    },
    {
      id: 'bk_attraction', created_date: iso(-6), updated_date: iso(-6), created_by: by,
      trip_id: 'trip_bali', type: 'attraction', title: 'Mount Batur Sunrise Trek',
      provider: 'Bali Adventures', check_in: iso(1), location: 'Kintamani, Bali',
      price: 980000, currency: 'IDR', status: 'pending', guests: 2,
      notes: 'Adventure · 6h · Guide, Transport',
      customer_id: 'cust_putri', supplier_id: 'sup_baliadv', cost_price: cost(980000),
      payment_status: 'unpaid', channel: 'Traveloka', supplier_ref: 'BA-MTB-0091', commission: Math.round(980000 * 0.15),
    },
  ];

  const ItineraryItem = [
    { id: 'it_1', created_date: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 1, date: date(-2), time: '10:00', activity_name: 'Beach Club & Lunch', location: 'Seminyak Beach', description: 'Day beds, ocean swim, and a long lunch.', duration_minutes: 180, budget: 1400000, reservation_required: true, booking_status: 'confirmed', is_completed: true, category: 'dining', sort_order: 1 },
    { id: 'it_2', created_date: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 1, date: date(-2), time: '18:30', activity_name: 'Sunset at Tanah Lot', location: 'Tanah Lot Temple', description: 'Iconic sea temple at golden hour.', duration_minutes: 120, budget: 150000, reservation_required: false, booking_status: 'not_booked', is_completed: true, category: 'attraction', sort_order: 2 },
    { id: 'it_3', created_date: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 2, date: date(-1), time: '09:00', activity_name: 'Ubud Rice Terraces', location: 'Tegallalang', description: 'Walk the emerald terraces before crowds.', duration_minutes: 150, budget: 200000, reservation_required: false, booking_status: 'not_booked', is_completed: false, category: 'activity', sort_order: 1 },
    { id: 'it_4', created_date: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 2, date: date(-1), time: '14:00', activity_name: 'Spa Afternoon', location: 'Ubud Wellness Spa', description: 'Traditional Balinese massage and flower bath.', duration_minutes: 120, budget: 850000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'activity', sort_order: 2 },
    { id: 'it_5', created_date: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 3, date: date(0), time: '04:00', activity_name: 'Mount Batur Sunrise Trek', location: 'Kintamani', description: 'Guided dawn hike to the summit.', duration_minutes: 360, budget: 980000, reservation_required: true, booking_status: 'pending', is_completed: false, category: 'attraction', sort_order: 1 },
    { id: 'it_6', created_date: iso(-9), created_by: by, trip_id: 'trip_bali', day_number: 3, date: date(0), time: '19:30', activity_name: 'Fine-Dining Tasting Menu', location: 'Jimbaran Bay', description: 'Seafood degustation by the water.', duration_minutes: 150, budget: 2600000, reservation_required: true, booking_status: 'confirmed', is_completed: false, category: 'dining', sort_order: 2 },
  ];

  const Notification = [
    { id: 'nt_1', created_date: iso(-0.2), created_by: by, title: 'Trek starts early tomorrow', message: 'Mount Batur Sunrise Trek pickup is at 04:00. Get some rest!', type: 'activity_reminder', is_read: false, related_trip_id: 'trip_bali' },
    { id: 'nt_2', created_date: iso(-1), created_by: by, title: 'Booking confirmed', message: 'Your stay at Azure Bay Resort is confirmed (AB-558210).', type: 'booking_update', is_read: false, related_trip_id: 'trip_bali', related_booking_id: 'bk_hotel' },
    { id: 'nt_3', created_date: iso(-2.5), created_by: by, title: 'Your concierge is ready', message: 'Maya is available to help plan your Kyoto trip.', type: 'assistant', is_read: true, related_trip_id: 'trip_kyoto' },
  ];

  const PersonalAssistant = [
    { id: 'pa_maya', created_date: iso(-30), created_by: by, name: 'Maya Tanaka', specialization: 'Luxury & Cultural Travel', photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', languages: ['English', 'Japanese', 'Indonesian'], rating: 4.9, reviews_count: 214, bio: 'Twelve years curating immersive luxury journeys across Asia.', is_available: true, hourly_rate: 650000, currency: 'IDR', specialties: ['Itinerary design', 'Fine dining', 'Hidden gems'], packages: [{ name: 'Day Planner', description: 'A bespoke single-day plan', price: 750000 }, { name: 'Full Trip', description: 'End-to-end trip concierge', price: 4500000 }] },
    { id: 'pa_leo', created_date: iso(-28), created_by: by, name: 'Leo Fernandes', specialization: 'Adventure & Outdoors', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80', languages: ['English', 'Portuguese', 'Spanish'], rating: 4.8, reviews_count: 167, bio: 'Former mountain guide — treks, dives, and off-grid escapes.', is_available: true, hourly_rate: 550000, currency: 'IDR', specialties: ['Trekking', 'Diving', 'Eco-travel'], packages: [{ name: 'Adventure Day', description: 'Adrenaline-packed day plan', price: 600000 }, { name: 'Expedition', description: 'Multi-day adventure logistics', price: 3800000 }] },
    { id: 'pa_sofia', created_date: iso(-25), created_by: by, name: 'Sofia Rossi', specialization: 'Family & Relaxation', photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80', languages: ['English', 'Italian', 'French'], rating: 4.7, reviews_count: 132, bio: 'Helping families travel smoothly and actually relax.', is_available: false, hourly_rate: 500000, currency: 'IDR', specialties: ['Family-friendly', 'Resorts', 'Slow travel'], packages: [{ name: 'Family Day', description: 'Kid-friendly day plan', price: 500000 }, { name: 'Relaxation Week', description: 'A full week, fully unwound', price: 2900000 }] },
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
    created_date: iso(-50 + i), updated_date: iso(-50 + i), created_by: by,
    name: d.name, country: d.country, tagline: d.tagline, vibes: d.vibes,
    fromPrice: d.fromPrice, emoji: d.emoji, gradient: d.gradient,
    image: d.image, images: d.images || (d.image ? [d.image] : []),
    lat: DEST_COORDS[d.id] ? DEST_COORDS[d.id][0] : null,
    lng: DEST_COORDS[d.id] ? DEST_COORDS[d.id][1] : null,
    active: true,
    ...(DEST_META[d.id] || {}),
  }));

  const Promotion = [
    { id: 'promo_villas', created_date: iso(-3), created_by: by, type: 'promo', title: 'Flash Sale: Bali Villas', description: 'Up to 35% off luxury villas in Seminyak & Ubud — book before they vanish.', discount: 35, price: 2900000, valid_until: date(14), location: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', cta: 'Book now', featured: true, terms: 'New bookings only. Min. 3 nights. Subject to availability.', promo_code: 'BALI35', max_redemptions: 200, audience: 'all' },
    { id: 'promo_flights', created_date: iso(-2), created_by: by, type: 'promo', title: 'Garuda Weekend Deal', description: 'Domestic return flights from Rp 750.000. Limited seats available.', discount: 20, price: 750000, valid_until: date(7), location: 'Nationwide', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', cta: 'Find flights', featured: false, terms: 'Travel on weekends only. Non-refundable fare class.', promo_code: 'GARUDAWKND', max_redemptions: 500, audience: 'all' },
    { id: 'event_arts', created_date: iso(-5), created_by: by, type: 'event', title: 'Bali Arts Festival', description: 'A month of Balinese dance, gamelan and craft markets.', date: date(30), location: 'Denpasar, Bali', image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80', cta: 'Learn more', featured: false, terms: 'Free public event. Some performances ticketed separately.', promo_code: '', max_redemptions: 0, audience: 'all' },
    { id: 'event_jazz', created_date: iso(-6), created_by: by, type: 'event', title: 'Java Jazz Festival', description: 'Three nights of world-class jazz in the capital.', date: date(45), location: 'Jakarta', image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80', cta: 'Get tickets', featured: false, terms: 'Tickets sold via official partners. 18+ for evening sets.', promo_code: '', max_redemptions: 0, audience: 'all' },
    { id: 'news_visa', created_date: iso(-1), created_by: by, type: 'news', title: 'New visa-on-arrival countries', description: 'Indonesia adds 10 more nationalities to its visa-on-arrival list this month.', date: date(-1), location: '', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', cta: 'Read more', featured: false, terms: 'Informational only. Check official immigration guidance.', promo_code: '', max_redemptions: 0, audience: 'all' },
  ];

  const Customer = [
    { id: 'cust_putri', created_date: iso(-300), updated_date: iso(-2), created_by: by, name: 'Putri Wijaya', email: 'putri.wijaya@example.com', phone: '+62 812 1100 2200', city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, tier: 'platinum', status: 'active', lifetime_spend: 86500000, joined_date: date(-300), notes: 'Frequent business traveler — prefers window seats.', company: 'Nusantara Capital', date_of_birth: '1985-09-21', passport_no: 'C1234567', nationality: 'Indonesian', preferred_language: 'Indonesian', address: 'Jl. Sudirman No. 45, Jakarta 10210, Indonesia', marketing_opt_in: true, source: 'referral' },
    { id: 'cust_andi', created_date: iso(-240), updated_date: iso(-10), created_by: by, name: 'Andi Pratama', email: 'andi.pratama@example.com', phone: '+62 813 3300 4400', city: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521, tier: 'gold', status: 'active', lifetime_spend: 42300000, joined_date: date(-240), notes: '', company: 'Pratama Logistics', date_of_birth: '1990-02-14', passport_no: 'C2345678', nationality: 'Indonesian', preferred_language: 'Indonesian', address: 'Jl. Pemuda No. 12, Surabaya 60271, Indonesia', marketing_opt_in: false, source: 'website' },
    { id: 'cust_maria', created_date: iso(-180), updated_date: iso(-5), created_by: by, name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+62 821 5500 6600', city: 'Denpasar', country: 'Indonesia', lat: -8.6705, lng: 115.2126, tier: 'silver', status: 'active', lifetime_spend: 18900000, joined_date: date(-180), notes: 'Loves beach & wellness trips.', company: '', date_of_birth: '1993-11-30', passport_no: 'C3456789', nationality: 'Indonesian', preferred_language: 'English', address: 'Jl. Danau Tamblingan No. 88, Sanur, Denpasar 80228, Indonesia', marketing_opt_in: true, source: 'instagram' },
    { id: 'cust_kenji', created_date: iso(-150), updated_date: iso(-20), created_by: by, name: 'Kenji Sato', email: 'kenji.sato@example.com', phone: '+81 90 1234 5678', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, tier: 'gold', status: 'active', lifetime_spend: 51200000, joined_date: date(-150), notes: '', company: 'Sato Trading K.K.', date_of_birth: '1982-06-07', passport_no: 'TR1029384', nationality: 'Japanese', preferred_language: 'Japanese', address: '2-7-1 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan', marketing_opt_in: true, source: 'ota' },
    { id: 'cust_sarah', created_date: iso(-90), updated_date: iso(-40), created_by: by, name: 'Sarah Lee', email: 'sarah.lee@example.com', phone: '+65 8123 4567', city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, tier: 'bronze', status: 'inactive', lifetime_spend: 6400000, joined_date: date(-90), notes: 'Dormant since last quarter.', company: '', date_of_birth: '1996-03-18', passport_no: 'E7654321', nationality: 'Singaporean', preferred_language: 'English', address: '10 Marina Boulevard, #14-02, Singapore 018983', marketing_opt_in: false, source: 'walk-in' },
    { id: 'cust_budi', created_date: iso(-45), updated_date: iso(-1), created_by: by, name: 'Budi Hartono', email: 'budi.hartono@example.com', phone: '+62 856 7700 8800', city: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191, tier: 'silver', status: 'active', lifetime_spend: 22750000, joined_date: date(-45), notes: '', company: 'Hartono Textiles', date_of_birth: '1988-04-12', passport_no: 'C4567890', nationality: 'Indonesian', preferred_language: 'Indonesian', address: 'Jl. Asia Afrika No. 100, Bandung 40111, Indonesia', marketing_opt_in: true, source: 'website' },
  ];

  const StaffMember = [
    { id: 'staff_alex', created_date: iso(-400), created_by: by, name: 'Alex Rivera', email: 'alex@mora.app', role: 'admin', status: 'active', last_active: iso(-0.05) },
    { id: 'staff_dewi', created_date: iso(-300), created_by: by, name: 'Dewi Lestari', email: 'dewi@mora.app', role: 'manager', status: 'active', last_active: iso(-1) },
    { id: 'staff_tom', created_date: iso(-200), created_by: by, name: 'Tom Becker', email: 'tom@mora.app', role: 'editor', status: 'active', last_active: iso(-3) },
    { id: 'staff_rina', created_date: iso(-30), created_by: by, name: 'Rina Putri', email: 'rina@mora.app', role: 'viewer', status: 'invited', last_active: null },
  ];

  // Trip rosters — who is travelling on each trip.
  const TripMember = [
    { id: 'tm_bali_alex', created_date: iso(-12), created_by: by, trip_id: 'trip_bali', name: 'Alex Rivera', email: 'traveler@mora.app', phone: '+62 811 2233 4455', role: 'organizer', status: 'confirmed' },
    { id: 'tm_bali_mia', created_date: iso(-11), created_by: by, trip_id: 'trip_bali', name: 'Mia Tan', email: 'mia.tan@example.com', phone: '+65 8111 2222', role: 'traveler', status: 'confirmed' },
    { id: 'tm_kyoto_alex', created_date: iso(-8), created_by: by, trip_id: 'trip_kyoto', name: 'Alex Rivera', email: 'traveler@mora.app', phone: '+62 811 2233 4455', role: 'organizer', status: 'confirmed' },
    { id: 'tm_kyoto_kenji', created_date: iso(-7), created_by: by, trip_id: 'trip_kyoto', name: 'Kenji Sato', email: 'kenji.sato@example.com', phone: '+81 90 1234 5678', role: 'traveler', status: 'invited' },
    { id: 'tm_san_alex', created_date: iso(-4), created_by: by, trip_id: 'trip_santorini', name: 'Alex Rivera', email: 'traveler@mora.app', phone: '+62 811 2233 4455', role: 'organizer', status: 'confirmed' },
    { id: 'tm_san_sara', created_date: iso(-4), created_by: by, trip_id: 'trip_santorini', name: 'Sara Putri', email: 'sara.putri@example.com', phone: '+62 822 9090 1010', role: 'traveler', status: 'confirmed' },
    { id: 'tm_san_leo', created_date: iso(-3), created_by: by, trip_id: 'trip_santorini', name: 'Leo Fernandes', email: 'leo.f@example.com', phone: '+351 912 345 678', role: 'traveler', status: 'invited' },
    { id: 'tm_san_guest', created_date: iso(-3), created_by: by, trip_id: 'trip_santorini', name: 'Hana Kim', email: 'hana.kim@example.com', phone: '+82 10 5555 6666', role: 'guest', status: 'invited' },
  ];

  // Suppliers travel products are sourced from (flights, hotels, activities, DMCs).
  const Supplier = [
    { id: 'sup_garuda', created_date: iso(-200), created_by: by, name: 'Garuda Indonesia', type: 'flight', contact_email: 'agency@garuda.example', contact_phone: '+62 21 2351 9999', country: 'Indonesia', commission_rate: 7, rating: 4.6, status: 'active', notes: 'National carrier — strong domestic network.', contact_person: 'Rama Saputra', website: 'https://www.garuda-indonesia.com', payment_terms: 'Net 14', address: 'Garuda City Center, Soekarno-Hatta Airport, Tangerang 19120, Indonesia' },
    { id: 'sup_azure', created_date: iso(-180), created_by: by, name: 'Azure Bay Resort', type: 'hotel', contact_email: 'sales@azurebay.example', contact_phone: '+62 361 555 200', country: 'Indonesia', commission_rate: 12, rating: 4.8, status: 'active', notes: 'Preferred Seminyak partner.', contact_person: 'Wayan Adnyana', website: 'https://www.azurebayresort.example', payment_terms: 'Net 30', address: 'Jl. Kayu Aya No. 9, Seminyak, Bali 80361, Indonesia' },
    { id: 'sup_baliadv', created_date: iso(-160), created_by: by, name: 'Bali Adventures', type: 'activity', contact_email: 'book@baliadv.example', contact_phone: '+62 361 555 311', country: 'Indonesia', commission_rate: 15, rating: 4.7, status: 'active', notes: 'Treks, rafting, sunrise tours.', contact_person: 'Komang Restu', website: 'https://www.baliadventures.example', payment_terms: 'Net 7', address: 'Jl. Raya Kintamani No. 21, Bangli, Bali 80652, Indonesia' },
    { id: 'sup_hotelbeds', created_date: iso(-140), created_by: by, name: 'Hotelbeds (DMC)', type: 'dmc', contact_email: 'partners@hotelbeds.example', contact_phone: '+34 971 000 000', country: 'Spain', commission_rate: 10, rating: 4.5, status: 'active', notes: 'Global hotel & transfer aggregator.', contact_person: 'Marta Gómez', website: 'https://www.hotelbeds.com', payment_terms: 'Net 45', address: "Carrer de l'Anella Mediterrània 2, 07014 Palma, Spain" },
    { id: 'sup_viator', created_date: iso(-120), created_by: by, name: 'Viator', type: 'activity', contact_email: 'supply@viator.example', contact_phone: '+1 415 000 0000', country: 'United States', commission_rate: 18, rating: 4.4, status: 'active', notes: 'Worldwide tours & experiences.', contact_person: 'Jordan Miller', website: 'https://www.viator.com', payment_terms: 'Net 30', address: '400 1st Avenue North, Suite 100, Seattle, WA 98109, USA' },
    { id: 'sup_railink', created_date: iso(-90), created_by: by, name: 'Railink Express', type: 'transport', contact_email: 'b2b@railink.example', contact_phone: '+62 21 2555 700', country: 'Indonesia', commission_rate: 6, rating: 4.2, status: 'inactive', notes: 'Airport & intercity rail.', contact_person: 'Siti Rahmawati', website: 'https://www.railink.example', payment_terms: 'Net 30', address: 'Stasiun BNI City, Jl. Tanah Abang, Jakarta 10250, Indonesia' },
  ];

  // Sales pipeline — enquiries that have not yet converted to customers/trips.
  const Lead = [
    { id: 'lead_dimas', created_date: iso(-9), created_by: by, name: 'Dimas Aji', email: 'dimas.aji@example.com', phone: '+62 812 7777 1234', source: 'website', destination: 'Maldives', budget: 60000000, status: 'new', assigned_to: 'Dewi Lestari', notes: 'Honeymoon, overwater villa, July.', expected_travel_date: date(38), party_size: 2, priority: 'high' },
    { id: 'lead_clara', created_date: iso(-7), created_by: by, name: 'Clara Wijaya', email: 'clara.w@example.com', phone: '+62 813 2222 8899', source: 'instagram', destination: 'Japan', budget: 45000000, status: 'contacted', assigned_to: 'Tom Becker', notes: 'Family of 4, cherry blossom season.', expected_travel_date: date(95), party_size: 4, priority: 'medium' },
    { id: 'lead_arjun', created_date: iso(-6), created_by: by, name: 'Arjun Mehta', email: 'arjun.m@example.com', phone: '+91 98 1010 2020', source: 'referral', destination: 'Bali', budget: 30000000, status: 'quoted', assigned_to: 'Dewi Lestari', notes: 'Group of 6, villa + activities. Quote sent.', expected_travel_date: date(52), party_size: 6, priority: 'high' },
    { id: 'lead_sophie', created_date: iso(-4), created_by: by, name: 'Sophie Martin', email: 'sophie.m@example.com', phone: '+33 6 12 34 56 78', source: 'whatsapp', destination: 'Switzerland', budget: 80000000, status: 'won', assigned_to: 'Tom Becker', notes: 'Booked alpine tour — converted.', expected_travel_date: date(120), party_size: 2, priority: 'medium' },
    { id: 'lead_budi', created_date: iso(-3), created_by: by, name: 'Budi Santoso', email: 'budi.s@example.com', phone: '+62 856 4545 6767', source: 'walk-in', destination: 'Dubai', budget: 25000000, status: 'lost', assigned_to: 'Dewi Lestari', notes: 'Went with another agency on price.', expected_travel_date: date(28), party_size: 3, priority: 'low' },
    { id: 'lead_mei', created_date: iso(-2), created_by: by, name: 'Mei Lin', email: 'mei.lin@example.com', phone: '+65 9123 4567', source: 'website', destination: 'Santorini', budget: 55000000, status: 'contacted', assigned_to: 'Dewi Lestari', notes: 'Anniversary, sunset suite.', expected_travel_date: date(75), party_size: 2, priority: 'medium' },
  ];

  // Marketing campaigns across channels.
  const Campaign = [
    { id: 'camp_flash', created_date: iso(-10), created_by: by, name: 'Bali Flash Sale Blast', channel: 'email', segment: 'all', promo_code: 'BALI35', discount: 35, status: 'sent', scheduled_date: date(-9), sent_count: 1240 },
    { id: 'camp_vip', created_date: iso(-5), created_by: by, name: 'Platinum VIP Preview', channel: 'whatsapp', segment: 'platinum', promo_code: 'VIPONLY', discount: 15, status: 'sent', scheduled_date: date(-4), sent_count: 86 },
    { id: 'camp_winback', created_date: iso(-2), created_by: by, name: 'We Miss You — Winback', channel: 'email', segment: 'inactive', promo_code: 'COMEBACK20', discount: 20, status: 'scheduled', scheduled_date: date(3), sent_count: 0 },
    { id: 'camp_summer', created_date: iso(-1), created_by: by, name: 'Summer Escapes Teaser', channel: 'push', segment: 'all', promo_code: '', discount: 0, status: 'draft', scheduled_date: '', sent_count: 0 },
  ];

  // CMS content pages — hero copy, info pages, FAQs and announcements.
  const Page = [
    { id: 'page_hero', created_date: iso(-40), created_by: by, type: 'hero', title: 'Your journey begins with MORA', slug: 'home-hero', excerpt: 'Plan, book and travel — beautifully.', body: 'Discover handpicked destinations, build day-by-day itineraries, and book everything in one place.', cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', status: 'published', order: 1 },
    { id: 'page_about', created_date: iso(-38), created_by: by, type: 'page', title: 'About MORA', slug: 'about', excerpt: 'Who we are.', body: 'MORA is your AI-powered travel concierge — blending curated destinations, smart itineraries and one-tap booking into a single, beautiful experience.', cover_image: '', status: 'published', order: 2 },
    { id: 'page_faq_book', created_date: iso(-30), created_by: by, type: 'faq', title: 'How do I make a booking?', slug: 'faq-booking', excerpt: '', body: 'Open the Book (OTA) page, choose a category (flight, hotel, train, and more), search, and tap Book. You can also add bookings directly to a trip.', cover_image: '', status: 'published', order: 1 },
    { id: 'page_faq_cancel', created_date: iso(-29), created_by: by, type: 'faq', title: 'What is the cancellation policy?', slug: 'faq-cancellation', excerpt: '', body: 'Most bookings can be cancelled from the booking detail screen. Refund amounts depend on the supplier policy and how close to travel you cancel.', cover_image: '', status: 'published', order: 2 },
    { id: 'page_faq_pay', created_date: iso(-28), created_by: by, type: 'faq', title: 'Which payment methods are supported?', slug: 'faq-payments', excerpt: '', body: 'In this demo, payments are simulated. A live deployment supports cards and e-wallets via a secure payment gateway.', cover_image: '', status: 'published', order: 3 },
    { id: 'page_ann_ai', created_date: iso(-3), created_by: by, type: 'announcement', title: 'New: AI Report Generator', slug: 'announcement-ai-reports', excerpt: 'Generate business reports from plain English.', body: 'Admins can now generate full business reports just by describing what they need.', cover_image: '', status: 'draft', order: 1 },
  ];

  // Reusable media library (images referenced across the CMS).
  const MediaAsset = [
    { id: 'media_bali', created_date: iso(-40), created_by: by, title: 'Bali rice terraces', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80', tags: ['bali', 'beach', 'indonesia'] },
    { id: 'media_kyoto', created_date: iso(-39), created_by: by, title: 'Kyoto temple', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80', tags: ['kyoto', 'japan', 'culture'] },
    { id: 'media_santorini', created_date: iso(-38), created_by: by, title: 'Santorini domes', url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80', tags: ['santorini', 'greece', 'views'] },
    { id: 'media_resort', created_date: iso(-30), created_by: by, title: 'Azure Bay Resort', url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', tags: ['hotel', 'resort', 'pool'] },
    { id: 'media_flight', created_date: iso(-28), created_by: by, title: 'Airplane wing', url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', tags: ['flight', 'sky', 'travel'] },
    { id: 'media_beach', created_date: iso(-20), created_by: by, title: 'Tropical beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', tags: ['beach', 'tropical', 'hero'] },
    { id: 'media_maldives', created_date: iso(-18), created_by: by, title: 'Maldives overwater', url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80', tags: ['maldives', 'luxury', 'beach'] },
    { id: 'media_market', created_date: iso(-10), created_by: by, title: 'Bali Arts Festival', url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80', tags: ['event', 'culture', 'market'] },
  ];

  // Single app-wide settings record (brand, support, social, feature flags).
  const Setting = [
    { id: 'app', created_date: iso(-400), created_by: by, brand_name: 'MORA', tagline: 'Your Travel Agent', support_email: 'support@mora.app', support_phone: '+62 21 5000 1234', support_whatsapp: '+62 811 2233 4455', currency: 'IDR', instagram: '@mora.travel', facebook: 'MORA Travel', hero_title: 'Your journey begins with MORA', hero_subtitle: 'Plan, book and travel — beautifully.', flag_promotions: true, flag_ai_assistant: true, flag_consultations: true, flag_ota: true },
  ];

  /* ----------------------------------------------------------------------------
   * Generated history — spreads bookings, trips, customers and leads across the
   * past ~18 months so the analytics pages and the period-over-period comparison
   * have real data in every window (this month vs last, YoY, last 30 days, …).
   * Tagged created_by: agency so they fill the admin dashboard without crowding
   * the mobile traveller's personal lists.
   * -------------------------------------------------------------------------- */
  const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const agencyBy = 'agency@mora.app';
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
      id: `bk_h${i}`, created_date: iso(off), updated_date: iso(off + 1), created_by: agencyBy,
      trip_id: '', type: k.type, title: `${cap(k.type)} · ${dst.split(',')[0]}`,
      provider: k.prov, check_in: iso(off + 18), location: dst,
      confirmation_code: `MORA-H${1000 + i}`, price, currency: 'IDR', status,
      guests: 1 + (i % 4), notes: 'Past booking.',
      customer_id: custIds[i % custIds.length], supplier_id: k.sup, cost_price: cost(price),
      payment_status: status === 'cancelled' ? 'refunded' : payCycle[i % payCycle.length],
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
      id: `trip_h${i}`, created_date: iso(off), updated_date: iso(off + 2), created_by: agencyBy,
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
      id: `cust_h${i}`, created_date: iso(off), updated_date: iso(off + 3), created_by: agencyBy,
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
      id: `lead_h${i}`, created_date: iso(off), created_by: agencyBy, name,
      email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
      phone: `+62 82${10 + i} ${3000 + i} ${4000 + i}`, source: sources[i % sources.length],
      destination: dst.split(',')[0], budget: 18000000 + (i % 6) * 10000000,
      status: leadStatuses[i % leadStatuses.length], assigned_to: ['Dewi Lestari', 'Tom Becker'][i % 2],
      notes: 'Past enquiry.', expected_travel_date: date(off + 60),
      party_size: 1 + (i % 6), priority: priorities[i % priorities.length],
    });
  }

  return { Trip, Booking, ItineraryItem, Notification, PersonalAssistant, ChatMessage: [], Destination, Promotion, Customer, StaffMember, TripMember, Supplier, Lead, Campaign, AuditLog: [], Page, MediaAsset, Setting };
}
