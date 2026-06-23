// Deterministic mock datasets for the OTA & PMS transaction-tracking pages.
// No backend — generated once at load with a seeded RNG so the data is stable.
const NOW = Date.now();
const DAY = 86400000;

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const round50k = (n) => Math.round(n / 50000) * 50000;

const GUESTS = ["Putri Wijaya", "Andi Pratama", "Maria Santos", "Kenji Sato", "Sarah Lee", "Budi Hartono", "Dewi Anggraini", "Rio Maulana", "Sinta Dewi", "Yuki Tanaka", "Liam Chen", "Aisha Rahman"];
const PROPERTIES = [
  { property: "Azure Bay Resort", roomType: "Ocean Suite", adr: 4200000 },
  { property: "Azure Bay Resort", roomType: "Pool Villa", adr: 6800000 },
  { property: "Ubud Wellness Villa", roomType: "Garden Villa", adr: 3500000 },
  { property: "Ubud Wellness Villa", roomType: "Spa Suite", adr: 5200000 },
  { property: "Seminyak Loft", roomType: "Studio Loft", adr: 1800000 },
  { property: "Kintamani Cabin", roomType: "Mountain Cabin", adr: 2200000 },
];
const CHANNELS = [
  { name: "Booking.com", commission: 15 }, { name: "Agoda", commission: 18 },
  { name: "Traveloka", commission: 12 }, { name: "Expedia", commission: 17 },
  { name: "Tiket.com", commission: 12 }, { name: "Direct", commission: 0 },
];
const OTA_STATUS = ["paid", "paid", "paid", "pending", "refunded"];
const PMS_STATUS = ["checked_out", "checked_in", "confirmed", "confirmed", "cancelled"];
const PAYMENT = ["paid", "paid", "deposit", "unpaid"];

export const OTA_CHANNEL_NAMES = CHANNELS.map((c) => c.name);
export const PMS_PROPERTY_NAMES = [...new Set(PROPERTIES.map((p) => p.property))];
export const OTA_STATUSES = ["paid", "pending", "refunded"];
export const PMS_STATUSES = ["confirmed", "checked_in", "checked_out", "cancelled"];

export const OTA_TRANSACTIONS = (() => {
  const r = rng(7);
  return Array.from({ length: 48 }, (_, i) => {
    const ch = pick(r, CHANNELS);
    const prop = pick(r, PROPERTIES);
    const nights = 1 + Math.floor(r() * 6);
    const gross = round50k(prop.adr * nights);
    const commission = round50k((gross * ch.commission) / 100);
    return {
      id: `otx_${1000 + i}`,
      ref: `${ch.name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}-${10000 + Math.floor(r() * 89999)}`,
      created: NOW - Math.floor(r() * 30) * DAY,
      channel: ch.name, commissionRate: ch.commission,
      guest: pick(r, GUESTS),
      listing: `${prop.roomType} · ${prop.property}`,
      checkIn: NOW + (Math.floor(r() * 50) - 12) * DAY,
      nights, gross, commission, net: gross - commission,
      status: pick(r, OTA_STATUS),
    };
  }).sort((a, b) => b.created - a.created);
})();

export const PMS_RESERVATIONS = (() => {
  const r = rng(13);
  return Array.from({ length: 44 }, (_, i) => {
    const prop = pick(r, PROPERTIES);
    const ch = pick(r, CHANNELS);
    const nights = 1 + Math.floor(r() * 7);
    const amount = round50k(prop.adr * nights);
    const checkIn = NOW + (Math.floor(r() * 40) - 10) * DAY;
    return {
      id: `res_${2000 + i}`,
      res: `R-${20000 + i * 7}`,
      created: NOW - Math.floor(r() * 30) * DAY,
      guest: pick(r, GUESTS),
      property: prop.property, roomType: prop.roomType,
      source: ch.name,
      checkIn, checkOut: checkIn + nights * DAY, nights, amount,
      status: pick(r, PMS_STATUS),
      payment: pick(r, PAYMENT),
    };
  }).sort((a, b) => b.created - a.created);
})();
