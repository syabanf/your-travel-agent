/**
 * First-run values for the master data the back office manages
 * (Dashboard > Master data). The app reads the entities; these seed them and
 * stand in when a collection fails to load.
 */

/**
 * Travel document types. `scope` decides which trips need one:
 * all, domestic (Indonesia only), international, or the listed `countries`.
 * `provided_by` says who fills the slot: the member uploads a scan, or the
 * team uploads the finished document (ticket, policy, visa).
 */
export const DEFAULT_DOCUMENT_TYPES = [
  { key: "passport", label: "Passport", description: "Photo page, valid at least 6 months after you return.", scope: "international", countries: [], provided_by: "member", order: 1, active: true },
  { key: "id_card", label: "ID card (KTP)", description: "Front side, clear and uncropped.", scope: "domestic", countries: [], provided_by: "member", order: 2, active: true },
  { key: "photo", label: "Passport photo", description: "4×6, white background, taken in the last 6 months.", scope: "countries", countries: ["Japan", "South Korea", "Australia"], provided_by: "member", order: 3, active: true },
  { key: "visa", label: "Visa", description: "Icon Holiday processes it and uploads the approved visa here.", scope: "countries", countries: ["Japan", "South Korea", "Australia", "Turkey", "Greece", "France"], provided_by: "team", order: 4, active: true },
  { key: "ticket", label: "Flight ticket", description: "Your e-ticket, uploaded by Icon Holiday once issued.", scope: "all", countries: [], provided_by: "team", order: 5, active: true },
  { key: "insurance", label: "Travel insurance", description: "The policy certificate, uploaded by Icon Holiday.", scope: "international", countries: [], provided_by: "team", order: 6, active: true },
];

/** Checkout payment options. Saved cards come from the member's device. */
export const DEFAULT_PAYMENT_METHODS = [
  { key: "card", type: "card", label: "Debit / credit card", detail: "Visa, Mastercard, JCB", order: 1, active: true },
  { key: "gopay", type: "ewallet", label: "GoPay", detail: "E-wallet", order: 2, active: true },
  { key: "ovo", type: "ewallet", label: "OVO", detail: "E-wallet", order: 3, active: true },
  { key: "dana", type: "ewallet", label: "DANA", detail: "E-wallet", order: 4, active: true },
  { key: "bca_va", type: "bank", label: "BCA virtual account", detail: "Paid from any bank app", order: 5, active: true },
  { key: "mandiri_va", type: "bank", label: "Mandiri virtual account", detail: "Paid from any bank app", order: 6, active: true },
  { key: "bca_transfer", type: "bank", label: "BCA bank transfer", detail: "PT Icon Holiday Indonesia · 123 456 7890", order: 7, active: false },
];

export const DEFAULT_TOUR_LEADERS = [
  { key: "bagas", name: "Bagas Wiratama", phone: "+62 812 1100 2200", languages: "Indonesian, English", regions: "Bali, Lombok", active: true },
  { key: "rina", name: "Rina Kartika", phone: "+62 813 2200 3300", languages: "Indonesian, English, Japanese", regions: "Japan, Korea", active: true },
  { key: "dewi", name: "Dewi Lestari", phone: "+62 811 4400 5500", languages: "Indonesian, English", regions: "Maldives, Middle East", active: true },
];

const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const DEFAULT_MEETING_POINTS = [
  { key: "cgk_t3_g3", name: "Soekarno-Hatta T3, Gate 3", address: "Terminal 3 departure hall, Gate 3, Tangerang", city: "Jakarta", map_url: maps("Soekarno-Hatta Terminal 3"), active: true },
  { key: "cgk_t3_g5", name: "Soekarno-Hatta T3, Gate 5", address: "Terminal 3 departure hall, Gate 5, Tangerang", city: "Jakarta", map_url: maps("Soekarno-Hatta Terminal 3"), active: true },
  { key: "cgk_t3_g7", name: "Soekarno-Hatta T3, Gate 7", address: "Terminal 3 departure hall, Gate 7, Tangerang", city: "Jakarta", map_url: maps("Soekarno-Hatta Terminal 3"), active: true },
  { key: "sub_t2", name: "Juanda T2, Icon Holiday desk", address: "Terminal 2 departure hall, Sidoarjo", city: "Surabaya", map_url: maps("Juanda International Airport Terminal 2"), active: true },
  { key: "medan_office", name: "Icon Holiday Medan office", address: "Jl. Imam Bonjol 6, Medan", city: "Medan", map_url: maps("Jl. Imam Bonjol 6 Medan"), active: true },
];
