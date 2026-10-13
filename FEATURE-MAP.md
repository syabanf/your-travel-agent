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
- [Icon Membership v2](#icon-membership-v2)
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
| Booking hub / OTA search | `/booking`, `/ota`, `/booking/search` | `pages/Booking.jsx`, `OTA.jsx`, `BookingSearch.jsx`; searchable origin/destination in `booking/LocationPicker.jsx`, calendar and date range in `DateTimePicker.jsx` | `data/otaCategories.js`, `data/places.js` | `Booking`, `OtaCategory`, `Place` |
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
| **Logo** | all | **`components/BrandMark.jsx`** (`plate` on ink) | — |
| **PWA install prompt** | all | **`components/InstallPrompt.jsx`** (mounted in `Layout.jsx`) | — |

---

## Icon Membership v2

The 67 features from *Icon Membership Apps v2.0* and where each one lives.
Status: **Done** works end to end on the mock backend; **Partial** works with
the gap named in the row. The staging rules, member number, points and
notification audience live in **`src/data/membership.js`** (tested in
`membership.test.js`). Guest state is `isGuest` in `lib/AuthContext.jsx`.

| # | Feature | Status | Where |
|---|---|---|---|
| 1.1 | Home dashboard | Done | `pages/Home.jsx` |
| 1.2 | Quick menu | Done | `components/home/QuickActions.jsx`: Tour packages, Visa info, Promo, My trips, plus 4 app shortcuts (8 tiles) |
| 1.3 | Guest view | Done | `Home.jsx` guest banner; trip and booking cards hidden |
| 1.4 | Member view | Done | prices and trips shown once signed in |
| 2.1 | Member login | Done | `pages/Login.jsx` (sign in, register, demo fill, guest) |
| 2.2 | Member content access | Done | `components/MemberPrice.jsx`; `PackageDetail.jsx` sends guests to /login to book |
| 3.1 | Package listing | Done | `pages/Packages.jsx` |
| 3.2 | Package image | Done | `Packages.jsx`, `PackageDetail.jsx` hero |
| 3.3 | Package overview | Done | `PackageDetail.jsx` |
| 3.4 | Destination information | Done | `PackageDetail.jsx` "Destinations" (countries, cities from seed) |
| 3.5 | Travel schedule | Done | `PackageDetail.jsx` dates and duration |
| 3.6 | Package pricing (members only) | Done | `MemberPrice` in `Packages.jsx`, `HolidayPackages.jsx`, `PackageDetail.jsx` |
| 3.7 | Travel requirements | Done | `PackageDetail.jsx` "Travel requirements", links to /visa |
| 3.8 | Promotional gallery | Done | `PackageDetail.jsx` "Gallery" |
| 3.9 | Package detail | Done | `pages/PackageDetail.jsx` |
| 4.1 | Promotion listing | Done | `pages/Promotions.jsx` (/promotions) |
| 4.2 | Promotion information | Done | `Promotions.jsx` |
| 4.3 | Member promotion | Partial | sent as a Promo notification, broadcast or targeted, from `dashboard/DashboardNotifications.jsx`; no promo page per member |
| 5.1 | Visa information | Done | `pages/VisaInfo.jsx` (/visa), content in Master data > Visa info (`VisaInfo`) |
| 5.2 | Document status and upload | Done | `pages/MyDocuments.jsx` checklist per trip with photo/PDF upload; staff review, send back or upload issued documents in `dashboard/DashboardDocuments.jsx`; files in IndexedDB (`api/files.js`) |
| 5.3 | Document requirements | Done | Master data > Document types decides each trip's checklist (`needsDocument`, `docChecklist` in `data/membership.js`) |
| 6.1 | Upcoming trip | Done | `pages/Itinerary.jsx` tab Upcoming |
| 6.2 | Ongoing trip | Done | `Itinerary.jsx` tab Ongoing |
| 6.3 | Trip history | Done | `Itinerary.jsx` tab History |
| 6.4 | Joined trip detail | Done | `pages/TripDetail.jsx` |
| 7.1 | Trip overview | Done | `components/itinerary/TripMemberInfo.jsx` tab Overview |
| 7.2 | Trip date | Done | `TripDetail.jsx` hero |
| 7.3 | Destination overview | Done | `TripMemberInfo.jsx` route chips |
| 7.4 | Trip benefits | Done | `TripMemberInfo.jsx` "Included" |
| 7.5 | Itinerary overview | Done | `TripDetail.jsx` day-by-day overview before H |
| 7.6 | Daily overview | Done | same, one row per day |
| 8.1 | Departure preparation (H-2) | Done | `TripMemberInfo.jsx` tab Pre-departure, gated by `isPrepOpen` |
| 8.2 | Meeting schedule | Done | Pre-departure "Meeting time" |
| 8.3 | Meeting location | Done | Pre-departure "Meeting point" with map link |
| 8.4 | Tour Leader information | Done | `TourLeader` in `TripMemberInfo.jsx` |
| 8.5 | Required documents | Done | Pre-departure "Bring these documents" |
| 8.6 | Packing information | Done | Pre-departure "What to pack" |
| 9.1 | Detailed itinerary (H) | Done | `TripDetail.jsx` shows `DayTimeline` once `isItineraryOpen` |
| 9.2 | Daily itinerary | Done | `components/itinerary/DayTimeline.jsx` |
| 9.3 | Meeting point | Done | `DayTimeline.jsx` "Meet:" line |
| 9.4 | Activity schedule | Done | `DayTimeline.jsx` |
| 9.5 | Destination detail | Done | `DayTimeline.jsx` "About this place" |
| 9.6 | Destination history | Done | same, `place_info` |
| 9.7 | Itinerary changes | Partial | "Updated" badge and `change_note` per activity, plus an itinerary_change notification; no change log |
| 10.1 | Hotel information | Done | `TripMemberInfo.jsx` tab Travel info |
| 10.2 | Hotel location | Done | Google Maps button per hotel |
| 10.3 | Tour Leader contact | Done | Call and WhatsApp (`lib/whatsapp.js`) |
| 10.4 | WhatsApp group access | Done | "Join the WhatsApp group" |
| 10.5 | Important location | Done | "Important place" rows with directions |
| 11.1 | Push notification | Partial | in-app list and per-category delivery switches; no device push without a backend |
| 11.2 | Broadcast notification | Done | `dashboard/DashboardNotifications.jsx` (/dashboard/notifications) |
| 11.3 | Targeted notification | Done | same; `isForMember` filters the member list |
| 11.4 | Trip notification | Done | category My trips |
| 11.5 | Personal notification | Done | category Personal |
| 11.6 | Document reminder | Done | `DashboardDocuments.jsx` notifies the member on Needed or Action needed |
| 11.7 | Promotion notification | Done | category Promo |
| 11.8 | Notification list | Done | `pages/Notifications.jsx` |
| 11.9 | Notification category | Done | All, My trips, Personal, Promo tabs plus Unread |
| 12.1 | Member profile | Done | `pages/Profile.jsx` |
| 12.2 | Membership number | Done | `memberNumber(email)`, format ICM-2024-XXXXXX |
| 12.3 | Digital member card | Done | `Profile.jsx` card with barcode |
| 12.4 | Member documents | Done | Profile menu "My documents" |
| 12.5 | Member trip list | Done | Profile menu "My trips" |
| 12.6 | Membership overview | Done | Profile stats: Trips, Upcoming, Points (`memberPoints`) |
| 13.1 | Account settings | Done | `pages/ProfileSettings.jsx` |
| 13.2 | Notification settings | Done | settings sheet in `Notifications.jsx`, stored in `ich_notif_prefs` |
| 14.1 | Help menu | Done | `pages/Help.jsx` from Profile |

Departure data (meeting, Tour Leader, hotels, WhatsApp group, packing) and the
per-activity `meeting_point`, `place_info` and `change_note` are seeded in
`api/mockSeed.js` for trip_bali, trip_kyoto and trip_maldives. The admin has no
form to edit them yet. `TravelDocument` is a new entity, seeded by migration v11.

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
| ├ Finance | `/reports/finance` | `DashboardERP.jsx`, figures from the ledger in `lib/accounting.js` | `erp` | `Booking`, `JournalEntry`, `Account` |
| **Accounting** | `/dashboard/accounting?tab=…` (monthly report: `&month=YYYY-MM&vs=both\|prev\|yoy`) | `DashboardAccounting.jsx`, `MonthlyReport.jsx`, `lib/accounting.js`, `lib/monthlyReport.js`, print in `lib/voucher.js` | `accounting` | `Booking` (auto postings), `JournalEntry`, `Account` |
| └ AI reports | `/reports/ai` | `DashboardAIReports.jsx` | `reports` | — |
| Leads / **inquiries** | `/dashboard/leads` | `DashboardLeads.jsx`, `DashboardLeadDetail.jsx` | `leads` | `Lead` |
| Customers | `/dashboard/customers` | `DashboardCustomers.jsx`, `…Detail.jsx` | `customers` | `Customer` |
| **Trips (CRUD)** | `/dashboard/trips` | **`DashboardTrips.jsx`** | `trips` | `Trip`, `ItineraryItem`, `Booking` |
| Trip detail | `/dashboard/trips/:id` | `DashboardTripDetail.jsx` | `trips` | `Trip` |
| **Travel documents** | `/dashboard/documents` | `DashboardDocuments.jsx` | `bookings` | `TravelDocument`, `Notification` |
| **Member notifications** | `/dashboard/notifications` | `DashboardNotifications.jsx` | `marketing` | `Notification` |
| **Staff sign-in** | `/dashboard/login` (`?next=` returns to the page asked for) | `pages/AdminLogin.jsx`, `lib/staffAuth.js`, `RequireStaff` in `App.jsx` | none | `StaffMember`, `AuditLog` |
| **Master data** | `/dashboard/master?tab=…` | `DashboardMasterData.jsx`, tabs in `dashboard/masterData.js` | `master` | `Place`, `DocumentType`, `VisaInfo`, `PaymentMethod`, `TourLeader`, `MeetingPoint`, `Account` (chart of accounts) |
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
| `lib/brand.js` | `BRAND` hex mirror of the theme tokens, `SERIES` chart order, `TOOLTIP_STYLE` | charts, maps, inline SVG |
| `lib/currency.js` | `formatIDR` (note: **non-breaking space** after `Rp`) | app-wide |
| `lib/AuthContext.jsx` | Session, `login`/`logout`, current user | app-wide |
| `lib/csv.js`, `lib/whatsapp.js`, `lib/favorites.js` | Export, deep-links, saved items | various |

### Mock backend

| File | Role |
|---|---|
| `api/backend.js` | Entity CRUD over localStorage, audit trail, **`migrateLegacyPrefix()`**, `ensureSeeded()`, `runMigrations()` |
| `api/mockSeed.js` | `buildSeed()` — every demo row |
| `api/mockLLM.js` | Stubbed `backend.ask()`, swappable via `configureLLM()` |

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
| `Notification` | seed, `DashboardNotifications`, `DashboardDocuments` | `Notifications` (filtered by `isForMember`), `AppHeader` badge |
| `PersonalAssistant`, `ChatMessage` | seed | assistant |
| `TravelDocument` | `DashboardDocuments`, `MyDocuments` (uploads), migration v11 seed | `MyDocuments`, `DashboardDocuments` |
| `Place` | Master data, migration v12 seed from `data/places.js` | Book search `LocationPicker` |
| `DocumentType` | Master data, seed from `data/masterData.js` | Document checklists |
| `VisaInfo` | Master data, seed from `VISA_INFO` | `VisaInfo` page |
| `PaymentMethod` | Master data | `PaymentMethodPicker` (checkout) |
| `TourLeader`, `MeetingPoint` | Master data | Trip editor departure info, copied onto the `Trip` |
| `Account` | Master data > Chart of accounts, migration v13 seed | Accounting, Financial report |
| `JournalEntry` | Accounting (manual entries), migration v13 seed | Accounting, Financial report |
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
