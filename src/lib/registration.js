import { backend } from "@/api/backend";

/**
 * Sign-up approval.
 *
 * Registering doesn't create a session — it files a request that an admin
 * approves in the dashboard. Sign-in then checks that decision.
 */

const normalise = (email) => String(email || "").trim().toLowerCase();

/** File a sign-up request. Re-submitting an email returns the existing one. */
export async function submitRegistration({ full_name, email, phone, note = "" }) {
  const addr = normalise(email);
  const existing = (await backend.entities.Registration.list()).find(
    (r) => normalise(r.email) === addr
  );
  if (existing) return { registration: existing, duplicate: true };

  const registration = await backend.entities.Registration.create({
    full_name: full_name || addr.split("@")[0],
    email: addr,
    phone: phone || "",
    note,
    source: "mobile_app",
    status: "pending",
  });
  return { registration, duplicate: false };
}

/**
 * What Icon Holiday already knows about an account, for prefilling forms:
 * the CRM customer record first, then the approved sign-up, then any trip
 * membership. Empty strings where nothing is known.
 */
export async function accountProfile(email) {
  const addr = normalise(email);
  const [customers, regs, members] = await Promise.all([
    backend.entities.Customer.list(),
    backend.entities.Registration.list(),
    backend.entities.TripMember.list(),
  ]);
  const mine = (rows) => rows.find((r) => normalise(r.email) === addr);
  const cust = mine(customers) || {};
  const reg = mine(regs.filter((r) => r.status === "approved")) || {};
  const member = mine(members) || {};
  return {
    email: addr,
    full_name: cust.name || reg.full_name || member.name || "",
    phone: cust.phone || reg.phone || member.phone || "",
    city: cust.city || "",
    country: cust.country || "",
    date_of_birth: cust.date_of_birth || "",
  };
}

/**
 * The admin's decision for an email.
 *
 * `none` means no request was ever filed. Demo accounts fall in that bucket, so
 * callers let them through — the gate exists to hold *new* sign-ups, not to
 * lock everyone out of a mock backend.
 */
export async function registrationStatus(email) {
  const addr = normalise(email);
  if (!addr) return { status: "none", registration: null };
  try {
    const match = (await backend.entities.Registration.list()).find(
      (r) => normalise(r.email) === addr
    );
    return match ? { status: match.status || "pending", registration: match } : { status: "none", registration: null };
  } catch {
    // Never strand someone at the door because storage hiccuped.
    return { status: "none", registration: null };
  }
}

/** Approve or reject a request, stamping who decided and when. */
export async function decideRegistration(id, status, reviewer = "Admin") {
  return backend.entities.Registration.update(id, {
    status,
    reviewed_by: reviewer,
    reviewed_at: new Date().toISOString(),
  });
}

export const REGISTRATION_MESSAGES = {
  pending: "Your account is waiting for an admin to approve it. We'll email you as soon as it's active.",
  rejected: "This registration wasn't approved. Contact the Icon Holiday team if you think that's a mistake.",
};
