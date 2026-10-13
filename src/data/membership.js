import { FileCheck, FileClock, FileWarning, FileText } from "lucide-react";

/**
 * Icon Membership v2: the rules the member app shows information by.
 *
 * Trip information opens in stages, the way the tour runs:
 *   - before H-2  overview only (dates, route, benefits)
 *   - from H-2    pre-departure: meeting time and place, Tour Leader, documents, packing
 *   - from H      the detailed operational itinerary, travel info, WhatsApp group
 */

const DAY = 86_400_000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

/** Whole days from today until the trip starts (negative once it has begun). */
export function daysUntil(trip, now = Date.now()) {
  if (!trip?.start_date) return null;
  return Math.round((startOfDay(trip.start_date) - startOfDay(now)) / DAY);
}

/** H-2: the pre-departure page opens two days before departure. */
export const isPrepOpen = (trip, now) => { const d = daysUntil(trip, now); return d !== null && d <= 2; };

/** H: the detailed itinerary opens on the day of departure. */
export const isItineraryOpen = (trip, now) => { const d = daysUntil(trip, now); return d !== null && d <= 0; };

/** The date a staged section opens, for the "opens on …" line. */
export const opensOn = (trip, daysBefore) =>
  trip?.start_date ? new Date(startOfDay(trip.start_date) - daysBefore * DAY) : null;

/** upcoming · prep · ongoing · past, from the trip's dates. */
export function tripPhase(trip, now = Date.now()) {
  const d = daysUntil(trip, now);
  if (d === null) return "upcoming";
  if (trip.end_date && startOfDay(trip.end_date) < startOfDay(now)) return "past";
  if (d <= 0) return "ongoing";
  if (d <= 2) return "prep";
  return "upcoming";
}

/**
 * Membership number: stable for an email, so the card never changes between
 * visits. Format ICM-<year joined>-<6 digits>.
 */
export function memberNumber(email = "", joined = 2024) {
  let h = 2166136261;
  for (const c of String(email).toLowerCase()) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return `ICM-${joined}-${String(Math.abs(h) % 1_000_000).padStart(6, "0")}`;
}

/**
 * Points shown on the membership overview: one point per Rp 100.000 paid.
 * The spec shows the number but defines no earning or redemption rules, so
 * this is a display figure, not a loyalty programme.
 */
export const memberPoints = (bookings = []) =>
  Math.floor(bookings.reduce((s, b) => s + (Number(b.paid_amount) || 0), 0) / 100_000);

/**
 * Document status. The member uploads into a `requested` slot and it moves to
 * `in_review`; the team approves it or sends it back as `needs_action` with a
 * note. Documents the team supplies wait as `preparing` until uploaded.
 */
export const DOC_STATUS = {
  requested: { label: "Needed", tone: "bg-warning-soft text-warning", icon: FileWarning, hint: "Upload a clear photo or PDF." },
  preparing: { label: "Being prepared", tone: "bg-info-soft text-info", icon: FileClock, hint: "Icon Holiday will upload it here." },
  in_review: { label: "In review", tone: "bg-info-soft text-info", icon: FileClock, hint: "Icon Holiday is checking it." },
  approved: { label: "Ready", tone: "bg-success-soft text-success", icon: FileCheck, hint: "Done. Bring it on departure day." },
  needs_action: { label: "Action needed", tone: "bg-accent-soft text-accent-strong", icon: FileWarning, hint: "Something is missing; see the note." },
};
export const docStatus = (s) => DOC_STATUS[s] || { label: s || "Unknown", tone: "bg-surface text-body", icon: FileText, hint: "" };

/** A trip's countries, from its `countries` list or the last part of its destination. */
const tripCountries = (trip) =>
  (trip?.countries?.length ? trip.countries : [String(trip?.destination || "").split(",").pop().trim()])
    .filter(Boolean).map((c) => c.toLowerCase());

/** Whether a trip needs a document type, by the type's scope. */
export function needsDocument(type, trip) {
  if (type.active === false) return false;
  const countries = tripCountries(trip);
  const domestic = countries.length > 0 && countries.every((c) => c === "indonesia");
  if (type.scope === "domestic") return domestic;
  if (type.scope === "international") return !domestic;
  if (type.scope === "countries") return (type.countries || []).some((c) => countries.includes(c.toLowerCase()));
  return true;
}

/**
 * One member's checklist for one trip: every type the trip needs with its
 * document row (or none yet), plus any extra document the team asked for.
 */
