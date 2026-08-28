import { base44 } from "@/api/base44Client";

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
  const existing = (await base44.entities.Registration.list()).find(
    (r) => normalise(r.email) === addr
  );
  if (existing) return { registration: existing, duplicate: true };

  const registration = await base44.entities.Registration.create({
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
    const match = (await base44.entities.Registration.list()).find(
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
  return base44.entities.Registration.update(id, {
    status,
    reviewed_by: reviewer,
    reviewed_date: new Date().toISOString(),
  });
}

export const REGISTRATION_MESSAGES = {
  pending: "Your account is waiting for an admin to approve it. We'll email you as soon as it's active.",
  rejected: "This registration wasn't approved. Contact the Icon Holiday team if you think that's a mistake.",
};
