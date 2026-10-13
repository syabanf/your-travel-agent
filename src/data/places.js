/**
 * Places the Book search suggests. Each entry is a city or an area inside one;
 * `airport_code`, `station` and `port` say which transport modes can start or end
 * there. This seeds Master data > Locations, which the back office edits; the
 * search still accepts any place a traveller types.
 */
export const PLACES = [
  { city: "Jakarta", region: "DKI Jakarta", country: "Indonesia", airport_code: "CGK", airport_name: "Soekarno-Hatta International", station: "Gambir", port: "Tanjung Priok", popular: true },
  { city: "Bali", region: "Bali", country: "Indonesia", airport_code: "DPS", airport_name: "I Gusti Ngurah Rai International", port: "Benoa", popular: true },
  { city: "Surabaya", region: "East Java", country: "Indonesia", airport_code: "SUB", airport_name: "Juanda International", station: "Gubeng", port: "Tanjung Perak", popular: true },
  { city: "Yogyakarta", region: "DI Yogyakarta", country: "Indonesia", airport_code: "YIA", airport_name: "Yogyakarta International", station: "Tugu", popular: true },
  { city: "Bandung", region: "West Java", country: "Indonesia", airport_code: "BDO", airport_name: "Husein Sastranegara", station: "Bandung Hall", popular: true },
  { city: "Semarang", region: "Central Java", country: "Indonesia", airport_code: "SRG", airport_name: "Ahmad Yani International", station: "Tawang" },
  { city: "Solo", region: "Central Java", country: "Indonesia", airport_code: "SOC", airport_name: "Adi Soemarmo International", station: "Solo Balapan" },
  { city: "Malang", region: "East Java", country: "Indonesia", airport_code: "MLG", airport_name: "Abdul Rachman Saleh", station: "Malang" },
  { city: "Cirebon", region: "West Java", country: "Indonesia", station: "Cirebon" },
  { city: "Banyuwangi", region: "East Java", country: "Indonesia", airport_code: "BWX", airport_name: "Banyuwangi International", station: "Ketapang", port: "Ketapang" },
  { city: "Medan", region: "North Sumatra", country: "Indonesia", airport_code: "KNO", airport_name: "Kualanamu International", station: "Medan", port: "Belawan" },
  { city: "Padang", region: "West Sumatra", country: "Indonesia", airport_code: "PDG", airport_name: "Minangkabau International" },
  { city: "Palembang", region: "South Sumatra", country: "Indonesia", airport_code: "PLM", airport_name: "Sultan Mahmud Badaruddin II" },
  { city: "Batam", region: "Riau Islands", country: "Indonesia", airport_code: "BTH", airport_name: "Hang Nadim International", port: "Batam Centre" },
  { city: "Lombok", region: "West Nusa Tenggara", country: "Indonesia", airport_code: "LOP", airport_name: "Lombok International", port: "Lembar", popular: true },
  { city: "Labuan Bajo", region: "East Nusa Tenggara", country: "Indonesia", airport_code: "LBJ", airport_name: "Komodo", port: "Labuan Bajo", popular: true },
  { city: "Makassar", region: "South Sulawesi", country: "Indonesia", airport_code: "UPG", airport_name: "Sultan Hasanuddin International", port: "Soekarno-Hatta Makassar" },
  { city: "Manado", region: "North Sulawesi", country: "Indonesia", airport_code: "MDC", airport_name: "Sam Ratulangi International" },
  { city: "Balikpapan", region: "East Kalimantan", country: "Indonesia", airport_code: "BPN", airport_name: "Sultan Aji Muhammad Sulaiman" },
  { city: "Merak", region: "Banten", country: "Indonesia", port: "Merak" },
  { city: "Bakauheni", region: "Lampung", country: "Indonesia", port: "Bakauheni" },
  { city: "Gilimanuk", region: "Bali", country: "Indonesia", port: "Gilimanuk" },
  { city: "Singapore", region: "Singapore", country: "Singapore", airport_code: "SIN", airport_name: "Changi", port: "HarbourFront", popular: true },
  { city: "Kuala Lumpur", region: "Federal Territory", country: "Malaysia", airport_code: "KUL", airport_name: "Kuala Lumpur International", popular: true },
  { city: "Bangkok", region: "Bangkok", country: "Thailand", airport_code: "BKK", airport_name: "Suvarnabhumi", popular: true },
  { city: "Phuket", region: "Phuket", country: "Thailand", airport_code: "HKT", airport_name: "Phuket International" },
  { city: "Tokyo", region: "Kanto", country: "Japan", airport_code: "NRT", airport_name: "Narita International", popular: true },
  { city: "Osaka", region: "Kansai", country: "Japan", airport_code: "KIX", airport_name: "Kansai International" },
  { city: "Kyoto", region: "Kansai", country: "Japan" },
  { city: "Seoul", region: "Seoul", country: "South Korea", airport_code: "ICN", airport_name: "Incheon International", popular: true },
  { city: "Hong Kong", region: "Hong Kong", country: "China", airport_code: "HKG", airport_name: "Hong Kong International" },
  { city: "Dubai", region: "Dubai", country: "United Arab Emirates", airport_code: "DXB", airport_name: "Dubai International" },
  { city: "Istanbul", region: "Istanbul", country: "Turkey", airport_code: "IST", airport_name: "Istanbul" },
  { city: "Jeddah", region: "Makkah", country: "Saudi Arabia", airport_code: "JED", airport_name: "King Abdulaziz International" },
  { city: "Malé", region: "Kaafu", country: "Maldives", airport_code: "MLE", airport_name: "Velana International" },
  { city: "Sydney", region: "New South Wales", country: "Australia", airport_code: "SYD", airport_name: "Kingsford Smith" },
  { city: "Paris", region: "Île-de-France", country: "France", airport_code: "CDG", airport_name: "Charles de Gaulle" },
  { city: "London", region: "England", country: "United Kingdom", airport_code: "LHR", airport_name: "Heathrow" },
  { area: "Ubud", city: "Bali", country: "Indonesia", popular: true },
  { area: "Seminyak", city: "Bali", country: "Indonesia" },
  { area: "Kuta", city: "Bali", country: "Indonesia" },
  { area: "Nusa Dua", city: "Bali", country: "Indonesia" },
  { area: "Canggu", city: "Bali", country: "Indonesia" },
  { area: "Malioboro", city: "Yogyakarta", country: "Indonesia" },
  { area: "Shinjuku", city: "Tokyo", country: "Japan" },
  { area: "Myeongdong", city: "Seoul", country: "South Korea" },
  { area: "Orchard", city: "Singapore", country: "Singapore" },
];

