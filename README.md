# Icon Holiday — Your Travel Agent

A mobile-style travel planning app (trips, itineraries, bookings, and an AI
concierge) built with **React + Vite + Tailwind**.

> This project was originally generated on Base44. The Base44 dependency has
> been removed — it now runs **fully standalone** with a local mock backend, so
> no account, API keys, or environment variables are required.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

Other scripts:

```bash
npm run build     # production build → dist/
npm run preview   # preview the production build
npm run lint      # eslint
```

## How the backend works

There is no remote backend. [`src/api/base44Client.js`](src/api/base44Client.js)
is a local, in-browser replacement that implements the small surface the app
uses:

- **Data** — `base44.entities.<Trip|Booking|ItineraryItem|Notification|PersonalAssistant|ChatMessage>`
  with `list / filter / get / create / update / delete`, persisted in
  `localStorage`. Demo data is seeded on first load (see
  [`src/api/mockSeed.js`](src/api/mockSeed.js)).
- **Auth** — a single local demo user (no login screen).
- **AI** — `base44.integrations.Core.InvokeLLM` is **stubbed** with canned,
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

configureLLM(async ({ prompt, response_json_schema }) => {
  // Call your LLM here. Return a string when there's no schema,
  // or an object matching response_json_schema when there is.
});
```

## Tech stack

React 18 · Vite 6 · Tailwind CSS · shadcn/ui (Radix) · React Router · TanStack
Query · Framer Motion · Recharts · Leaflet.
