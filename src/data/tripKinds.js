import { Sparkles, Luggage } from "lucide-react";

/**
 * Trips come in two kinds.
 *
 * A **plan** is something the AI generated and proposed. It isn't a committed
 * trip — it's a starting point the agency still has to price and confirm, so
 * saving one raises an inquiry rather than putting a trip on the books.
 *
 * A **trip** is the real thing: built by hand, or bought as a package.
 */

export const TRIP_KINDS = [
  {
    value: "plan",
    label: "Trip plan",
    short: "Plan",
    icon: Sparkles,
    blurb: "AI-proposed. Sent to our team as an inquiry — nothing is booked yet.",
  },
  {
    value: "trip",
    label: "Trip",
    short: "Trip",
    icon: Luggage,
    blurb: "A confirmed trip in your itinerary.",
  },
];

// Anything without an explicit kind predates the distinction and is a real
// trip — so the default must never reclassify existing data as a proposal.
export const kindOf = (trip) => (trip?.kind === "plan" ? "plan" : "trip");

export const kindMeta = (value) =>
  TRIP_KINDS.find((k) => k.value === value) || TRIP_KINDS[1];

export const isPlan = (trip) => kindOf(trip) === "plan";
export const kindLabel = (trip) => kindMeta(kindOf(trip)).label;