/** Stable key for a place row: "bali", "ubud_bali". */
export const placeKey = (p) => [p.area, p.city].filter(Boolean).join(" ").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");

/**
 * Picker rows for one search mode. `value` is what the search form stores and
 * sends on, so a flight keeps its airport code: "Jakarta (CGK)".
 */
export function placeOptions(mode, places = PLACES) {
  const rows = [];
  for (const p of places) {
    if (p.active === false) continue;
    if (mode === "flight") {
      if (p.airport_code) rows.push({ value: `${p.city} (${p.airport_code})`, title: p.city, sub: `${p.airport_name}, ${p.country}`, code: p.airport_code, kind: "airport", popular: p.popular });
    } else if (mode === "train") {
      if (p.station) rows.push({ value: p.city, title: p.city, sub: `${p.station} station, ${p.region}`, kind: "station", popular: p.popular });
    } else if (mode === "ship") {
      if (p.port) rows.push({ value: p.city, title: p.city, sub: `${p.port} port, ${p.country}`, kind: "port", popular: p.popular });
    } else if (mode === "bus") {
      if (!p.area && p.country === "Indonesia") rows.push({ value: p.city, title: p.city, sub: `${p.region}, ${p.country}`, kind: "city", popular: p.popular });
    } else {
      rows.push(p.area
        ? { value: `${p.area}, ${p.city}`, title: p.area, sub: `${p.city}, ${p.country}`, kind: "area", popular: p.popular }
        : { value: p.city, title: p.city, sub: p.region === p.city ? p.country : `${p.region}, ${p.country}`, kind: "city", popular: p.popular });
      if (mode === "car_rental" && p.airport_code) rows.push({ value: `${p.airport_name} Airport (${p.airport_code})`, title: `${p.airport_name} Airport`, sub: `${p.city}, ${p.country}`, code: p.airport_code, kind: "airport" });
    }
  }
  return rows;
}

/** Rows matching a query: code first, then names that start with it, then the rest. */
export function searchPlaces(rows, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const rank = (r) => {
    if (r.code?.toLowerCase() === q) return 0;
    if (r.title.toLowerCase().startsWith(q)) return 1;
    return 2;
  };
  return rows
    .filter((r) => `${r.title} ${r.sub} ${r.code || ""}`.toLowerCase().includes(q))
    .sort((a, b) => rank(a) - rank(b));
}
