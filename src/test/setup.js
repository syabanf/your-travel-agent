import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

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
});
afterEach(() => {
  cleanup();
});
