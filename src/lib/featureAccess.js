import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { backend } from "@/api/backend";

/**
 * Paid add-ons.
 *
 * Virtual Guiding and AI itinerary building are sold, not given. Access is a
 * row in the FeatureAccess collection keyed by (feature, email); the paywall
 * screens read it through `useFeatureAccess` and the checkout grants it.
 */

export const PAID_FEATURES = {
  virtual_guiding: {
    key: "virtual_guiding",
    name: "Virtual Guiding",
    tagline: "A live guide in your pocket, wherever you're standing.",
    price: 149000,
    unit: "per trip",
    perks: [
      "Live audio guiding at every stop",
      "Offline maps and route notes",
      "Ask a guide anything, in real time",
      "Works for the whole travelling party",
    ],
  },
  ai_itinerary: {
    key: "ai_itinerary",
    name: "AI Itinerary Builder",
    tagline: "Day-by-day plans built around how you actually travel.",
    price: 99000,
    unit: "per itinerary",
    perks: [
      "Unlimited AI-generated day plans",
      "Route and budget optimisation",
      "Save straight into your trips",
      "Rebuild as often as you like",
    ],
  },
};

export const featureMeta = (key) => PAID_FEATURES[key] || null;

/** The email access is recorded against — the demo session's, or the demo user. */
export function currentEmail() {
  try {
    return localStorage.getItem("ich_user_email") || "traveler@iconholiday.app";
  } catch {
    return "traveler@iconholiday.app";
  }
}

/**
 * Whether this traveller has bought a feature.
 * Returns `{ unlocked, loading, grant }` — `grant` records the purchase.
 */
export function useFeatureAccess(feature) {
  const email = currentEmail();
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["feature-access", feature, email],
    queryFn: () => backend.entities.FeatureAccess.filter({ feature, user_email: email }),
    enabled: Boolean(feature),
  });

  const grant = useCallback(
    async (bookingId = null) => {
      await backend.entities.FeatureAccess.create({
        feature,
        user_email: email,
        status: "active",
        booking_id: bookingId,
        granted_at: new Date().toISOString(),
      });
      await qc.invalidateQueries({ queryKey: ["feature-access", feature, email] });
    },
    [feature, email, qc]
  );

  return {
    unlocked: data.some((r) => r.status === "active"),
    loading: isLoading,
    grant,
  };
}
