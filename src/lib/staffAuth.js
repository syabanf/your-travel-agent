import { backend } from "@/api/backend";

/**
 * Back-office sign-in. Staff accounts are the StaffMember records managed in
 * Team & Roles; the role on the account decides what the dashboard allows.
 *
 * Mock backend: there are no stored passwords, so any password of 8 or more
 * characters passes for an active account. The account status, the lockout
 * and the audit trail behave as they would with a real server.
 */

export const STAFF_KEY = "ich_staff_session";
const ATTEMPTS_KEY = "ich_staff_attempts";
export const MAX_ATTEMPTS = 5;
export const LOCK_MS = 30_000;

const stores = () => [globalThis.localStorage, globalThis.sessionStorage].filter(Boolean);
const norm = (email) => String(email || "").trim().toLowerCase();

/** The signed-in staff member, or null. */
export function readStaffSession() {
  for (const s of stores()) {
    try {
      const v = JSON.parse(s.getItem(STAFF_KEY) || "null");
      if (v?.email) return v;
    } catch { /* unreadable: treat as signed out */ }
  }
  return null;
}

// A refusal carries a message fit to show as is.
const refuse = (message, extra = {}) => Object.assign(new Error(message), { refused: true, ...extra });

const readAttempts = () => {
  try { return JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) || "{}"); } catch { return {}; }
};
const writeAttempts = (v) => { try { sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(v)); } catch { /* ignore */ } };

/** Milliseconds until the form unlocks, 0 when it isn't locked. */
export function lockRemaining(now = Date.now()) {
  const { until = 0 } = readAttempts();
  return Math.max(0, until - now);
}

function fail(message, now) {
  const { count = 0 } = readAttempts();
  const next = count + 1;
  if (next >= MAX_ATTEMPTS) {
    writeAttempts({ count: 0, until: now + LOCK_MS });
    throw refuse(`Too many attempts. Try again in ${LOCK_MS / 1000} seconds.`, { locked: true });
  }
  writeAttempts({ count: next, until: 0 });
  throw refuse(`${message} ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} left.`);
}

const audit = (staff, action) =>
  backend.entities.AuditLog.create({
    actor: staff.name, action, entity: "StaffMember", entity_id: staff.id,
    summary: `${staff.name} ${action === "sign in" ? "signed in to" : "signed out of"} the back office`,
  }).catch(() => {});

/**
 * Checks the account and starts a session. `remember` keeps it across browser
 * restarts; otherwise it ends with the tab. Throws `refused` errors.
 */
export async function staffSignIn(email, password, { remember = false, now = Date.now() } = {}) {
  if (lockRemaining(now)) throw refuse(`Too many attempts. Try again in ${Math.ceil(lockRemaining(now) / 1000)} seconds.`, { locked: true });
  const addr = norm(email);
  const staff = (await backend.entities.StaffMember.list()).find((s) => norm(s.email) === addr);
  if (!staff || String(password || "").length < 8) fail("The email or password is wrong.", now);
  if (staff.status === "invited") throw refuse("This account hasn't been activated yet. Ask an administrator to activate it in Team & Roles.");
  if (staff.status !== "active") throw refuse("This account is suspended. Ask an administrator in Team & Roles to restore it.");

  writeAttempts({});
  const session = { id: staff.id, name: staff.name, email: staff.email, role: staff.role, signed_in_at: new Date(now).toISOString() };
  for (const s of stores()) { try { s.removeItem(STAFF_KEY); } catch { /* ignore */ } }
  try { (remember ? localStorage : sessionStorage).setItem(STAFF_KEY, JSON.stringify(session)); } catch { /* ignore */ }
  await backend.entities.StaffMember.update(staff.id, { last_active: session.signed_in_at }).catch(() => {});
  await audit(staff, "sign in");
  return session;
}

export async function staffSignOut() {
  const staff = readStaffSession();
  for (const s of stores()) { try { s.removeItem(STAFF_KEY); } catch { /* ignore */ } }
  if (staff) await audit(staff, "sign out");
}
