# Icon Holiday — Feature Reference

**Icon Holiday** is a travel-agency platform delivered as one React app with two surfaces:

1. **Traveller app** — a mobile (phone-framed) experience to discover destinations, plan trips with an AI concierge, and book everything from flights to attractions.
2. **Admin console** — a full back-office for running the agency: CRM, operations, catalog, content, marketing, finance and reports.

It runs **fully standalone** on a client-side mock backend (data in `localStorage`) — no accounts, servers, or API keys — and is localized to **Indonesian Rupiah (IDR)**. It's an **installable PWA**.

> **Demo nature:** auth, payments and AI are simulated; role-based access is enforced client-side via a demo role switcher. See [Constraints](#constraints).

---

## Table of contents
- [Tech stack](#tech-stack)
- [Traveller app](#traveller-app)
- [Admin console](#admin-console)
- [Platform-wide features](#platform-wide-features)
- [Data model](#data-model)
- [Engineering & quality](#engineering--quality)
- [Constraints](#constraints)
- [Getting started](#getting-started)

---

## Tech stack
- **React 18** + **Vite 6**, **React Router v6** with route-based code-splitting (`React.lazy` — heavy libs like maps/charts load on demand).
- **Tailwind CSS** + **shadcn/ui** (Radix primitives) — cohesive light "luxury" theme (navy + crimson + cream, glassmorphism, soft elevation).
- **TanStack Query** (data cache), **framer-motion** (motion), **Recharts** (charts), **OpenLayers** (maps), **Sonner** (toasts), **lucide-react** (icons), **moment** (dates).
- **Vitest + React Testing Library + jsdom** (tests).
- **Mock backend** — [`src/api/base44Client.js`](src/api/base44Client.js): `base44.entities.<Name>.{list,filter,get,create,update,delete}` over `localStorage`, with first-run seeding, non-destructive migrations, an in-memory fallback when storage is unavailable, and an audit trail.
- **Pluggable AI** — [`src/api/mockLLM.js`](src/api/mockLLM.js): schema-aware stub behind `base44.integrations.Core.InvokeLLM`; point it at a real model via `configureLLM()`.

---

## Traveller app

### Onboarding & auth
- **Splash** (`/splash`) and an image-led **Onboarding** carousel (`/onboarding`).
- **Login / Register** (`/login`, `/register`) — sign in, create an account, or **continue as guest** (mock auth — any credentials work).
- **Session gating** — protected routes redirect to splash/login when signed out.

### Home (`/`)
- Time-aware greeting + persistent brand **app bar** (search, notifications with unread badge, profile avatar).
- **Quick actions** (Plan Trip, AI Assistant, Book Travel, Personal Assistant), a **"What's New"** banner, the **active/upcoming trip** card, a **featured destinations** carousel (with "from" price), the **Personal Concierge** promo, and **recent bookings**. Pull-to-refresh.

### Discovery
- **Search** (`/search`) — filter destinations, promotions and assistants.
- **Destination detail** (`/destination/:id`) — swipeable hero gallery, vibes, travel info.
- **Destination swipe** — Tinder-style deck (swipe right to save a destination); favourites persist and pre-fill the trip wizard.
- **Promotions & Events** (`/promotions`, `/promotions/:id`) — promos, events and news; the CTA copies the promo code and routes into booking.
- **Holiday Packages** (`/packages`, `/packages/:id`) — ready-made trips for sale: browse by category, see the day-by-day itinerary, what's included/excluded, departure dates and seats left, pick a party size, then buy straight into the checkout flow. Surfaced on Home and on the Booking tab; only published packages appear.
- **Help** (`/help`) — FAQ + support, sourced from the CMS.

### Trip planning — Itinerary (`/itinerary`)
- **My Itineraries** list with status tabs (Upcoming / Active / Drafts / Past).
- **Trip Wizard** (`/itinerary/wizard`) — guided flow: Discover → Destination → Dates → Details → Budget → Review → Book, with an **AI-generated itinerary** option.
- **New / Edit Trip** (`/itinerary/new`, `/itinerary/:tripId/edit`) — manual create/update (no duplicates on edit).
- **Trip detail** (`/itinerary/:tripId`) — day-by-day timeline, completion toggles, per-activity budgets, AI "generate activities", a **traveller roster** (invite/remove members with roles & RSVP), share, duplicate, delete.
- **Add activity** (`/itinerary/:tripId/add`) — name, location (map browse), time, duration, category, budget, notes.
- Trip tools: **Calendar** (`/itinerary/calendar`), **Map** (`/itinerary/map`, OpenLayers — markers, location search, pick-a-location), **Budget tracker** (`/itinerary/budget` — planned vs remaining + category chart), **Packing checklist** (`/itinerary/checklist`).

### Booking — OTA engine
- **OTA marketplace** (`/ota`) and **Booking hub** (`/booking`) — search **flights, hotels, trains, buses, ships, car rentals and attractions**. Category tabs are **driven by the dashboard's Booking Categories** (incl. custom ones).
- **AI-simulated results** with one-tap booking, **booking detail** (`/booking/:bookingId`), and a **multi-step checkout** (`/booking/:bookingId/checkout` — review → guest details → payment → confirmation; payment simulated).
- **My Bookings** list with statuses; bookings can be attached to a trip.

### Assistant
- **Assistant hub** (`/assistant`) — choose AI or a human expert.
- **AI Assistant** (`/assistant/ai`) — chat concierge; save a generated itinerary to Trips.
- **Personal assistants** (`/assistant/profile/:id`) — profiles, languages, ratings, packages → **consultation booking** (`/consultation/:assistantId`).

### Profile & account
- **Profile** (`/profile`) — user card + trip/booking stats + menu.
- Sub-pages: **Preferences**, **Saved Travellers** (add/remove), **Payment Methods** (mock cards), **Security**, **Settings**, **Privacy & Data** (export all data as JSON, delete all data).
- **Notifications** (`/notifications`), **Privacy** (`/privacy`) and **Terms** (`/terms`) pages.

### Mobile UX
- 5-tab **bottom dock** with an animated active indicator; **swipe left/right** between tabs; **directional page transitions**.
- Modern visuals: gradient app-icon tiles, image-zoom cards, frosted chips, premium dark cards, aurora backdrop.

---

## Admin console (`/dashboard`)
Collapsible **drill-down sidebar**, a sticky **header** (breadcrumb, "jump to" command search, activity, role + avatar), a **mobile-app switcher**, and a live **"Viewing as" role switcher**. Fully responsive (desktop / tablet / mobile with a slide-in sidebar).

### Insight Center
- **Overview** (`/dashboard`) — KPI cards, pipeline/loyalty/trip donuts, revenue trend, recent bookings & customers — all with **period + comparison** controls (period-over-period deltas). Every card deep-links to records.
- **Reports** hub (`/dashboard/reports`):
  - **Analytics** — KPIs with deltas, financial/funnel metrics (gross profit, commission, outstanding, lead conversion), charts (revenue by month, by type, by tier, top destinations) with chart→list drill-down, plus a **Tables** view (each CSV-exportable). Period + comparison aware.
  - **Business** (`/reports/business`) — sales funnel, lead conversion %, gross-margin analysis, supplier & agent performance.
  - **Finance / ERP** (`/reports/finance`) — income statement (P&L), receivables, payables, cash flow, tax (PPN 11%), revenue/cost/profit-by-month.
  - **AI Reports** (`/reports/ai`) — text-to-report from live data (executive summary, KPIs, tables, recommendations) with **PDF export**.

### Sales & CRM
- **Leads** (`/dashboard/leads`, `/leads/:id`) — pipeline (new → contacted → quoted → won → lost) with priority, assignment, **WhatsApp follow-up**, and **convert-to-customer**.
- **Customers** (`/dashboard/customers`, `/customers/:id`) — full CRUD (tier, lifetime value, passport, nationality, marketing opt-in, map location picker); per-customer trips & bookings.
- **Trips & Bookings** (`/dashboard/bookings`, `/bookings/:id`, `/trips/:id`) — booking ledger + trips with full CRUD, inline status, payment/channel/commission/cost fields, **sell / cost / margin / commission** breakdown, **refunds & cancellations**, **print-to-PDF vouchers**, and trip rosters.

### Operations
- **OTA Channels** (`/dashboard/ota`) — connect/disconnect, sync, per-channel revenue/commission, full CRUD, transaction drawer.
- **Booking Categories** (`/dashboard/ota/categories`) — CRUD for the app's Book-tab categories (label, icon, search-flow behaviour, visibility, order). **Drives the mobile app.**
- **OTA Transactions** (`/dashboard/ota/transactions`) — booking-transaction monitor with filters.
- **Property Management / PMS** (`/dashboard/pms`) — rooms, availability, occupancy, ADR/RevPAR, rate adjust, full CRUD, per-room channel-sync drawer; **PMS Transactions** (`/dashboard/pms/transactions`).

### Catalog
- **Destinations** (`/dashboard/destinations`, `/destinations/:id`) — CRUD with a **map editor** (click or geocode-search), multi-image gallery (cover = first), vibes, emoji, from-price, and travel metadata (best season, currency, timezone, visa). Detail shows derived insights on a map.
- **Promotions & Events** (`/dashboard/promotions`, `/promotions/:id`) — CRUD with promo codes, audience, terms, validity.
- **Holiday Packages** (`/dashboard/packages`, `/packages/:id`) — full CRUD for the packages sold in the app: pricing (incl. a strikethrough "was" price and automatic discount badge), duration, party-size limits, seats left, highlights, inclusions/exclusions, a day-by-day itinerary and departure dates. Draft vs published controls app visibility. **Drives the mobile store.**
- **Suppliers** (`/dashboard/suppliers`, `/suppliers/:id`) — directory (flight/hotel/activity/transport/DMC) with contact person, payment terms, commission, ratings; per-supplier bookings, sales, cost and estimated commission.

### Content (CMS)
- **Pages** (`/dashboard/content`, `/content/:id`) — hero/info/FAQ/announcement content (draft/published, bulk delete) used by the app.
- **Media Library** (`/dashboard/media`, `/media/:id`) — reusable image assets.
- **App Settings** (`/dashboard/settings`) — brand, support contacts, social links, currency, feature flags.

### Growth & System
- **Marketing** (`/dashboard/marketing`, `/marketing/:id`) — campaigns across email / WhatsApp / push with **segments** (by tier/status), promo codes, scheduling, and a simulated "Send now".
- **Team & Roles** (`/dashboard/team`, `/team/:id`) — staff, roles, invites.
- **Audit Log** (`/dashboard/audit`) — automatic trail of every create/update/delete (actor, action, entity, summary) with filters.

### Dashboard UX
- **Searchable dropdowns** everywhere (type-to-filter combobox replacing native selects) — filters and form fields alike, with keyboard nav and auto-flip.
- **Data tables + card views** with pagination, sorting and rich filters (status, type, country, **date-range**, etc.); **drawers** for sub-records; **CSV export**; **charts** for insights.
- **AI assistant stub** on every section ("Ask AI", data-aware). Per-route entrance transitions.

---

## Platform-wide features
- **Role-based access control** — Administrator / Manager / Editor / Viewer gate view/create/edit/delete per resource; live "Viewing as" switcher; read-only banner for viewers.
- **Period-over-period comparison** — reusable period + comparison controls with up/down delta pills.
- **Installable PWA** — web manifest, branded icon, theme colour, and an offline-shell service worker (production) so the app can be added to the home screen.
- **WhatsApp deep-links**, **clipboard share**, **print-to-PDF** (vouchers, itineraries, AI reports — via the browser print dialog), and **export / delete all my data**.
- **Rich seed data** — ~18 months of spread bookings/trips/customers/leads so analytics and comparisons are meaningful out of the box, with a versioned clean reseed + migrations.

---

## Data model
Mock entities ([`src/api/base44Client.js`](src/api/base44Client.js)):

`Trip` · `Booking` · `ItineraryItem` · `TripMember` · `Notification` · `PersonalAssistant` · `ChatMessage` · `Destination` · `Promotion` · `OtaCategory` · `TourPackage` · `Customer` · `Lead` · `Supplier` · `Campaign` · `StaffMember` · `Page` · `MediaAsset` · `Setting` · `AuditLog`

Each supports `list(order, limit)`, `filter(query, order, limit)`, `get(id)`, `create`, `update`, `delete` (+ `bulkCreate`). Mutations to business entities are written to `AuditLog`.

---

## Engineering & quality
- **Tests** — Vitest + RTL + jsdom; suite covers the mock-backend CRUD lifecycle, RBAC, currency & period math, and the SearchableSelect component (`npm run test:run`).
- **Resilience** — recoverable error boundaries per shell (a page crash keeps the nav and auto-recovers on navigation); storage writes never throw (in-memory fallback); guarded async (no stuck spinners).
- **Accessibility** — aria-labels on icon controls, alt text, labelled inputs, visible focus ring, `prefers-reduced-motion` support, skip-to-content.
- **Performance** — route-based code-splitting keeps the initial bundle lean.
- **Code health** — ESLint clean; no unused dependencies.

---

## Constraints
A **front-end demo / prototype** (no real backend by design):
- **Auth** is simulated — any credentials log in; sessions live in `localStorage`.
- **Payments** are simulated (no gateway).
- **AI** runs on a stub until `configureLLM()` is wired to a model.
- **RBAC** is client-side only (the role switcher is for demonstration).
- **Persistence** is the browser's `localStorage` — clearing it resets to seed data.

These are the boundaries to address if Icon Holiday becomes a production product.

---

## Getting started
```bash
npm install
npm run dev        # start the app at http://localhost:5173
npm run build      # production build
npm run lint       # eslint
npm run test:run   # run the test suite once  (npm test = watch mode)
```
No environment variables needed — the app seeds its own demo data on first run. Open the **mobile app** at `/` and the **Admin Dashboard** at `/dashboard` (or Profile → Admin Dashboard).
