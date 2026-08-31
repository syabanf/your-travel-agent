# Icon Holiday — Feature Map

Where each feature actually lives in the code. [`FEATURES.md`](FEATURES.md)
describes *what* the product does; this file answers *"which file do I open to
change it?"*

Generated against `main` @ `b86d80e`.

---

## Table of contents
- [How the app is laid out](#how-the-app-is-laid-out)
- [URL map](#url-map)
- [Traveller app](#traveller-app)
- [Admin console](#admin-console)
- [Landing site](#landing-site)
- [Shared logic modules](#shared-logic-modules)
- [Data entities](#data-entities)
- [Test coverage map](#test-coverage-map)
- [Adding a feature: the touch points](#adding-a-feature-the-touch-points)

---

## How the app is laid out

| Layer | Directory | What belongs here |
|---|---|---|
| Traveller screens | `src/pages/` | One file per mobile route |
| Admin screens | `src/dashboard/` | One file per CMS route, plus `rbac.js`, `usePagination.js`, `periodCompare.js` |
| Shared UI | `src/components/` | Cross-screen components; `components/ui/` is vendored shadcn/ui (not linted) |
| Business logic | `src/lib/` | Money, access, documents — no JSX |
| Reference data | `src/data/` | Category and kind vocabularies |
| Mock backend | `src/api/` | `backend.js` (storage + migrations), `mockSeed.js`, `mockLLM.js` |
| Company profile | `landing/` | Static HTML, own CSS/JS — no React |

Three shells wrap the screens: `components/Layout.jsx` (mobile, bottom nav +
page transitions), `dashboard/DashboardLayout.jsx` (CMS sidebar), and the
landing site's own `landing/common.js`.

## URL map

| URL | Serves | Config |
|---|---|---|
| `/` → `/landing/` | Company profile | `landingSite()` plugin in [`vite.config.js`](vite.config.js), mirrored in [`docker/nginx.conf`](docker/nginx.conf) |
| `/app/…` | Traveller app | `base: '/app/'`, `outDir: dist/app` |
| `/app/dashboard/…` | Admin console | Nested route in [`src/App.jsx`](src/App.jsx) |
| `/admin` → `/app/dashboard` | Friendly CMS alias | Redirect in both the plugin and nginx |

Every route is declared in one place: [`src/App.jsx`](src/App.jsx). Sidebar
entries live in [`DashboardLayout.jsx`](src/dashboard/DashboardLayout.jsx),
tab bar in [`BottomNav.jsx`](src/components/BottomNav.jsx).

---

## Traveller app

### Auth & onboarding

| Feature | Route | File | Logic | Entity |
|---|---|---|---|---|
| Splash / onboarding | `/splash`, `/onboarding` | `pages/Splash.jsx`, `pages/Onboarding.jsx` | — | — |
| Sign in | `/login` | `pages/Login.jsx` | `lib/AuthContext.jsx` | — |
| **Sign-up + admin approval** | `/register` | `pages/Login.jsx` (`register` prop) | **`lib/registration.js`** | `Registration` |
| Session gating | all | `App.jsx` → `RequireSession` | `lib/AuthContext.jsx` | — |

> Registering files a request; it does not create a session. The gate that
> refuses a pending/rejected sign-in is `registrationStatus()` in
> `lib/registration.js`, called from `Login.jsx`.

### Trips & itineraries

| Feature | Route | File | Logic | Entity |
|---|---|---|---|---|
| Trip list + **Plans tab** | `/itinerary` | `pages/Itinerary.jsx` | **`data/tripKinds.js`** | `Trip` |
| Trip card badge | — | `components/itinerary/TripCard.jsx` | `data/tripKinds.js` | `Trip` |
| Trip detail | `/itinerary/:tripId` | `pages/TripDetail.jsx` | `lib/payments.js`, `lib/inquiry.js`, `data/tripKinds.js` | `Trip`, `Booking`, `ItineraryItem`, `TripMember` |
| **Trip lock** (unpaid) | `/itinerary/:tripId` | `pages/TripDetail.jsx` | **`lib/payments.js` → `tripAccess()`** | `Trip` + `Booking` |
| **Copy deterrence** | `/itinerary/:tripId` | **`components/ProtectedContent.jsx`** | `lib/featureAccess.js` (viewer identity) | — |
| Manual trip create/edit | `/itinerary/new`, `/:tripId/edit` | `pages/NewTrip.jsx` | — | `Trip` |
| **AI trip plan → inquiry** | `/itinerary/wizard` | `pages/TripWizard.jsx` | **`lib/inquiry.js`** | `Trip` (`kind: plan`) + `Lead` |
| Add activity | `/itinerary/:tripId/add` | `pages/AddActivity.jsx` | — | `ItineraryItem` |
| Calendar / Map / Budget / Checklist | `/itinerary/{calendar,map,budget,checklist}` | `pages/CalendarView.jsx`, `MapView.jsx`, `BudgetView.jsx`, `ChecklistView.jsx` | `lib/currency.js` | `Trip`, `ItineraryItem` |

### Booking & payment

| Feature | Route | File | Logic | Entity |
|---|---|---|---|---|
| Booking hub / OTA search | `/booking`, `/ota`, `/booking/search` | `pages/Booking.jsx`, `OTA.jsx`, `BookingSearch.jsx` | `data/otaCategories.js` | `Booking`, `OtaCategory` |
| Booking detail + **balance** | `/booking/:bookingId` | `pages/BookingDetail.jsx` | **`lib/payments.js`**, `lib/voucher.js` | `Booking` |
| **Checkout + DP ladder** | `/booking/:bookingId/checkout` | **`pages/BookingCheckout.jsx`** | **`lib/payments.js`**, `data/packageCategories.js` → `dpOptions()` | `Booking`, `Trip`, `FeatureAccess` |
| **Export receipt** | `/booking/:bookingId` | `pages/BookingDetail.jsx` | **`lib/voucher.js` → `receiptHTML()`** | `Booking` |

> Checkout is the single payment path: package deposits, balance settlement and
> paid add-ons all go through `BookingCheckout.jsx`. It also creates the trip
> behind a package purchase and grants `FeatureAccess` on add-on purchases.

### Packages

| Feature | Route | File | Logic | Entity |
|---|---|---|---|---|
| Package store + filters | `/packages` | `pages/Packages.jsx` | `data/packageCategories.js` | `TourPackage` |
| Package detail → book | `/packages/:id` | `pages/PackageDetail.jsx` | `data/packageCategories.js` | `TourPackage` → `Booking` |
| Home carousel | `/` | `components/home/HolidayPackages.jsx` | `data/packageCategories.js` | `TourPackage` |
| **Signature / Cost Saver tiers** | — | **`data/packageCategories.js`** → `PACKAGE_CATEGORIES` | — | `TourPackage.category` |
| **Minimum DP per package** | — | `data/packageCategories.js` → `minDpPercent()` | — | `TourPackage.min_dp_percent` |

### Assistant & paid add-ons

| Feature | Route | File | Logic | Entity |
|---|---|---|---|---|
| Assistant hub | `/assistant` | `pages/Assistant.jsx` | — | `PersonalAssistant` |
| **AI itinerary (paywalled)** | `/assistant/ai` | `pages/AIAssistant.jsx` | **`lib/featureAccess.js`**, `lib/inquiry.js` | `FeatureAccess`, `Trip`, `Lead` |
| **Virtual Guiding (paywalled)** | `/virtual-guiding` | `pages/VirtualGuiding.jsx` | `lib/featureAccess.js` | `FeatureAccess` |
| **Add-on paywall / purchase** | `/unlock/:feature` | `pages/FeatureUnlock.jsx` | **`lib/featureAccess.js` → `PAID_FEATURES`** | `Booking` → `FeatureAccess` |
| Human concierge booking | `/consultation/:assistantId` | `pages/ConsultationBooking.jsx` | — | `Booking` |

> Add-on catalogue (name, price, perks) is the `PAID_FEATURES` object in
> `lib/featureAccess.js`. Add a key there and it appears at `/unlock/<key>`.

### Profile, discovery, misc

| Feature | Route | File | Entity |
|---|---|---|---|
| Profile + sub-pages | `/profile/*` | `pages/Profile*.jsx` (7 files) | `Customer`, local prefs |
| Destinations | `/destination/:id`, `/search` | `pages/DestinationDetail.jsx`, `Search.jsx` | `Destination` |
| Promotions | `/promotions`, `/promotions/:id` | `pages/Promotions.jsx`, `PromotionDetail.jsx` | `Promotion` |
| Notifications | `/notifications` | `pages/Notifications.jsx` | `Notification` |
| **PWA install prompt** | all | **`components/InstallPrompt.jsx`** (mounted in `Layout.jsx`) | — |

---

## Admin console

RBAC resource names come from
[`dashboard/rbac.js`](src/dashboard/rbac.js) → `RESOURCES`. Every page gates
its controls with `can(role, resource, action)`.

| Section | Route | File | RBAC resource | Entity |
|---|---|---|---|---|
| Overview | `/dashboard` | `DashboardOverview.jsx` | `overview` | many |
| Reports hub | `/dashboard/reports` | `DashboardReportsHub.jsx` | `reports` | many |
| ├ Analytics | `/reports` | `DashboardReports.jsx` | `reports` | — |
| ├ Business | `/reports/business` | `DashboardBusiness.jsx` | `reports` | — |
| ├ Finance | `/reports/finance` | `DashboardERP.jsx` | `erp` | — |
| └ AI reports | `/reports/ai` | `DashboardAIReports.jsx` | `reports` | — |
| Leads / **inquiries** | `/dashboard/leads` | `DashboardLeads.jsx`, `DashboardLeadDetail.jsx` | `leads` | `Lead` |
| Customers | `/dashboard/customers` | `DashboardCustomers.jsx`, `…Detail.jsx` | `customers` | `Customer` |
| **Trips (CRUD)** | `/dashboard/trips` | **`DashboardTrips.jsx`** | `trips` | `Trip`, `ItineraryItem`, `Booking` |
| Trip detail | `/dashboard/trips/:id` | `DashboardTripDetail.jsx` | `trips` | `Trip` |
| Bookings ledger | `/dashboard/bookings` | `DashboardBookings.jsx` | `bookings` | `Booking` |
| **Booking detail + exports** | `/dashboard/bookings/:id` | `DashboardBookingDetail.jsx` | `bookings` | `Booking` |
| **Registrations queue** | `/dashboard/registrations` | **`DashboardRegistrations.jsx`** | `registrations` | `Registration` |
| Destinations | `/dashboard/destinations` | `DashboardDestinations.jsx`, `…Detail.jsx` | `destinations` | `Destination` |
| Promotions | `/dashboard/promotions` | `DashboardPromotions.jsx`, `…Detail.jsx` | `promotions` | `Promotion` |
| **Packages (+ min DP field)** | `/dashboard/packages` | `DashboardPackages.jsx`, `…Detail.jsx` | `promotions` | `TourPackage` |
| Suppliers | `/dashboard/suppliers` | `DashboardSuppliers.jsx`, `…Detail.jsx` | `suppliers` | `Supplier` |
| Marketing | `/dashboard/marketing` | `DashboardMarketing.jsx`, `DashboardCampaignDetail.jsx` | `marketing` | `Campaign` |
| OTA channels | `/dashboard/ota*` | `DashboardOTA.jsx`, `…Transactions.jsx`, `…Categories.jsx` | `ota` | `OtaCategory`, `Booking` |
| PMS | `/dashboard/pms*` | `DashboardPMS.jsx`, `…Transactions.jsx` | `pms` | `Booking` |
| Pages (CMS) | `/dashboard/content` | `DashboardContent.jsx`, `…Detail.jsx` | `content` | `Page` |
| Media | `/dashboard/media` | `DashboardMedia.jsx`, `…Detail.jsx` | `media` | `MediaAsset` |
| Settings | `/dashboard/settings` | `DashboardSettings.jsx` | `settings` | `Setting` |
| Team & roles | `/dashboard/team` | `DashboardTeam.jsx`, `…Detail.jsx` | `team` | `StaffMember` |
| Audit log | `/dashboard/audit` | `DashboardAudit.jsx` | `audit` | `AuditLog` |

Shared dashboard building blocks: `SearchableSelect`, `DataTable`,
`Pagination` + `usePagination.js`, `EmptyState`, `ReadOnlyBanner`,
`periodCompare.js` (period-over-period deltas), `DashboardAiStub.jsx`.

---

## Landing site

Static, no React. Content is centralised so pages stay in sync.

| File | Role |
|---|---|
| `landing/data.js` | **All copy and listings** — edit content here, not in the HTML |
| `landing/common.js` | Header/footer injection, `window.LINKS`, `wireLinks()` |
| `landing/script.js` | Homepage-only behaviour |
| `landing/styles.css` | Landing styles (independent of Tailwind) |

Pages: `index`, `tentang`, `layanan`, `tour` + `tour-detail`, `destinasi` +
`destinasi-detail`, `visa`, `galeri`, `artikel` + `artikel-detail`, `kontak`.

---

## Shared logic modules

The dependency map — change one of these and these are the callers.

| Module | Purpose | Consumers |
|---|---|---|
| **`lib/payments.js`** | Balances, progress, derived payment status, **`tripAccess()`** trip lock | `BookingCheckout`, `BookingDetail`, `TripDetail`, `DashboardTrips`, `lib/voucher` |
| **`lib/featureAccess.js`** | `PAID_FEATURES` catalogue, `useFeatureAccess()`, viewer identity | `FeatureUnlock`, `VirtualGuiding`, `AIAssistant`, `BookingCheckout`, `ProtectedContent` |
| **`lib/registration.js`** | Sign-up submission + admin decision | `Login`, `DashboardRegistrations` |
| **`lib/inquiry.js`** | Turns an AI plan into a CRM `Lead` (deduped per trip) | `TripWizard`, `AIAssistant`, `TripDetail` |
| **`lib/voucher.js`** | `printDocument`, `bookingVoucherHTML`, `tripItineraryHTML`, **`receiptHTML`**, **`quotationHTML`** | `DashboardBookingDetail`, `DashboardTripDetail`, `DashboardAIReports`, `BookingDetail` |
| **`data/tripKinds.js`** | `plan` vs `trip`; defaults to `trip` | `Itinerary`, `TripDetail`, `TripCard` |
| **`data/packageCategories.js`** | Categories (incl. Signature/Cost Saver), `packageTotal`, `minDpPercent`, `dpOptions` | `Packages`, `PackageDetail`, `HolidayPackages`, `BookingCheckout`, `DashboardPackages`, `DashboardPackageDetail` |
| `lib/currency.js` | `formatIDR` (note: **non-breaking space** after `Rp`) | app-wide |
| `lib/AuthContext.jsx` | Session, `login`/`logout`, current user | app-wide |
| `lib/csv.js`, `lib/whatsapp.js`, `lib/favorites.js` | Export, deep-links, saved items | various |

### Mock backend

| File | Role |
|---|---|
| `api/backend.js` | Entity CRUD over localStorage, audit trail, **`migrateLegacyPrefix()`**, `ensureSeeded()`, `runMigrations()` |
| `api/mockSeed.js` | `buildSeed()` — every demo row |
| `api/mockLLM.js` | Stubbed `InvokeLLM`, swappable via `configureLLM()` |

Storage keys are prefixed `ich_` (`ich_db_<Entity>`). The `MIGRATION_FLAG` is
`ich_db__migrated_v10`. **Bumping it?** The first dev reload often sets the flag
without seeding — clear it and reload before assuming the migration is broken.

---

## Data entities

22 entities, all in `ENTITY_NAMES` in `api/backend.js`. Those in
`AUDITABLE` write to `AuditLog` on every mutation.

| Entity | Written by | Read by |
|---|---|---|
| `Trip` | `NewTrip`, `TripWizard`, `AIAssistant`, `BookingCheckout`, `DashboardTrips` | `Itinerary`, `TripDetail`, dashboards |
| `Booking` | `PackageDetail`, `FeatureUnlock`, `BookingCheckout`, `DashboardBookings` | `Booking*`, `TripDetail`, OTA/PMS, reports |
| `ItineraryItem` | `AddActivity`, `TripWizard`, `BookingCheckout`, `DashboardTrips` | `TripDetail`, itinerary views |
| `Lead` | **`lib/inquiry.js`**, `DashboardLeads` | `DashboardLeads`, `TripDetail` |
| `Registration` | `lib/registration.js` | `DashboardRegistrations`, `Login` |
| `FeatureAccess` | `BookingCheckout` | `useFeatureAccess()` |
| `TourPackage` | `DashboardPackages` | `Packages`, `PackageDetail`, `BookingCheckout` |
| `Customer`, `Supplier`, `Campaign`, `StaffMember` | dashboard CRUD | dashboards, reports |
| `Destination`, `Promotion`, `OtaCategory` | dashboard CRUD | mobile discovery + booking tabs |
| `Page`, `MediaAsset`, `Setting` | CMS | CMS, `useAppSettings` |
| `TripMember` | `TripDetail` | `TripDetail`, `DashboardTripDetail` |
| `Notification`, `PersonalAssistant`, `ChatMessage` | seed | assistant + notifications |
| `AuditLog` | automatic | `DashboardAudit` |

---

## Test coverage map

115 tests, 14 files. `npm run test:run`.

| Test file | Covers |
|---|---|
| `api/backend.test.js` | CRUD lifecycle, filtering, audit trail |
| **`api/storagePrefix.test.js`** | `mora_` → `ich_` migration: copy, cleanup, no-clobber, fresh install |
| **`lib/payments.test.js`** | Balances, derived status, `amountForPercent`, `tripAccess` (incl. fail-open) |
| **`lib/registration.test.js`** | Approval gate, dedupe, case-insensitive lookup |
| **`lib/inquiry.test.js`** | Plan → lead, dedupe on regenerate, `kindOf` defaults |
| **`lib/documents.test.js`** | Receipt/quotation output, escaping, per-person vs party total |
| `lib/currency.test.js` | `formatIDR` |
| **`components/ProtectedContent.test.jsx`** | Watermark, blur-on-blur, print notice, blocked copy routes |
| `components/ConfirmDialog.test.jsx` | Confirm/cancel promise resolution |
| `dashboard/rbac.test.js` | Role × resource × action matrix |
| `dashboard/periodCompare.test.js` | Period deltas |
| `dashboard/SearchableSelect.test.jsx` | Combobox keyboard + filtering |
| `data/packageCategories.test.js` | Categories, totals, discounts, DP ladder |
| `pages/BookingCheckout.test.jsx` | Checkout steps + validation |

**Not covered by lint or tests:** `src/components/ui/**` (vendored shadcn/ui).
Everything else under `src/` is linted — see [`eslint.config.js`](eslint.config.js).

---

## Adding a feature: the touch points

A new feature usually needs edits in this order. Doing the shared files first
avoids merge pain when work is parallelised.

1. **Entity** — add to `ENTITY_NAMES` (and `AUDITABLE` if mutations should be
   logged) in `api/backend.js`; add seed rows in `api/mockSeed.js`.
2. **Migration** — bump `MIGRATION_FLAG` and add a non-destructive backfill so
   existing users get the new field.
3. **Logic** — a module in `src/lib/` (no JSX) with its own `.test.js`.
4. **Route** — one line in `src/App.jsx` (+ a `lazy()` import).
5. **Navigation** — `DashboardLayout.jsx` for CMS, `BottomNav.jsx` for mobile.
6. **RBAC** — add the resource to `RESOURCES` and the per-role `PERMS` in
   `dashboard/rbac.js`.
7. **Screen** — `src/pages/` or `src/dashboard/`, matching a sibling's
   structure and reusing its shared components.
8. **Docs** — `FEATURES.md` (what it does) and this file (where it lives).

Verify with `npx vite build`, `npm run lint`, `npm run test:run`.
