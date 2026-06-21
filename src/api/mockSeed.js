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
    },
    {
      id: 'trip_kyoto', created_date: iso(-8), updated_date: iso(-3), created_by: by,
      title: 'Kyoto Cultural Journey', destination: 'Kyoto, Japan',
      cover_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
      start_date: date(34), end_date: date(41), status: 'planned', travelers: 2,
      travel_style: 'cultural', budget_total: 62000000, budget_currency: 'IDR',
      notes: 'Temples, tea ceremonies, and autumn gardens.',
      pace: 'relaxed', trip_type: 'couple', is_ai_generated: true, customer_id: 'cust_kenji',
    },
    {
      id: 'trip_santorini', created_date: iso(-4), updated_date: iso(-4), created_by: by,
      title: 'Santorini Getaway', destination: 'Santorini, Greece',
      cover_image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
      start_date: date(70), end_date: date(75), status: 'draft', travelers: 4,
      travel_style: 'relaxation', budget_total: 54000000, budget_currency: 'IDR',
      notes: 'Caldera views, white villages, sunsets in Oia.',
      pace: 'relaxed', trip_type: 'group', is_ai_generated: false, customer_id: 'cust_andi',
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
    },
    {
      id: 'bk_attraction', created_date: iso(-6), updated_date: iso(-6), created_by: by,
      trip_id: 'trip_bali', type: 'attraction', title: 'Mount Batur Sunrise Trek',
      provider: 'Bali Adventures', check_in: iso(1), location: 'Kintamani, Bali',
      price: 980000, currency: 'IDR', status: 'pending', guests: 2,
      notes: 'Adventure · 6h · Guide, Transport',
      customer_id: 'cust_putri', supplier_id: 'sup_baliadv', cost_price: cost(980000),
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

  const Destination = DESTINATIONS.map((d, i) => ({
    id: `dest_${d.id}`,
    created_date: iso(-50 + i), updated_date: iso(-50 + i), created_by: by,
    name: d.name, country: d.country, tagline: d.tagline, vibes: d.vibes,
    fromPrice: d.fromPrice, emoji: d.emoji, gradient: d.gradient,
    image: d.image, images: d.images || (d.image ? [d.image] : []),
    lat: DEST_COORDS[d.id] ? DEST_COORDS[d.id][0] : null,
    lng: DEST_COORDS[d.id] ? DEST_COORDS[d.id][1] : null,
    active: true,
  }));

  const Promotion = [
    { id: 'promo_villas', created_date: iso(-3), created_by: by, type: 'promo', title: 'Flash Sale: Bali Villas', description: 'Up to 35% off luxury villas in Seminyak & Ubud — book before they vanish.', discount: 35, price: 2900000, valid_until: date(14), location: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', cta: 'Book now', featured: true },
    { id: 'promo_flights', created_date: iso(-2), created_by: by, type: 'promo', title: 'Garuda Weekend Deal', description: 'Domestic return flights from Rp 750.000. Limited seats available.', discount: 20, price: 750000, valid_until: date(7), location: 'Nationwide', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', cta: 'Find flights', featured: false },
    { id: 'event_arts', created_date: iso(-5), created_by: by, type: 'event', title: 'Bali Arts Festival', description: 'A month of Balinese dance, gamelan and craft markets.', date: date(30), location: 'Denpasar, Bali', image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800&q=80', cta: 'Learn more', featured: false },
    { id: 'event_jazz', created_date: iso(-6), created_by: by, type: 'event', title: 'Java Jazz Festival', description: 'Three nights of world-class jazz in the capital.', date: date(45), location: 'Jakarta', image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80', cta: 'Get tickets', featured: false },
    { id: 'news_visa', created_date: iso(-1), created_by: by, type: 'news', title: 'New visa-on-arrival countries', description: 'Indonesia adds 10 more nationalities to its visa-on-arrival list this month.', date: date(-1), location: '', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', cta: 'Read more', featured: false },
  ];

  const Customer = [
    { id: 'cust_putri', created_date: iso(-300), updated_date: iso(-2), created_by: by, name: 'Putri Wijaya', email: 'putri.wijaya@example.com', phone: '+62 812 1100 2200', city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, tier: 'platinum', status: 'active', lifetime_spend: 86500000, joined_date: date(-300), notes: 'Frequent business traveler — prefers window seats.' },
    { id: 'cust_andi', created_date: iso(-240), updated_date: iso(-10), created_by: by, name: 'Andi Pratama', email: 'andi.pratama@example.com', phone: '+62 813 3300 4400', city: 'Surabaya', country: 'Indonesia', lat: -7.2575, lng: 112.7521, tier: 'gold', status: 'active', lifetime_spend: 42300000, joined_date: date(-240), notes: '' },
    { id: 'cust_maria', created_date: iso(-180), updated_date: iso(-5), created_by: by, name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+62 821 5500 6600', city: 'Denpasar', country: 'Indonesia', lat: -8.6705, lng: 115.2126, tier: 'silver', status: 'active', lifetime_spend: 18900000, joined_date: date(-180), notes: 'Loves beach & wellness trips.' },
    { id: 'cust_kenji', created_date: iso(-150), updated_date: iso(-20), created_by: by, name: 'Kenji Sato', email: 'kenji.sato@example.com', phone: '+81 90 1234 5678', city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, tier: 'gold', status: 'active', lifetime_spend: 51200000, joined_date: date(-150), notes: '' },
    { id: 'cust_sarah', created_date: iso(-90), updated_date: iso(-40), created_by: by, name: 'Sarah Lee', email: 'sarah.lee@example.com', phone: '+65 8123 4567', city: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198, tier: 'bronze', status: 'inactive', lifetime_spend: 6400000, joined_date: date(-90), notes: 'Dormant since last quarter.' },
    { id: 'cust_budi', created_date: iso(-45), updated_date: iso(-1), created_by: by, name: 'Budi Hartono', email: 'budi.hartono@example.com', phone: '+62 856 7700 8800', city: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191, tier: 'silver', status: 'active', lifetime_spend: 22750000, joined_date: date(-45), notes: '' },
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
    { id: 'sup_garuda', created_date: iso(-200), created_by: by, name: 'Garuda Indonesia', type: 'flight', contact_email: 'agency@garuda.example', contact_phone: '+62 21 2351 9999', country: 'Indonesia', commission_rate: 7, rating: 4.6, status: 'active', notes: 'National carrier — strong domestic network.' },
    { id: 'sup_azure', created_date: iso(-180), created_by: by, name: 'Azure Bay Resort', type: 'hotel', contact_email: 'sales@azurebay.example', contact_phone: '+62 361 555 200', country: 'Indonesia', commission_rate: 12, rating: 4.8, status: 'active', notes: 'Preferred Seminyak partner.' },
    { id: 'sup_baliadv', created_date: iso(-160), created_by: by, name: 'Bali Adventures', type: 'activity', contact_email: 'book@baliadv.example', contact_phone: '+62 361 555 311', country: 'Indonesia', commission_rate: 15, rating: 4.7, status: 'active', notes: 'Treks, rafting, sunrise tours.' },
    { id: 'sup_hotelbeds', created_date: iso(-140), created_by: by, name: 'Hotelbeds (DMC)', type: 'dmc', contact_email: 'partners@hotelbeds.example', contact_phone: '+34 971 000 000', country: 'Spain', commission_rate: 10, rating: 4.5, status: 'active', notes: 'Global hotel & transfer aggregator.' },
    { id: 'sup_viator', created_date: iso(-120), created_by: by, name: 'Viator', type: 'activity', contact_email: 'supply@viator.example', contact_phone: '+1 415 000 0000', country: 'United States', commission_rate: 18, rating: 4.4, status: 'active', notes: 'Worldwide tours & experiences.' },
    { id: 'sup_railink', created_date: iso(-90), created_by: by, name: 'Railink Express', type: 'transport', contact_email: 'b2b@railink.example', contact_phone: '+62 21 2555 700', country: 'Indonesia', commission_rate: 6, rating: 4.2, status: 'inactive', notes: 'Airport & intercity rail.' },
  ];

  // Sales pipeline — enquiries that have not yet converted to customers/trips.
  const Lead = [
    { id: 'lead_dimas', created_date: iso(-9), created_by: by, name: 'Dimas Aji', email: 'dimas.aji@example.com', phone: '+62 812 7777 1234', source: 'website', destination: 'Maldives', budget: 60000000, status: 'new', assigned_to: 'Dewi Lestari', notes: 'Honeymoon, overwater villa, July.' },
    { id: 'lead_clara', created_date: iso(-7), created_by: by, name: 'Clara Wijaya', email: 'clara.w@example.com', phone: '+62 813 2222 8899', source: 'instagram', destination: 'Japan', budget: 45000000, status: 'contacted', assigned_to: 'Tom Becker', notes: 'Family of 4, cherry blossom season.' },
    { id: 'lead_arjun', created_date: iso(-6), created_by: by, name: 'Arjun Mehta', email: 'arjun.m@example.com', phone: '+91 98 1010 2020', source: 'referral', destination: 'Bali', budget: 30000000, status: 'quoted', assigned_to: 'Dewi Lestari', notes: 'Group of 6, villa + activities. Quote sent.' },
    { id: 'lead_sophie', created_date: iso(-4), created_by: by, name: 'Sophie Martin', email: 'sophie.m@example.com', phone: '+33 6 12 34 56 78', source: 'whatsapp', destination: 'Switzerland', budget: 80000000, status: 'won', assigned_to: 'Tom Becker', notes: 'Booked alpine tour — converted.' },
    { id: 'lead_budi', created_date: iso(-3), created_by: by, name: 'Budi Santoso', email: 'budi.s@example.com', phone: '+62 856 4545 6767', source: 'walk-in', destination: 'Dubai', budget: 25000000, status: 'lost', assigned_to: 'Dewi Lestari', notes: 'Went with another agency on price.' },
    { id: 'lead_mei', created_date: iso(-2), created_by: by, name: 'Mei Lin', email: 'mei.lin@example.com', phone: '+65 9123 4567', source: 'website', destination: 'Santorini', budget: 55000000, status: 'contacted', assigned_to: 'Dewi Lestari', notes: 'Anniversary, sunset suite.' },
  ];

  // Marketing campaigns across channels.
  const Campaign = [
    { id: 'camp_flash', created_date: iso(-10), created_by: by, name: 'Bali Flash Sale Blast', channel: 'email', segment: 'all', promo_code: 'BALI35', discount: 35, status: 'sent', scheduled_date: date(-9), sent_count: 1240 },
    { id: 'camp_vip', created_date: iso(-5), created_by: by, name: 'Platinum VIP Preview', channel: 'whatsapp', segment: 'platinum', promo_code: 'VIPONLY', discount: 15, status: 'sent', scheduled_date: date(-4), sent_count: 86 },
    { id: 'camp_winback', created_date: iso(-2), created_by: by, name: 'We Miss You — Winback', channel: 'email', segment: 'inactive', promo_code: 'COMEBACK20', discount: 20, status: 'scheduled', scheduled_date: date(3), sent_count: 0 },
    { id: 'camp_summer', created_date: iso(-1), created_by: by, name: 'Summer Escapes Teaser', channel: 'push', segment: 'all', promo_code: '', discount: 0, status: 'draft', scheduled_date: '', sent_count: 0 },
  ];

  return { Trip, Booking, ItineraryItem, Notification, PersonalAssistant, ChatMessage: [], Destination, Promotion, Customer, StaffMember, TripMember, Supplier, Lead, Campaign, AuditLog: [] };
}
