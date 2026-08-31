# Icon Holiday — Your Travel Agent

A mobile-style travel planning app (trips, itineraries, bookings, and an AI
concierge) built with **React + Vite + Tailwind**.

> The app runs **fully standalone** on a local, in-browser mock backend — no
> account, API keys, or environment variables are required. Nothing leaves the
> device: every entity lives in `localStorage`.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

### URL map

The company-profile landing page owns the root; the app lives under `/app/`.

| URL | What it serves |
|---|---|
| `/` | redirects to `/landing/` |
| `/landing/…` | company-profile site (static HTML) |
| `/app/` | traveller app |
| `/app/dashboard` | admin CMS |
| `/admin` | friendly alias → `/app/admin` |

This holds in dev and in production: a small Vite plugin performs the same
redirects the nginx config does, so the two never drift.

Other scripts:

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build
npm run lint      # eslint
npm run test:run  # run the test suite once (npm test = watch)
```

## Docker

Nothing to install but Docker — no Node, no npm.

```bash
docker compose up web                    # production build → http://localhost:8080
docker compose --profile dev up dev      # hot-reload dev server → http://localhost:5173
docker compose --profile test run --rm test   # lint + the test suite
```

Ports are overridable: `WEB_PORT=9000 docker compose up web` (same for `DEV_PORT`).

The [`Dockerfile`](Dockerfile) has four stages — `deps`, `dev`, `test` and
`build` → `prod`. Because the app is a pure front-end SPA (all data lives in the
browser), production is just static files: the final image is nginx serving
`dist/`, ~80 MB, running as a non-root user on a read-only filesystem.

`docker build --target test .` is a self-contained CI gate — it runs eslint and
the full vitest suite and fails the build if either is red.

### Routing note

[`docker/nginx.conf`](docker/nginx.conf) deliberately treats two paths
differently, and both matter:

| Path | Behaviour |
|---|---|
| `/landing/*` | Served straight from disk. A missing page returns a real **404** — it must never fall back to the SPA, or a typo'd URL would silently render the app. |
| everything else | Falls back to `/index.html`, because the app uses `BrowserRouter`, so `/dashboard`, `/admin`, `/packages/:id` … have no file on disk. |

Caching follows the same split: hashed `/assets/*` are immutable for a year,
`index.html` and `sw.js` are never cached (so a deploy is picked up immediately
and users can't get pinned to a stale service worker).

## How the backend works

There is no remote backend. [`src/api/backend.js`](src/api/backend.js)
is a local, in-browser replacement that implements the small surface the app
uses:

- **Data** — `backend.entities.<Name>` for each of the 22 entities (`Trip`,
  `Booking`, `Customer`, `Lead`, `TourPackage`, `Registration`, …) with
  `list / filter / get / create / update / delete`, persisted in
  `localStorage`. Mutations to business entities are written to `AuditLog`. Demo
  data is seeded on first load (see [`src/api/mockSeed.js`](src/api/mockSeed.js)),
  and versioned migrations backfill new fields onto existing installs.
- **Auth** — a local session gate: sign in, register (admin-approved) or continue
  as a guest. It is a prototype, not real authentication — the session is a
  `localStorage` flag and role checks are client-side only.
- **AI** — `backend.ask({ prompt, schema })` is **stubbed** with canned,
  schema-aware responses (see [`src/api/mockLLM.js`](src/api/mockLLM.js)), so the
  AI assistant and trip generation work offline.

### Resetting demo data

Run `localStorage.clear()` in the browser console and reload — the demo data
re-seeds automatically.

### Plugging in a real LLM

The AI is stubbed but pluggable. Point it at a real provider (Claude, OpenAI, or
your own proxy) by calling `configureLLM` once at startup, e.g. in
[`src/main.jsx`](src/main.jsx):

```js
import { configureLLM } from '@/api/mockLLM';

configureLLM(async ({ prompt, schema }) => {
  // Call your LLM here. Return a string when there's no schema,
  // or an object matching `schema` when there is.
});
```

## Tech stack

React 18 · Vite 6 · Tailwind CSS · shadcn/ui (Radix) · React Router · TanStack
Query · Framer Motion · Recharts · Leaflet.
