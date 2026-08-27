import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// Node 22 defines its own experimental `localStorage` / `sessionStorage`
// globals that resolve to `undefined` unless the process is started with
// --localstorage-file. Because jsdom's `window` IS `globalThis` here, those
// getters shadow jsdom's real Storage objects, so anything touching storage
// silently no-ops in tests. Install a small in-memory Storage instead — it
// keeps tests deterministic and independent of Node flags.
function installStorage(key) {
  if (window[key]) return;
  const map = new Map();
  const storage = {
    getItem: (k) => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(String(k)); },
    clear: () => { map.clear(); },
    key: (i) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
  };
  Object.defineProperty(window, key, { configurable: true, get: () => storage });
}
installStorage("localStorage");
installStorage("sessionStorage");

// jsdom doesn't implement matchMedia — framer-motion's useReducedMotion and a
// few feature checks rely on it.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  });
}

// Start every test from a clean mock-backend store and a clean DOM.
beforeEach(() => {
  try { window.localStorage.clear(); } catch { /* ignore */ }
  try { window.sessionStorage.clear(); } catch { /* ignore */ }
});
afterEach(() => {
  cleanup();
});
