import { MapPin, FileText, Stamp, CreditCard, UserRound, Flag, BookOpen } from "lucide-react";
import { ACCOUNT_TYPES } from "@/lib/accounting";

/**
 * Master data tabs (Dashboard > Master data). Each tab edits one entity the
 * member app reads. `fields` drive the edit form; `columns` the table, where
 * a column shows `title` (bold) over `sub` (muted), or `text`, or `mono`.
 * A row's name in messages is `name(row)`, else the first column's title.
 *
 * Field types: text, textarea, number, select, check, lines (one item per
 * line, stored as an array) and tags (comma separated, stored as an array).
 * `fixed(row)` marks rows the app depends on: they can't be deleted, and
 * fields flagged `fixedKey` can't be edited on them.
 */

const SCOPES = [
  { value: "all", label: "Every trip" },
  { value: "domestic", label: "Domestic trips (Indonesia)" },
  { value: "international", label: "International trips" },
  { value: "countries", label: "Trips to the listed countries" },
];
const scopeLabel = (r) => r.scope === "countries" ? (r.countries || []).join(", ") || "No country yet" : SCOPES.find((s) => s.value === r.scope)?.label || "Every trip";

export const MASTER_TABS = [
  {
    key: "places",
    entity: "Place",
    label: "Locations",
    noun: "location",
    icon: MapPin,
    sort: "city",
    hint: "Cities, areas, airports, stations and ports the Book search suggests.",
    keyFrom: (r) => [r.area, r.city].filter(Boolean).join(" "),
    search: (r) => `${r.city} ${r.area || ""} ${r.country} ${r.airport_code || ""} ${r.airport_name || ""}`,
    fields: [
      { key: "city", label: "City", required: true, placeholder: "Bali" },
      { key: "area", label: "Area", placeholder: "Ubud", hint: "Fill only for an area inside the city. Areas show in hotel and attraction search." },
      { key: "region", label: "Province or region", placeholder: "Bali" },
      { key: "country", label: "Country", required: true, placeholder: "Indonesia" },
      { key: "airport_code", label: "Airport code", placeholder: "DPS", upper: true, half: true },
      { key: "airport_name", label: "Airport name", placeholder: "I Gusti Ngurah Rai International", half: true },
      { key: "station", label: "Train station", placeholder: "Gambir", half: true },
      { key: "port", label: "Port", placeholder: "Benoa", half: true },
      { key: "popular", label: "Show under Popular", type: "check" },
    ],
    columns: [
      { label: "Place", title: (r) => r.area || r.city, sub: (r) => (r.area ? `${r.city}, ${r.country}` : [r.region, r.country].filter((x) => x && x !== r.city).join(", ")) },
      { label: "Airport", mono: (r) => r.airport_code, sub: (r) => r.airport_name },
      { label: "Station", text: (r) => r.station },
      { label: "Port", text: (r) => r.port },
      { label: "Popular", text: (r) => (r.popular ? "Yes" : "") },
    ],
  },
  {
    key: "documents",
    entity: "DocumentType",
    label: "Document types",
    noun: "document type",
    icon: FileText,
    sort: "order",
    hint: "What each trip's document checklist asks for, and who supplies it.",
    keyFrom: (r) => r.label,
    search: (r) => `${r.label} ${r.description || ""} ${(r.countries || []).join(" ")}`,
    fields: [
      { key: "label", label: "Name", required: true, placeholder: "Passport" },
      { key: "description", label: "What to provide", type: "textarea", placeholder: "Photo page, valid at least 6 months after you return." },
      { key: "scope", label: "Needed for", type: "select", options: SCOPES, default: "all" },
      { key: "countries", label: "Countries", type: "tags", placeholder: "Japan, South Korea", showIf: (f) => f.scope === "countries", hint: "Matched against each trip's countries." },
      { key: "provided_by", label: "Who supplies it", type: "select", default: "member", options: [{ value: "member", label: "Member uploads it" }, { value: "team", label: "Icon Holiday uploads it" }] },
      { key: "order", label: "Order", type: "number", half: true },
    ],
    columns: [
      { label: "Document", title: (r) => r.label, sub: (r) => r.description },
      { label: "Needed for", text: scopeLabel },
      { label: "Supplied by", text: (r) => (r.provided_by === "team" ? "Icon Holiday" : "Member") },
      { label: "Order", text: (r) => String(r.order ?? ""), align: "right" },
    ],
  },
  {
    key: "visa",
    entity: "VisaInfo",
    label: "Visa info",
    noun: "country",
    icon: Stamp,
    sort: "country",
    hint: "The Visa info page in the member app, one row per country.",
    keyFrom: (r) => r.country,
    search: (r) => `${r.country} ${r.region} ${r.visa}`,
    fields: [
      { key: "country", label: "Country", required: true, placeholder: "Japan", half: true },
      { key: "flag", label: "Flag emoji", placeholder: "🇯🇵", half: true },
      { key: "region", label: "Region", type: "select", default: "Asia", options: ["Asia", "Europe", "Middle East", "Oceania", "Americas", "Africa"].map((v) => ({ value: v, label: v })) },
      { key: "visa", label: "Visa type", required: true, placeholder: "Tourist visa (C-3-9)" },
      { key: "stay", label: "Length of stay", placeholder: "30 days", half: true },
      { key: "processing", label: "Processing time", placeholder: "3–5 working days", half: true },
      { key: "fee", label: "Fee", placeholder: "Rp 1.200.000" },
      { key: "requirements", label: "Requirements", type: "lines", placeholder: "Passport valid at least 6 months\nReturn ticket", hint: "One requirement per line." },
      { key: "note", label: "Note", type: "textarea" },
    ],
    columns: [
      { label: "Country", title: (r) => `${r.flag || ""} ${r.country}`.trim(), sub: (r) => r.region },
      { label: "Visa", text: (r) => r.visa },
      { label: "Processing", text: (r) => r.processing },
      { label: "Fee", text: (r) => r.fee },
    ],
  },
  {
    key: "payments",
    entity: "PaymentMethod",
    label: "Payment methods",
    noun: "payment method",
    icon: CreditCard,
    sort: "order",
    hint: "The options members see at checkout, in this order.",
    keyFrom: (r) => r.label,
    search: (r) => `${r.label} ${r.detail || ""} ${r.type}`,
    fields: [
      { key: "label", label: "Name", required: true, placeholder: "BCA virtual account" },
      { key: "type", label: "Type", type: "select", default: "bank", options: [{ value: "card", label: "Card" }, { value: "ewallet", label: "E-wallet" }, { value: "bank", label: "Bank / virtual account" }] },
      { key: "detail", label: "Detail shown to members", placeholder: "PT Icon Holiday Indonesia · 123 456 7890" },
      { key: "order", label: "Order", type: "number", half: true },
    ],
    columns: [
      { label: "Method", title: (r) => r.label, sub: (r) => r.detail },
      { label: "Type", text: (r) => ({ card: "Card", ewallet: "E-wallet", bank: "Bank" })[r.type] || r.type },
      { label: "Order", text: (r) => String(r.order ?? ""), align: "right" },
    ],
  },
  {
    key: "leaders",
    entity: "TourLeader",
    label: "Tour leaders",
    noun: "tour leader",
    icon: UserRound,
    sort: "name",
    hint: "Assign them to trips in Trips; members see the name and phone from H-2.",
    keyFrom: (r) => r.name,
    search: (r) => `${r.name} ${r.phone} ${r.languages || ""} ${r.regions || ""}`,
    fields: [
      { key: "name", label: "Name", required: true, placeholder: "Bagas Wiratama" },
      { key: "phone", label: "Phone / WhatsApp", required: true, placeholder: "+62 812 1100 2200" },
      { key: "languages", label: "Languages", placeholder: "Indonesian, English" },
      { key: "regions", label: "Regions", placeholder: "Bali, Lombok" },
    ],
    columns: [
      { label: "Tour leader", title: (r) => r.name, sub: (r) => r.languages },
      { label: "Phone", mono: (r) => r.phone },
      { label: "Regions", text: (r) => r.regions },
    ],
  },
  {
    key: "meeting",
    entity: "MeetingPoint",
    label: "Meeting points",
    noun: "meeting point",
    icon: Flag,
    sort: "name",
    hint: "Where groups meet on departure day. Assign one to a trip in Trips.",
    keyFrom: (r) => r.name,
    search: (r) => `${r.name} ${r.address || ""} ${r.city || ""}`,
    fields: [
      { key: "name", label: "Name", required: true, placeholder: "Soekarno-Hatta T3, Gate 5" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "city", label: "City", placeholder: "Jakarta", half: true },
      { key: "map_url", label: "Map link", placeholder: "https://maps.google.com/…", half: true },
    ],
    columns: [
      { label: "Meeting point", title: (r) => r.name, sub: (r) => r.address },
      { label: "City", text: (r) => r.city },
      { label: "Map", text: (r) => (r.map_url ? "Linked" : "") },
    ],
  },
  {
    key: "accounts",
    entity: "Account",
    label: "Chart of accounts",
    noun: "account",
    icon: BookOpen,
    sort: "code",
    hint: "Accounts for Accounting. System accounts receive the automatic booking entries.",
    keyFrom: (r) => r.code,
    name: (r) => `${r.code} ${r.name}`,
    fixed: (r) => r.system,
    search: (r) => `${r.code} ${r.name} ${r.type}`,
    fields: [
      { key: "code", label: "Code", required: true, placeholder: "6106", half: true, fixedKey: true },
      { key: "type", label: "Type", type: "select", default: "expense", options: ACCOUNT_TYPES, half: true, fixedKey: true },
      { key: "name", label: "Name", required: true, placeholder: "Travel insurance premiums" },
      { key: "cash", label: "Cash or bank account (counts in the cash flow)", type: "check" },
    ],
    columns: [
      { label: "Account", mono: (r) => r.code, sub: (r) => r.name },
      { label: "Type", text: (r) => ACCOUNT_TYPES.find((t) => t.value === r.type)?.label || r.type },
      { label: "Cash", text: (r) => (r.cash ? "Yes" : "") },
      { label: "Posting", text: (r) => (r.system ? "Automatic + manual" : "Manual") },
    ],
  },
];
