# MORA — Features

MORA is a premium travel-planning app: discover destinations, plan trips with an
AI concierge, book everything (flights → attractions), and manage it all from an
admin dashboard. It runs **fully standalone** on a local, in-browser mock backend
(no account or API keys required) and is localized to **Indonesian Rupiah (IDR)**.

---

## 🔐 Onboarding & Auth
- **Splash screen** with branded intro and routing logic.
- **Onboarding** — a 4-slide guide to the app's main menus (Plan, Book, Concierge, Organize).
- **Login / Register** — sign in, create an account, or **continue as guest**.
- **Session gating** — protected routes redirect to the splash/login flow when signed out; sign-out clears the session.

## 🏠 Home
- Time-aware greeting and the signed-in traveler's name.
- **Quick actions** — Plan Trip, AI Assistant, Book Travel, Personal Assistant.
- **"What's New"** banner → promotions, events & news.
- **Active/Upcoming trip** card, **Featured destinations** carousel, **Concierge offer**, and **Recent bookings**.

## 🧭 Trip Planning
- **Trip wizard** — a guided, multi-step flow: Discover → Destination → Dates → Details → Budget → Review → Book.
- **Destination swipe** — Tinder-style deck (swipe right to save a destination as a "reference"); favorites persist and pre-fill the wizard.
- **AI trip generation** — generate a full day-by-day itinerary, or create a trip manually.
- **Itinerary list** with status tabs (Upcoming / Active / Drafts / Past) and quick links.
- **Trip detail** — day-by-day timeline, completion toggles, per-activity budgets, AI "generate activities", and edit/delete.
- **Edit trip** — loads and updates the existing trip (no duplicates).
- **Add activity** — name, location (with map browse), time, duration, category, budget, notes.

## 🗺️ Trip Tools
- **Calendar view** — month grid with trip-day markers and a per-month trip list.
- **Map view** — Leaflet map with destination markers, location search, and a pick-a-location flow that returns the chosen place to Add Activity.
- **Budget tracker** — per-trip planned vs. remaining, category breakdown chart, and an all-trips overview.
- **Packing checklist** — categorized, checkable items with progress and custom entries.

## ✈️ Booking (OTA)
- **Search** across **flights, hotels, trains, buses, ships, car rentals, and attractions**.
- **AI-generated results** with realistic options and one-tap booking (linked to a trip when booked from the wizard).
- **My Bookings** list, **booking detail**, and a **multi-step checkout** (review → guest details → payment → confirmation code).

## 💬 Assistant
- **AI travel concierge** — chat to plan, optimize, or get suggestions; **save a generated itinerary to Trips**.
- **Personal (human) assistants** — browse experts, view profiles, languages, ratings, and service packages.

## 🎁 What's New
- **Promotions** (with discounts & validity), **upcoming events**, and **news & info** — all driven by the CMS.

## 👤 Profile
- Profile card with trip/booking stats.
- Travel preferences, saved travelers, payment methods, privacy & security, notifications, and settings.
- **Admin Dashboard** switcher and sign-out.

---

## 🖥️ Admin Dashboard & CMS (desktop, at `/dashboard`)
The dashboard manages the content that powers the mobile app — changes show up live in the app.

- **Overview** — live counts (destinations, promotions, trips, bookings), confirmed revenue, and recent bookings.
- **Destinations CMS** — create/edit/delete destinations with a **map editor**: click the map or **geocode-search** to set coordinates, plus name, country, tagline, image, vibes, emoji and from-price. These drive the app's swipe deck & map.
- **Promotions & Events CMS** — create/edit/delete promotions, events, and news shown in "What's New".
- **Trips & Bookings management** — review and delete travelers' trips and bookings.
- **App switcher** — jump between the **mobile app** and the **dashboard** in one click.

---

## ⚙️ Platform
- **Local mock backend** ([`src/api/base44Client.js`](src/api/base44Client.js)) — a drop-in replacement for the original Base44 SDK, backed by `localStorage`. Entities: `Trip`, `Booking`, `ItineraryItem`, `Notification`, `PersonalAssistant`, `ChatMessage`, `Destination`, `Promotion`.
- **Stubbed, pluggable AI** ([`src/api/mockLLM.js`](src/api/mockLLM.js)) — canned, schema-aware responses; point it at a real provider with `configureLLM()`.
- **IDR localization** ([`src/lib/currency.js`](src/lib/currency.js)) — `formatIDR` renders e.g. `Rp 1.500.000`.
- **Seeded demo data** with a versioned clean reseed.
- **Cohesive light "luxury" theme** — navy + crimson + cream, glassmorphism, `framer-motion` transitions, accessible contrast, and a consistent component system.

### Tech stack
React 18 · Vite · Tailwind CSS · shadcn/ui (Radix) · React Router · TanStack Query · Framer Motion · Recharts · React-Leaflet · Sonner · date-fns/Moment.

---

## 🚀 Getting started
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```
No environment variables needed — the app seeds its own demo data on first run.
