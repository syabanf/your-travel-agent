import { describe, it, expect, beforeEach } from "vitest";

/**
 * The `_date` → `_at` timestamp rename.
 *
 * These columns carry every row's creation time and drive the default sort, so
 * a rename that loses them would look like the whole database went blank. The
 * move runs once at import, which means each case needs a fresh module registry
 * with storage staged first.
 */

const importBackend = async () => {
  vi.resetModules();
  return import("@/api/backend");
};

beforeEach(() => {
  window.localStorage.clear();
  // Skip the prefix migration and seeding so these cases test the rename alone.
  window.localStorage.setItem("ich_storage_renamed", "2026-01-01T00:00:00.000Z");
  window.localStorage.setItem("ich_db__seeded_v4", "2026-01-01T00:00:00.000Z");
  window.localStorage.setItem("ich_db__migrated_v10", "2026-01-01T00:00:00.000Z");
});

describe("timestamp column rename", () => {
  it("moves a legacy row's timestamps onto the new names", async () => {
    window.localStorage.setItem("ich_db_Trip", JSON.stringify([{
      id: "t1", title: "Bali", created_date: "2026-01-02T03:04:05.000Z",
      updated_date: "2026-02-02T03:04:05.000Z", created_by: "a@b.c",
    }]));

    const { backend } = await importBackend();
    const trip = await backend.entities.Trip.get("t1");

    expect(trip.created_at).toBe("2026-01-02T03:04:05.000Z");
    expect(trip.updated_at).toBe("2026-02-02T03:04:05.000Z");
    expect(trip).not.toHaveProperty("created_date");
    expect(trip).not.toHaveProperty("updated_date");
    // created_by is a standard audit column, not the old backend's naming.
    expect(trip.created_by).toBe("a@b.c");
  });

  it("keeps the user's own timestamp when both names are present", async () => {
    // A row could pick up the new key from a seed backfill; the value the user
    // actually has must win, and the stale duplicate must go.
    window.localStorage.setItem("ich_db_Trip", JSON.stringify([{
      id: "t1", created_date: "2020-01-01T00:00:00.000Z", created_at: "2026-06-06T00:00:00.000Z",
    }]));

    const { backend } = await importBackend();
    const trip = await backend.entities.Trip.get("t1");
    expect(trip.created_at).toBe("2026-06-06T00:00:00.000Z");
    expect(trip).not.toHaveProperty("created_date");
  });

  it("renames across every entity, not just trips", async () => {
    window.localStorage.setItem("ich_db_Registration", JSON.stringify([{
      id: "r1", email: "x@y.z", status: "approved", reviewed_date: "2026-03-03T00:00:00.000Z",
    }]));
    window.localStorage.setItem("ich_db_FeatureAccess", JSON.stringify([{
      id: "f1", feature: "virtual_guiding", granted_date: "2026-04-04T00:00:00.000Z",
    }]));

    const { backend } = await importBackend();
    expect((await backend.entities.Registration.get("r1")).reviewed_at).toBe("2026-03-03T00:00:00.000Z");
    expect((await backend.entities.FeatureAccess.get("f1")).granted_at).toBe("2026-04-04T00:00:00.000Z");
  });

  it("leaves calendar-date fields alone", async () => {
    // start_date and friends are dates, not timestamps — `_date` is correct.
    window.localStorage.setItem("ich_db_Trip", JSON.stringify([{
      id: "t1", start_date: "2026-09-01", end_date: "2026-09-08", created_date: "2026-01-01T00:00:00.000Z",
    }]));

    const { backend } = await importBackend();
    const trip = await backend.entities.Trip.get("t1");
    expect(trip.start_date).toBe("2026-09-01");
    expect(trip.end_date).toBe("2026-09-08");
    expect(trip.created_at).toBeTruthy();
  });

  it("still sorts by the newest first after the move", async () => {
    // The default order is "-created_at"; if the rename dropped the column,
    // every row would sort as null and the list order would go to pieces.
    window.localStorage.setItem("ich_db_Trip", JSON.stringify([
      { id: "old", created_date: "2020-01-01T00:00:00.000Z" },
      { id: "new", created_date: "2026-01-01T00:00:00.000Z" },
    ]));

    const { backend } = await importBackend();
    const rows = await backend.entities.Trip.list("-created_at");
    expect(rows.map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("runs once and leaves already-migrated data untouched", async () => {
    window.localStorage.setItem("ich_db_Trip", JSON.stringify([
      { id: "t1", created_at: "2026-05-05T00:00:00.000Z" },
    ]));

    const { backend } = await importBackend();
    expect((await backend.entities.Trip.get("t1")).created_at).toBe("2026-05-05T00:00:00.000Z");
    expect(window.localStorage.getItem("ich_db__columns_renamed_v1")).toBeTruthy();
  });
});
