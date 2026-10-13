# Frontend conventions

Icon Holiday follows the WIT house style, white-dominant: a light grey canvas,
borderless white cards, a white rail, one accent for the single most important
thing on screen, pill controls, DM Sans. Copy the reference pages below rather than
inventing a layout.

## Palette

The colours come from the logo file (`src/assets/icon-holiday-logo.webp`), not
from memory. Red `#EF242A` and green `#0C895F` both measure just under 4.5:1
with white text, so they stay in the logo and the app icons, and a darker step
of each carries the tokens.

| Token | Value | Use |
|---|---|---|
| `accent` | `#EF242A` | icons, dots, the accent period, the one highlighted chart value. Never small text: 4.24:1 on white |
| `accent-strong` | `#B3161C` | red text, and any solid accent behind white text: primary button, active tab, count badge |
| `ink` | `#0A6E4C` | small brand marks only: the user avatar. Large surfaces stay white |
| `surface` / `surface-2` | `#F1F4F2` / `#F6F8F7` | page canvas / nested panel inside a card |
| `muted` | `#5E6B65` | secondary text |
| `info` | `#2563A8` | in-progress states, a second chart series |

Classes: `bg-accent-strong`, `text-accent-strong`, `bg-accent-soft`, `text-muted`,
`bg-surface`, `bg-card`, `shadow-card`, `shadow-float`, `shadow-glow`,
`rounded-card`, `rounded-hero`. The values live as RGB channels in
`src/index.css`, so `/opacity` works (`bg-accent/10`).

Code that cannot read classes (Recharts, OpenLayers markers, inline SVG,
`style` props) imports `BRAND`, `SERIES` and `TOOLTIP_STYLE` from
`src/lib/brand.js`. Never write a hex value in a component.

## Reference pages

| Copy this | For |
|---|---|
| `src/dashboard/DashboardOverview.jsx` | an admin dashboard: stat cards, chart cards |
| `src/dashboard/DashboardTrips.jsx` | an admin list: KPI row, filters, DataTable, drawer CRUD |
| `src/dashboard/DashboardBookingDetail.jsx` | an admin record page with document exports |
| `src/pages/TripDetail.jsx` | a phone detail screen with a photo hero |
| `src/pages/BookingCheckout.jsx` | a phone multi-step flow with a primary action |

## Shells

- **Admin** (`src/dashboard/DashboardLayout.jsx`): a floating white rail, hidden on
  phones, 76px icons on tablets, `w-60` from `xl` with a persisted collapse
  choice. Phones open the same nav as a white bottom sheet, never a side drawer.
- **Phone app** (`src/components/Layout.jsx`): `AppHeader` with the logo and
  round icon buttons, `BottomNav` as a white tab bar with the active tab in
  `accent-strong`.
- **Logo**: `src/components/BrandMark.jsx`, a transparent webp, so it sits on white
  and on the grey canvas without a box. Pass `plate` only on a dark surface.

## Rules that break layouts

- Check every new screen at 375, 768 and 1440 wide: `main.scrollWidth` must
  equal `main.clientWidth`, and the page has one `h1`.
- Cards carry no border. Borders belong to inputs, table rows and dividers.
- One accent per region. When a region already has an accent card, the next
  emphasis is ink.
- Red text is `text-accent-strong`. `text-accent` measures 4.24:1 on white and
  3.9:1 on the canvas, below AA for small text.
- Hover on white is `hover:bg-surface`. Never `hover:text-white` without a dark
  hover background; a white-on-light hover made the rail unreadable once.
- Inputs render at 16px on phones (`text-base md:text-sm`) so iOS does not zoom.