export function docChecklist(trip, types, docs) {
  const mine = docs.filter((d) => d.trip_id === trip.id);
  const items = types
    .filter((t) => needsDocument(t, trip))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((type) => ({ type, doc: mine.find((d) => d.type === type.key) || null }));
  for (const doc of mine) {
    if (items.some((i) => i.type.key === doc.type)) continue;
    items.push({ type: types.find((t) => t.key === doc.type) || { key: doc.type, label: doc.type, provided_by: "member" }, doc });
  }
  return items.map((i) => ({ ...i, status: i.doc?.status || (i.type.provided_by === "team" ? "preparing" : "requested") }));
}

/** The label for a document type key. */
export const docLabel = (types, key) => types.find((t) => t.key === key)?.label || key;

/** Notification categories, as on the mockup: Semua, Trip Saya, Personal, Promo. */
export const NOTIFICATION_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "trip", label: "My trips" },
  { value: "personal", label: "Personal" },
  { value: "promo", label: "Promo" },
];

/** Older notifications carry only a `type`; map it to a category. */
export function notificationCategory(n) {
  if (n?.category) return n.category;
  if (["promo", "announcement"].includes(n?.type)) return "promo";
  if (["document", "account", "assistant"].includes(n?.type)) return "personal";
  return "trip";
}

/**
 * Whether a notification is for this member. Broadcasts reach everyone; a
 * targeted notification reaches only its recipients.
 */
export function isForMember(n, email = "") {
  if (n?.audience !== "targeted" || !n.recipients?.length) return true;
  return n.recipients.map((r) => r.toLowerCase()).includes(String(email).toLowerCase());
}

/** Visa information per destination country. Content Icon Holiday maintains. */
export const VISA_INFO = [
  {
    code: "jp", country: "Japan", flag: "🇯🇵", region: "Asia", visa: "Visa waiver (e-passport registration)",
    stay: "15 days", processing: "3–5 working days", fee: "Free",
    requirements: ["Passport valid at least 6 months", "Registered e-passport (visa waiver)", "Return ticket", "Hotel booking", "Bank statement, last 3 months"],
    note: "Travellers without an e-passport apply for a regular visa through Icon Holiday.",
  },
  {
    code: "kr", country: "South Korea", flag: "🇰🇷", region: "Asia", visa: "Tourist visa (C-3-9)",
    stay: "90 days", processing: "7–10 working days", fee: "Rp 1.200.000",
    requirements: ["Passport valid at least 6 months", "Visa application form", "4×6 photo, white background", "Bank statement, last 3 months", "Employment letter"],
    note: "K-ETA may apply depending on nationality. Our team will advise per traveller.",
  },
  {
    code: "eu", country: "Schengen (Europe)", flag: "🇪🇺", region: "Europe", visa: "Schengen short-stay visa (C)",
    stay: "90 days within 180", processing: "15 working days", fee: "EUR 90",
    requirements: ["Passport valid 3 months beyond return", "Application form", "Biometric appointment", "Travel insurance, EUR 30.000 cover", "Itinerary and hotel booking", "Bank statement, last 3 months"],
    note: "Apply no later than 30 days before departure; biometric attendance is required.",
  },
  {
    code: "au", country: "Australia", flag: "🇦🇺", region: "Oceania", visa: "Visitor visa (subclass 600)",
    stay: "Up to 3 months", processing: "20–30 working days", fee: "AUD 195",
    requirements: ["Passport valid at least 6 months", "Online application (ImmiAccount)", "Bank statement", "Employment letter", "Health declaration if requested"],
    note: "Processing can run longer in peak season. Start early.",
  },
  {
    code: "tr", country: "Turkey", flag: "🇹🇷", region: "Europe", visa: "e-Visa",
    stay: "30 days", processing: "1–3 working days", fee: "USD 60",
    requirements: ["Passport valid at least 6 months", "Online e-Visa form", "Return ticket"],
    note: "Holders of a valid Schengen, US or UK visa may qualify for a simpler process.",
  },
  {
    code: "sg", country: "Singapore", flag: "🇸🇬", region: "Asia", visa: "Visa-free (Indonesian passport)",
    stay: "30 days", processing: "—", fee: "Free",
    requirements: ["Passport valid at least 6 months", "SG Arrival Card, within 3 days of arrival", "Return ticket"],
    note: "No visa needed for Indonesian passport holders on a tourist trip.",
  },
];
