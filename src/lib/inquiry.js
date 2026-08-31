import { backend } from "@/api/backend";

/**
 * Turning an AI-proposed plan into an agency inquiry.
 *
 * A plan the traveller keeps is a sales lead, so it lands in the CRM as one.
 * Regenerating the same plan must not pile up duplicate leads, so the lead is
 * keyed to the trip.
 */

const profile = () => {
  try {
    return {
      name: localStorage.getItem("ich_user_name") || "",
      email: localStorage.getItem("ich_user_email") || "",
    };
  } catch {
    return { name: "", email: "" };
  }
};

/** The existing inquiry for a plan, if one has already been raised. */
export async function inquiryForTrip(tripId) {
  if (!tripId) return null;
  try {
    const rows = await backend.entities.Lead.filter({ trip_id: tripId });
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Raise the inquiry behind a saved plan. Returns the lead — existing or new —
 * or null if it couldn't be written, which must never break saving the plan.
 */
export async function createInquiryForPlan(trip) {
  if (!trip?.id) return null;
  try {
    const existing = await inquiryForTrip(trip.id);
    if (existing) return existing;

    const me = profile();
    const days =
      trip.start_date && trip.end_date
        ? `${trip.start_date} → ${trip.end_date}`
        : "dates flexible";

    return await backend.entities.Lead.create({
      name: me.name || trip.lead_traveler || "App traveller",
      email: me.email || "",
      phone: "",
      source: "ai-plan",
      destination: trip.destination || "",
      budget: Number(trip.budget_total) || 0,
      status: "new",
      priority: "medium",
      party_size: Number(trip.travelers) || 1,
      expected_travel_date: trip.start_date || undefined,
      notes: `AI trip plan: ${trip.title || "Untitled"} (${days}). Awaiting quote.`,
      trip_id: trip.id,
    });
  } catch {
    // The plan itself is saved; a missing lead is recoverable and must not
    // surface to the traveller as a failure.
    return null;
  }
}
