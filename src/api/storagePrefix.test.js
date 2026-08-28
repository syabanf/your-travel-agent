import { describe, it, expect, beforeEach } from "vitest";

/**
 * The MORA → Icon Holiday storage rename.
 *
 * These keys are the database, so the rename has to carry the data across. The
 * client runs the move once at import, which means each case needs a fresh
 * module registry with storage staged beforehand.
 */

const importClient = async () => {
  vi.resetModules();
  return import("@/api/base44Client");
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("legacy prefix migration", () => {
  it("carries a legacy user's collections and session across", async () => {
    const trips = [{ id: "t1", title: "Bali Paradise Escape" }];
    window.localStorage.setItem("mora_db_Trip", JSON.stringify(trips));
    window.localStorage.setItem("mora_session", "1");
    window.localStorage.setItem("mora_user_email", "old@example.com");
    // The seed and migration flags must travel too, or the app would treat a
    // long-standing user as a fresh install.
    window.localStorage.setItem("mora_db__seeded_v4", "2026-01-01T00:00:00.000Z");
    window.localStorage.setItem("mora_db__migrated_v10", "2026-01-01T00:00:00.000Z");

    const { base44 } = await importClient();

    expect(window.localStorage.getItem("ich_session")).toBe("1");
    expect(window.localStorage.getItem("ich_user_email")).toBe("old@example.com");
    expect(window.localStorage.getItem("ich_db__seeded_v4")).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem("ich_db_Trip"))).toEqual(trips);
    // And the data is actually reachable through the client, not just present.
    expect(await base44.entities.Trip.get("t1")).toMatchObject({ title: "Bali Paradise Escape" });
  });

  it("removes the legacy keys once they're copied", async () => {
    window.localStorage.setItem("mora_db_Trip", JSON.stringify([{ id: "t1" }]));
    await importClient();

    expect(window.localStorage.getItem("mora_db_Trip")).toBeNull();
    expect(window.localStorage.getItem("ich_storage_renamed")).toBeTruthy();
  });

  it("never clobbers data the renamed app has already written", async () => {
    window.localStorage.setItem("mora_db_Trip", JSON.stringify([{ id: "old" }]));
    window.localStorage.setItem("ich_db_Trip", JSON.stringify([{ id: "new" }]));

    await importClient();

    const ids = JSON.parse(window.localStorage.getItem("ich_db_Trip")).map((t) => t.id);
    expect(ids).toContain("new");
    expect(ids).not.toContain("old");
    expect(window.localStorage.getItem("mora_db_Trip")).toBeNull();
  });

  it("preserves a legacy row even when later migrations backfill seed data", async () => {
    // A user who never ran migration v10 gets the new seed rows added on top —
    // what matters is that their own row survives untouched.
    window.localStorage.setItem("mora_db_Trip", JSON.stringify([{ id: "mine", title: "My trip" }]));

    const { base44 } = await importClient();

    expect(await base44.entities.Trip.get("mine")).toMatchObject({ title: "My trip" });
  });

  it("leaves unrelated keys alone", async () => {
    window.localStorage.setItem("some_other_app", "keep me");
    await importClient();
    expect(window.localStorage.getItem("some_other_app")).toBe("keep me");
  });

  it("is a no-op for a fresh install", async () => {
    const { base44 } = await importClient();
    // Nothing to move, but the app must still seed and work normally.
    expect((await base44.entities.Trip.list()).length).toBeGreaterThan(0);
    expect(window.localStorage.getItem("ich_storage_renamed")).toBeTruthy();
  });
});
