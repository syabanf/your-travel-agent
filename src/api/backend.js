// The app's entire backend, running in the browser.
//
// There is no server. This module implements the surface the app talks to,
// backed by localStorage:
//
//   backend.entities.<Name>.{ list, filter, get, create, update, delete }
//   backend.auth.{ me, logout }
//   backend.ask({ prompt, schema })       (stubbed — see ./mockLLM.js)
//
// All data lives on-device. Clear it by running `localStorage.clear()` in the
// browser console (it will be re-seeded on next load).

import { buildSeed } from './mockSeed';
import { askLLM } from './mockLLM';

const PREFIX = 'ich_db_';
const SEED_FLAG = `${PREFIX}_seeded_v4`;

const MOCK_USER = {
  id: 'user_local',
  full_name: 'Alex Rivera',
  email: 'traveler@iconholiday.app',
  role: 'user',
};

/* ----------------------------- storage ----------------------------- */
// Fall back to an in-memory store if localStorage is unavailable.

const memory = new Map();
const hasLocalStorage = (() => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const k = `${PREFIX}__test`;
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
})();

function readRaw(key) {
  if (hasLocalStorage) return window.localStorage.getItem(key);
  return memory.has(key) ? memory.get(key) : null;
}
function writeRaw(key, value) {
  if (hasLocalStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // Quota exceeded or storage blocked mid-session — keep the app working
      // by falling back to the in-memory store instead of throwing.
    }
  }
  memory.set(key, value);
}

