import { describe, it, expect } from "vitest";
import {
  daysUntil, isPrepOpen, isItineraryOpen, tripPhase, memberNumber, memberPoints,
  notificationCategory, isForMember, docStatus, needsDocument, docChecklist,
} from "@/data/membership";
import { DEFAULT_DOCUMENT_TYPES } from "@/data/masterData";

const NOW = new Date("2026-10-13T10:00:00").getTime();
const trip = (start, end) => ({ start_date: start, end_date: end });

describe("staged trip information", () => {
  it("counts whole days to departure", () => {
    expect(daysUntil(trip("2026-10-16"), NOW)).toBe(3);
    expect(daysUntil(trip("2026-10-13"), NOW)).toBe(0);
    expect(daysUntil({}, NOW)).toBeNull();
  });

  it("opens pre-departure on H-2, not H-3", () => {
    expect(isPrepOpen(trip("2026-10-16"), NOW)).toBe(false); // H-3
    expect(isPrepOpen(trip("2026-10-15"), NOW)).toBe(true); // H-2
  });

  it("opens the detailed itinerary on the day of departure", () => {
    expect(isItineraryOpen(trip("2026-10-14"), NOW)).toBe(false); // H-1
    expect(isItineraryOpen(trip("2026-10-13"), NOW)).toBe(true); // H
  });

  it("phases a trip from its dates", () => {
    expect(tripPhase(trip("2026-11-01", "2026-11-08"), NOW)).toBe("upcoming");
    expect(tripPhase(trip("2026-10-15", "2026-10-20"), NOW)).toBe("prep");
    expect(tripPhase(trip("2026-10-10", "2026-10-20"), NOW)).toBe("ongoing");
    expect(tripPhase(trip("2026-09-01", "2026-09-07"), NOW)).toBe("past");
  });
});

describe("membership", () => {
  it("gives a stable, well-formed member number per email", () => {
    const a = memberNumber("traveler@iconholiday.app");
    expect(a).toMatch(/^ICM-\d{4}-\d{6}$/);
    expect(memberNumber("TRAVELER@iconholiday.app")).toBe(a);
    expect(memberNumber("someone@else.com")).not.toBe(a);
  });

  it("awards one point per Rp 100.000 actually paid", () => {
    expect(memberPoints([{ paid_amount: 1_850_000 }, { paid_amount: 64_500_000 }, {}])).toBe(663);
    expect(memberPoints([])).toBe(0);
  });
});

describe("notifications", () => {
  it("files older notifications into a category by type", () => {
    expect(notificationCategory({ type: "promo" })).toBe("promo");
    expect(notificationCategory({ type: "document" })).toBe("personal");
    expect(notificationCategory({ type: "booking_update" })).toBe("trip");
    expect(notificationCategory({ type: "promo", category: "trip" })).toBe("trip");
  });

  it("shows a broadcast to everyone and a targeted one only to its recipients", () => {
    expect(isForMember({ audience: "all" }, "a@b.c")).toBe(true);
    expect(isForMember({}, "a@b.c")).toBe(true);
    const targeted = { audience: "targeted", recipients: ["Rina@Example.com"] };
    expect(isForMember(targeted, "rina@example.com")).toBe(true);
    expect(isForMember(targeted, "someone@else.com")).toBe(false);
  });

  it("describes an unknown document status without throwing", () => {
    expect(docStatus("approved").label).toBe("Ready");
    expect(docStatus("weird").label).toBe("weird");
    expect(docStatus(undefined).label).toBe("Unknown");
  });
});

describe("document checklist", () => {
  const bali = { id: "trip_bali", countries: ["Indonesia"] };
  const kyoto = { id: "trip_kyoto", destination: "Kyoto, Japan" };
  const keys = (trip, docs = []) => docChecklist(trip, DEFAULT_DOCUMENT_TYPES, docs).map((i) => `${i.type.key}:${i.status}`);

  it("asks for an ID card at home and a passport abroad", () => {
    const passport = DEFAULT_DOCUMENT_TYPES.find((t) => t.key === "passport");
    expect(needsDocument(passport, bali)).toBe(false);
    expect(needsDocument(passport, kyoto)).toBe(true);
    expect(needsDocument({ ...passport, active: false }, kyoto)).toBe(false);
  });

  it("lists what the trip needs, waiting on the member or the team", () => {
    expect(keys(bali)).toEqual(["id_card:requested", "ticket:preparing"]);
    expect(keys(kyoto, [{ trip_id: "trip_kyoto", type: "passport", status: "approved" }])).toEqual(
      ["passport:approved", "photo:requested", "visa:preparing", "ticket:preparing", "insurance:preparing"],
    );
  });

  it("keeps an extra document the team asked for", () => {
    expect(keys(bali, [{ trip_id: "trip_bali", type: "vaccine", status: "requested" }])).toContain("vaccine:requested");
  });
});
