import { describe, it, expect, beforeEach } from "vitest";
import { base44 } from "@/api/base44Client";
import { createInquiryForPlan, inquiryForTrip } from "@/lib/inquiry";
import { isPlan, kindOf, kindLabel } from "@/data/tripKinds";

const plan = {
  id: "trip_plan_1",
  title: "Kyoto in autumn",
  destination: "Kyoto, Japan",
  budget_total: 42000000,
  travelers: 2,
  start_date: "2026-11-02",
  end_date: "2026-11-09",
  kind: "plan",
};

beforeEach(async () => {
  for (const l of await base44.entities.Lead.filter({ trip_id: plan.id })) {
    await base44.entities.Lead.delete(l.id);
  }
});

describe("trip kinds", () => {
  it("treats a trip with no kind as a real trip, not a proposal", () => {
    // Every trip that predates the distinction must stay a trip.
    expect(kindOf({})).toBe("trip");
    expect(kindOf(undefined)).toBe("trip");
    expect(isPlan({ is_ai_generated: true })).toBe(false);
  });

  it("recognises an explicit plan", () => {
    expect(isPlan(plan)).toBe(true);
    expect(kindLabel(plan)).toBe("Trip plan");
  });
});

describe("createInquiryForPlan", () => {
  it("raises a lead carrying the plan's details", async () => {
    const lead = await createInquiryForPlan(plan);
    expect(lead).toMatchObject({
      trip_id: plan.id,
      destination: "Kyoto, Japan",
      budget: 42000000,
      party_size: 2,
      status: "new",
      source: "ai-plan",
    });
    expect(lead.notes).toContain("Kyoto in autumn");
  });

  it("does not stack duplicates when a plan is regenerated", async () => {
    const first = await createInquiryForPlan(plan);
    const second = await createInquiryForPlan(plan);
    expect(second.id).toBe(first.id);
    expect(await base44.entities.Lead.filter({ trip_id: plan.id })).toHaveLength(1);
  });

  it("is findable afterwards, so the app can show its stage", async () => {
    await createInquiryForPlan(plan);
    expect((await inquiryForTrip(plan.id)).trip_id).toBe(plan.id);
  });

  it("returns null rather than throwing on junk input", async () => {
    for (const bad of [undefined, null, {}]) {
      expect(await createInquiryForPlan(bad)).toBeNull();
    }
    expect(await inquiryForTrip(undefined)).toBeNull();
  });
});
