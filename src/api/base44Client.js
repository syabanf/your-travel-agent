// Local mock backend — a drop-in replacement for the Base44 SDK.
//
// The app was originally built on Base44, which provided the data store, auth,
// and AI. That dependency has been removed. This module re-implements the small
// surface the app actually uses, backed by the browser's localStorage:
//
//   base44.entities.<Name>.{ list, filter, get, create, update, delete }
//   base44.auth.{ me, logout, redirectToLogin }
//   base44.integrations.Core.InvokeLLM   (stubbed — see ./mockLLM.js)
//
// All data lives on-device. Clear it by running `localStorage.clear()` in the
// browser console (it will be re-seeded on next load).

import { buildSeed } from './mockSeed';
import { invokeLLM } from './mockLLM';

const PREFIX = 'mora_db_';
const SEED_FLAG = `${PREFIX}_seeded_v4`;

const MOCK_USER = {
  id: 'user_local',
  full_name: 'Alex Rivera',
  email: 'traveler@mora.app',
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
  if (hasLocalStorage) window.localStorage.setItem(key, value);
  else memory.set(key, value);
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
    async bulkCreate(items = []) {
      const created = [];
      for (const item of items) created.push(await this.create(item));
      return created;
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

const ENTITY_NAMES = ['Trip', 'Booking', 'ItineraryItem', 'Notification', 'PersonalAssistant', 'ChatMessage', 'Destination', 'Promotion', 'Customer', 'StaffMember', 'TripMember', 'Supplier', 'Lead', 'Campaign', 'AuditLog', 'Page', 'MediaAsset', 'Setting'];

// Business records whose changes are written to the AuditLog (compliance trail).
const AUDITABLE = new Set(['Trip', 'Booking', 'Destination', 'Promotion', 'Customer', 'StaffMember', 'TripMember', 'Supplier', 'Lead', 'Campaign', 'Page', 'MediaAsset', 'Setting']);
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

const MIGRATION_FLAG = `${PREFIX}_migrated_v4`;
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
  } catch {
    /* best-effort — never block app startup on a migration */
  }
  writeRaw(MIGRATION_FLAG, nowISO());
}
runMigrations();

/* ------------------------------- auth ------------------------------ */

const auth = {
  async me() {
    return clone(MOCK_USER);
  },
  // No real session in local mode — these are intentionally inert so the UI
  // controls still work without throwing or redirecting off-app.
  async logout() {
    return { success: true };
  },
  redirectToLogin() {
    // No login provider in local mode.
    console.info('[mock] redirectToLogin() is a no-op — running with a local demo user.');
  },
};

/* -------------------------- integrations --------------------------- */

const integrations = {
  Core: {
    InvokeLLM: (args) => invokeLLM(args),
  },
};

export const base44 = { entities, auth, integrations };
export default base44;
