# Landing Page: Icon Holiday Indonesia

The company-profile website visitors see **before** they enter the app. It
stands alone: plain HTML, CSS and JS, **no build step** and no dependencies.

The landing site owns the **root** (`/`). The app lives at `/app/` and the CMS
at `/admin`. Opening `/` redirects to `/landing/`. The same rules apply in
`npm run dev` and in the `npm run build` output.

```
landing/
├── index.html            ← home
├── layanan.html          ← tours · flights · visas · hotels · cruises
├── tour.html             ← package list (filter by region)
│   └── tour-detail.html  ← ?id= : day-by-day itinerary, inclusions, price
├── destinasi.html        ← destination list
│   └── destinasi-detail.html ← ?id= : travel info and related packages
├── visa.html             ← countries we handle (accordion and search)
├── galeri.html           ← photo gallery with lightbox
├── artikel.html          ← article list (filter by topic)
│   └── artikel-detail.html   ← ?id= : article body
├── tentang.html          ← company profile
├── kontak.html           ← contact form and the Medan and Jakarta offices
│
├── data.js      ← ALL content (tours, destinations, articles, services, visas, gallery, reviews, profile)
├── common.js    ← header, footer, icons, menu, animation; used by every page
├── script.js    ← home page only
├── styles.css   ← design, in the WIT house style the app uses
├── assets/      ← logo, favicon and home-screen icon
└── README.md
```

The file names stay in Indonesian so existing links keep working; the content
is in English.

## Running it

```bash
npm run dev
```

Then open <http://localhost:5173>, which redirects to `/landing/`. The app is
at `/app/`, the CMS at `/admin`.

After `npm run build`, this folder is copied to `dist/landing/`.

## Design

`styles.css` follows the WIT house style, with the same tokens as the app
(`src/index.css`):

- A grey canvas (`--surface`) with white cards (`--card`), 24px radius, the
  card shadow and no borders. Borders belong to inputs, rows and dividers.
- One accent: red `--accent` for icons and the period that ends a page title
  (`<span class="dot">.</span>`), `--accent-strong` behind white text such as
  the primary button. Green `--ink` is the one dark surface, used for the
  selected filter chip.
- Every control is a pill. Inputs use a 16px radius and 16px text on phones so
  iOS doesn't zoom in.
- Motion stays small: a 2px lift on cards, a press scale of .98, and nothing
  when the visitor prefers reduced motion.

Older variable names (`--navy`, `--crimson`, `--cream`, ...) remain as aliases
of the WIT tokens, so existing selectors keep working.

## Pages

### Home

| Section | What it shows |
|---|---|
| Hero | One rounded photo card; the next departure (from `TOURS`) sits in its cut-out corner |
| Trust strip | Social links and three facts about the company |
| Popular destinations | A carousel of `DESTS` with the best months to travel, with arrow buttons |
| How it works | Three steps; the middle one on the green ink card |
| Promo | The soonest departure with a reduced price (`priceBefore`), and its seats left |
| About | Short profile, then three big numbers |
| 2026 departures | The next three departures as cards with price and seats left |
| Reviews | Three `REVIEWS`; the middle one on ink |
| Closing call | WhatsApp and the contact page |

Departures and the promo pick themselves from the dates in `TOURS`: a date in
the past drops out, so the home page never advertises a trip that has left.

## Changing content

All content lives in **`data.js`**, one file used by every page. Change it
there and the whole site follows:

- `TOURS`: packages (`price: null` shows "Contact us"; `seats <= 6` shows a seats-left badge; `itinerary`, `includes`, `excludes` and `gallery` fill the detail page)
- `DESTS`: destinations (`best`, `visa` and `currency` show on the detail page)
- `SERVICES`: services (fill `layanan.html` and the footer menu)
- `VISA_COUNTRIES`: the countries on `visa.html`
- `NEWS`: articles (`body` is an array of paragraphs for the detail page)
- `GALLERY`, `REVIEWS`, `COMPANY`: gallery, reviews and the company profile and offices

Adding a package or an article takes one new object: the list page **and** its
detail page pick it up.

The main menu and footer are set in `common.js` (`const NAV`).

## Links to the app and the CMS

**The header shows only "Open App".** The CMS stays out of the top menu on
purpose; staff reach it through **`/admin`** (in the footer and in the
"Choose where to go" section on the home page). The app redirects `/admin` to
`/dashboard`, which asks for the staff sign-in.

Mark a link with `data-link="app"` or `data-link="cms"` and `common.js` fills in
its `href`. Links that a page script injects later still work (a delegated
click handler catches them), or call `window.wireLinks()` after rendering.

| Setup | App | CMS |
|---|---|---|
| Served with the app (default) | `/app/` | `/admin` |
| Deployed separately | `${ICON_APP_ORIGIN}/` | `${ICON_APP_ORIGIN}/admin` |
| Opened over `file://` | `../../index.html` | `../../index.html` * |

\* Deep links need a server (the app uses BrowserRouter, not hash routing), so
over `file://` the CMS button only opens the app.

If the landing site is deployed apart from the app, set its origin before
`script.js` in `index.html`:

```html
<script>window.ICON_APP_ORIGIN = "https://app.iconholiday.id"</script>
<script src="./script.js"></script>
```

## Notes

- **The contact form isn't connected to a backend.** Submitting only shows a
  confirmation on screen. Connect it to email, a CRM or the WhatsApp API before
  real use.
- Phone numbers, office addresses and social links come from the company
  profile; check them again before publishing.
- The number on the floating WhatsApp button is still a **placeholder**
  (`wa.me/6281200000000`); replace it with the real one.
- The reviews are **samples**, not real customer quotes.
- Photos are hotlinked from Unsplash. For production, download them into
  `landing/assets/` so the site doesn't depend on an outside service.
