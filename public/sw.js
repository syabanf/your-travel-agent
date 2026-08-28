// Offline-shell service worker for the Icon Holiday PWA.
// Registered only in production (see src/main.jsx) so it never interferes with dev/HMR.

const CACHE = "mora-v2";

// Everything is derived from where this file is served from ('/app/sw.js'), so
// the SW keeps working if the app's base path ever moves.
const BASE = new URL("./", self.location).href; // e.g. https://host/app/
const SHELL = BASE; // the SPA's index.html — every route renders from it

const PRECACHE = [
  SHELL,
  `${BASE}manifest.webmanifest`,
  `${BASE}icon.svg`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  `${BASE}icons/maskable-192.png`,
  `${BASE}icons/apple-touch-icon.png`,
];

const inScope = (url) => url.origin === self.location.origin && url.href.startsWith(BASE);
const isAsset = (url) => inScope(url) && url.pathname.includes("/assets/");

/**
 * The built shell references hashed bundles we can't know the names of ahead of
 * time. Rather than a build step, read them straight out of the shell HTML so a
 * freshly installed SW can serve a working app offline — without this the shell
 * caches but its JS/CSS 404 and you get a blank screen.
 */
async function precacheShellAssets(cache) {
  const res = await fetch(SHELL, { cache: "reload" });
  if (!res.ok) throw new Error(`shell ${res.status}`);
  await cache.put(SHELL, res.clone());

  const html = await res.text();
  const urls = new Set();
  for (const m of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
    const url = new URL(m[1], SHELL);
    if (isAsset(url)) urls.add(url.href);
  }
  // Individually, so one missing file can't void the whole install.
  await Promise.all([...urls].map((u) => cache.add(u).catch(() => {})));
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {})));
      await precacheShellAssets(cache).catch(() => {});
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Last resort when even the shell isn't cached (offline on a cold install).
const offlinePage = () =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Offline · Icon Holiday</title>
<style>
 html,body{height:100%;margin:0}
 body{display:grid;place-items:center;padding:2rem;text-align:center;
   background:#FBFAF5;color:#0B1B3B;
   font:400 15px/1.6 'DM Sans',ui-sans-serif,system-ui,sans-serif}
 h1{font-size:1.25rem;margin:0 0 .5rem;letter-spacing:-.01em}
 p{margin:0;color:#46566F}
 button{margin-top:1.75rem;min-height:44px;padding:0 1.5rem;border:0;border-radius:.75rem;
   background:#AD1F23;color:#fff;font:600 15px/1 inherit;cursor:pointer}
</style></head><body><div>
<h1>You're offline</h1>
<p>Reconnect to pick up where you left off.</p>
<button onclick="location.reload()">Try again</button>
</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Every in-app route is served by the same shell, so cache it once under the
  // shell key instead of accumulating a copy per visited URL.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then((c) => c.put(SHELL, copy)));
          }
          return res;
        })
        .catch(async () => (await caches.match(SHELL)) || offlinePage())
    );
    return;
  }

  // Only our own in-scope files are cached — cross-origin (fonts, tiles, APIs)
  // goes straight to the network so nothing stale or opaque gets stored.
  if (!inScope(url)) return;

  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            // Hashed asset filenames change on every deploy, so caching them is
            // safe; unhashed files would go stale and are left alone.
            if (res.ok && isAsset(url)) {
              const copy = res.clone();
              e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
            }
            return res;
          })
          .catch(() => cached || Response.error())
    )
  );
});
