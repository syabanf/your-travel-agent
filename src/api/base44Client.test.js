import { describe, it, expect, beforeEach } from "vitest";
import { base44 } from "@/api/base44Client";

// Customer is seeded, but setup.js clears localStorage before each test, so we
// start from an empty collection and control the data ourselves.
const Cust = () => base44.entities.Customer;

describe("base44 mock entity CRUD", () => {
  beforeEach(async () => {
    for (const r of await Cust().list()) await Cust().delete(r.id);
  });

  it("create assigns an id + timestamps and is retrievable", async () => {
    const created = await Cust().create({ name: "Test One", tier: "gold" });
    expect(created.id).toBeTruthy();
    expect(created.created_date).toBeTruthy();
    expect(created.name).toBe("Test One");
    expect(await Cust().get(created.id)).toMatchObject({ id: created.id, name: "Test One", tier: "gold" });
  });

  it("list returns all rows and respects the limit", async () => {
    await Cust().create({ name: "A" });
    await Cust().create({ name: "B" });
    await Cust().create({ name: "C" });
    expect((await Cust().list()).length).toBe(3);
    expect((await Cust().list("-created_date", 2)).length).toBe(2);
  });

  it("filter matches by field equality", async () => {
    await Cust().create({ name: "Gold", tier: "gold" });
    await Cust().create({ name: "Bronze", tier: "bronze" });
    const golds = await Cust().filter({ tier: "gold" });
    expect(golds.length).toBe(1);
    expect(golds[0].name).toBe("Gold");
  });

  it("update merges fields, keeps the id, and leaves others untouched", async () => {
    const c = await Cust().create({ name: "Old", tier: "bronze" });
    const updated = await Cust().update(c.id, { tier: "platinum" });
    expect(updated.tier).toBe("platinum");
    expect(updated.name).toBe("Old");
    expect(updated.id).toBe(c.id);
  });

  it("update rejects for a missing id", async () => {
    await expect(Cust().update("does-not-exist", { tier: "gold" })).rejects.toThrow();
  });

  it("delete removes the row", async () => {
    const c = await Cust().create({ name: "Doomed" });
    await Cust().delete(c.id);
    expect(await Cust().get(c.id)).toBeNull();
  });

  it("returns cloned objects — mutating a result never touches the store", async () => {
    const c = await Cust().create({ name: "Immutable", tier: "gold" });
    const got = await Cust().get(c.id);
    got.tier = "MUTATED";
    expect((await Cust().get(c.id)).tier).toBe("gold");
  });
});