function readCollection(name) {
  const raw = readRaw(PREFIX + name);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeCollection(name, rows) {
  writeRaw(PREFIX + name, JSON.stringify(rows));
}

/* ----------------------------- helpers ----------------------------- */

const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
const nowISO = () => new Date().toISOString();
const uid = () => `id_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function sortRows(rows, order) {
  if (!order) return rows;
  const desc = order.startsWith('-');
  const field = desc ? order.slice(1) : order;
  return [...rows].sort((a, b) => {
    let av = a?.[field];
    let bv = b?.[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulls last
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return desc ? bv - av : av - bv;
    av = String(av);
    bv = String(bv);
    return desc ? bv.localeCompare(av) : av.localeCompare(bv);
  });
}

function matches(row, query) {
  return Object.entries(query || {}).every(([k, v]) => row?.[k] === v);
}

/* --------------------------- entity layer -------------------------- */

function createEntity(name) {
  return {
    async list(order, limit) {
      let rows = sortRows(readCollection(name), order);
      if (typeof limit === 'number') rows = rows.slice(0, limit);
      return clone(rows);
    },
    async filter(query, order, limit) {
      let rows = readCollection(name).filter((r) => matches(r, query));
      rows = sortRows(rows, order);
      if (typeof limit === 'number') rows = rows.slice(0, limit);
      return clone(rows);
    },
    async get(id) {
      const row = readCollection(name).find((r) => r.id === id);
      return row ? clone(row) : null;
    },
    async create(data) {
      const rows = readCollection(name);
      const row = {
        ...data,
        id: uid(),
        created_date: nowISO(),
        updated_date: nowISO(),
        created_by: MOCK_USER.email,
      };
      rows.push(row);
      writeCollection(name, rows);
      logAudit('create', name, row.id, row);
      return clone(row);
    },
    async update(id, data) {
      const rows = readCollection(name);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`${name} ${id} not found`);
      rows[idx] = { ...rows[idx], ...data, id, updated_date: nowISO() };
      writeCollection(name, rows);
      logAudit('update', name, id, rows[idx]);
      return clone(rows[idx]);
    },
    async delete(id) {
      const all = readCollection(name);
      const removed = all.find((r) => r.id === id);
      const rows = all.filter((r) => r.id !== id);
      writeCollection(name, rows);
      logAudit('delete', name, id, removed);
      return { id };
    },
  };
}

const ENTITY_NAMES = ['Trip', 'Booking', 'ItineraryItem', 'Notification', 'PersonalAssistant', 'ChatMessage', 'Destination', 'Promotion', 'Customer', 'StaffMember', 'TripMember', 'Supplier', 'Lead', 'Campaign', 'AuditLog', 'Page', 'MediaAsset', 'Setting', 'OtaCategory', 'TourPackage', 'Registration', 'FeatureAccess'];

// Business records whose changes are written to the AuditLog (compliance trail).
const AUDITABLE = new Set(['Trip', 'Booking', 'Destination', 'Promotion', 'Customer', 'StaffMember', 'TripMember', 'Supplier', 'Lead', 'Campaign', 'Page', 'MediaAsset', 'Setting', 'TourPackage', 'Registration']);
function logAudit(action, name, id, data) {
  if (!AUDITABLE.has(name)) return;
  try {
    const rows = readCollection('AuditLog');
    const label = data?.title || data?.name || id;
    rows.unshift({ id: uid(), created_date: nowISO(), actor: MOCK_USER.full_name, action, entity: name, entity_id: id, summary: `${action} ${name}${label ? ` — ${label}` : ''}` });
    writeCollection('AuditLog', rows.slice(0, 500));
  } catch { /* never block a write on audit logging */ }
}
const entities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, createEntity(n)]));

/* ------------------------ storage prefix rename --------------------- */
// The product was renamed MORA → Icon Holiday, and the storage keys followed.
// Those keys ARE the database: repointing the app at `ich_*` without moving
// anything would silently empty every existing user's trips, bookings and
// session. This copies each `mora_*` key across on first load, then drops the
// originals — but only once every copy has succeeded, so a failure part-way
// leaves the old data intact to try again next load.

const LEGACY_PREFIX = 'mora_';
const PREFIX_MIGRATED = 'ich_storage_renamed';

function migrateLegacyPrefix() {
  if (!hasLocalStorage) return;
  try {
    if (window.localStorage.getItem(PREFIX_MIGRATED)) return;

    const legacy = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(LEGACY_PREFIX)) legacy.push(key);
    }

    const moved = [];
    for (const oldKey of legacy) {
      const newKey = `ich_${oldKey.slice(LEGACY_PREFIX.length)}`;
      // Never clobber data the renamed app has already written.
      if (window.localStorage.getItem(newKey) === null) {
        window.localStorage.setItem(newKey, window.localStorage.getItem(oldKey));
      }
      moved.push(oldKey);
    }

    for (const oldKey of moved) window.localStorage.removeItem(oldKey);
    window.localStorage.setItem(PREFIX_MIGRATED, nowISO());
  } catch {
    // Quota or a blocked store — leave the legacy keys where they are and
    // retry next load rather than half-moving someone's data.
  }
}
migrateLegacyPrefix();

/* ------------------------------ seeding ---------------------------- */

function ensureSeeded() {
  if (readRaw(SEED_FLAG)) return;
  // Seed any collection that is still empty (preserves existing data; fills in
  // newly added entities like Customer / StaffMember).
  const seed = buildSeed();
  for (const name of ENTITY_NAMES) {
    if (readCollection(name).length === 0) writeCollection(name, seed[name] || []);
  }
  writeRaw(SEED_FLAG, nowISO());
}
ensureSeeded();

/* ----------------------------- migrations -------------------------- */
// Non-destructive, run-once upgrades for data seeded before a feature landed.

const MIGRATION_FLAG = `${PREFIX}_migrated_v10`;
function runMigrations() {
  if (readRaw(MIGRATION_FLAG)) return;
  try {
    const seed = buildSeed();

    // 1. Backfill destination galleries (`images`) for rows seeded before they existed.
    const seedImages = Object.fromEntries(
      (seed.Destination || []).map((d) => [d.id, Array.isArray(d.images) ? d.images : []])
    );
    const rows = readCollection('Destination');
    if (rows.length) {
      let changed = false;
      const next = rows.map((r) => {
        if (Array.isArray(r.images) && r.images.length) return r;
        const imgs = seedImages[r.id]?.length ? seedImages[r.id] : (r.image ? [r.image] : []);
        if (!imgs.length) return r;
        changed = true;
        return { ...r, images: imgs, image: r.image || imgs[0] };
      });
      if (changed) writeCollection('Destination', next);
    }

    // 2. Seed trip members (rosters) for demo data that predates the feature.
    if (readCollection('TripMember').length === 0 && (seed.TripMember || []).length) {
      writeCollection('TripMember', seed.TripMember);
    }

    // 3. Link bookings/trips to customers + add supplier & cost for agency ops.
    const seedBk = Object.fromEntries((seed.Booking || []).map((b) => [b.id, b]));
    const bks = readCollection('Booking');
    if (bks.length) {
      let changed = false;
      const next = bks.map((b) => {
        const patch = {};
        if (b.customer_id == null && seedBk[b.id]?.customer_id) patch.customer_id = seedBk[b.id].customer_id;
        if (b.supplier_id == null && seedBk[b.id]?.supplier_id) patch.supplier_id = seedBk[b.id].supplier_id;
        if (b.cost_price == null) patch.cost_price = seedBk[b.id]?.cost_price ?? Math.round(((b.price || 0) * 0.78) / 50000) * 50000;
        if (Object.keys(patch).length) { changed = true; return { ...b, ...patch }; }
        return b;
      });
      if (changed) writeCollection('Booking', next);
    }
    const seedTr = Object.fromEntries((seed.Trip || []).map((t) => [t.id, t]));
    const trs = readCollection('Trip');
    if (trs.length) {
      let changed = false;
      const next = trs.map((t) => {
        if (t.customer_id == null && seedTr[t.id]?.customer_id) { changed = true; return { ...t, customer_id: seedTr[t.id].customer_id }; }
        return t;
      });
      if (changed) writeCollection('Trip', next);
    }

    // 4. Seed new agency collections if empty.
    for (const nm of ['Supplier', 'Lead', 'Campaign']) {
      if (readCollection(nm).length === 0 && (seed[nm] || []).length) writeCollection(nm, seed[nm]);
    }

    // 5. Seed CMS collections (pages, media, settings) if empty.
    for (const nm of ['Page', 'MediaAsset', 'Setting']) {
      if (readCollection(nm).length === 0 && (seed[nm] || []).length) writeCollection(nm, seed[nm]);
    }

    // v5: backfill newly-added fields from the seed onto existing rows.
    for (const nm of ['Customer', 'Booking', 'Trip', 'Supplier', 'Lead', 'Promotion', 'Destination', 'TourPackage']) {
      const sMap = Object.fromEntries((seed[nm] || []).map((r) => [r.id, r]));
      const rows = readCollection(nm);
      if (!rows.length) continue;
      let changed = false;
      const next = rows.map((r) => {
        const s = sMap[r.id];
        if (!s) return r;
        const patch = {};
        for (const k of Object.keys(s)) { if (!(k in r)) patch[k] = s[k]; }
        if (Object.keys(patch).length) { changed = true; return { ...r, ...patch }; }
        return r;
      });
      if (changed) writeCollection(nm, next);
    }

    // v7: seed the OTA booking categories that drive the mobile app's tabs.
    if (readCollection('OtaCategory').length === 0 && (seed.OtaCategory || []).length) {
      writeCollection('OtaCategory', seed.OtaCategory);
    }

    // v8: seed the sellable holiday packages.
    if (readCollection('TourPackage').length === 0 && (seed.TourPackage || []).length) {
      writeCollection('TourPackage', seed.TourPackage);
    }

    // v9: seed the registration queue, and give every existing booking a
    // paid_amount consistent with the payment_status it already shows — without
    // it, settled bookings would read as unpaid and lock their trips.
    if (readCollection('Registration').length === 0 && (seed.Registration || []).length) {
      writeCollection('Registration', seed.Registration);
    }
    const payRows = readCollection('Booking');
    if (payRows.length) {
      let changed = false;
      const next = payRows.map((b) => {
        if (b.paid_amount != null) return b;
        changed = true;
        const price = Number(b.price) || 0;
        const paid = b.payment_status === 'paid' ? price
          : b.payment_status === 'deposit' ? Math.round(price * 0.3)
          : 0;
        return { ...b, paid_amount: paid, payment_plan: paid && paid < price ? 'dp' : 'full', dp_percent: paid && paid < price ? 30 : 100 };
      });
      if (changed) writeCollection('Booking', next);
    }

    // v10: the locked demo trip's day-by-day plan — what the lock actually hides.
    const itin = readCollection('ItineraryItem');
    if (itin.length) {
      const have = new Set(itin.map((r) => r.id));
      const add = (seed.ItineraryItem || []).filter((r) => !have.has(r.id));
      if (add.length) writeCollection('ItineraryItem', [...itin, ...add]);
    }

    // v6: insert seed rows added after the user first seeded (the spread-out
    // historical demo data). Match by id so anything the user created/edited is
    // left untouched; empty collections are already handled by ensureSeeded.
    for (const nm of ['Customer', 'Booking', 'Trip', 'Lead', 'TourPackage']) {
      const existing = readCollection(nm);
      if (!existing.length) continue;
      const have = new Set(existing.map((r) => r.id));
      const additions = (seed[nm] || []).filter((r) => !have.has(r.id));
      if (additions.length) writeCollection(nm, [...existing, ...additions]);
    }
  } catch {
    /* best-effort — never block app startup on a migration */
  }
  writeRaw(MIGRATION_FLAG, nowISO());
}
runMigrations();

/* ------------------------------- auth ------------------------------ */

const auth = {
  async me() {
    // Sign-in stores who the person said they were. Everything in the app that
    // needs the current user goes through here, so reading it back is what makes
    // a registered name actually show up instead of the demo user's.
    const name = readRaw('ich_user_name');
    const email = readRaw('ich_user_email');
    return clone({
      ...MOCK_USER,
      ...(name ? { full_name: name } : {}),
      ...(email ? { email } : {}),
    });
  },
  // No real session in local mode — these are intentionally inert so the UI
  // controls still work without throwing or redirecting off-app.
  async logout() {
    return { success: true };
  },
};

/* ------------------------------- ai -------------------------------- */
// Stubbed locally; point it at a real provider with configureLLM().

export const backend = { entities, auth, ask: (args) => askLLM(args) };
export default backend;
