import { describe, it, expect } from "vitest";
import { can, roleLabel, RESOURCES } from "@/dashboard/rbac";

const ACTIONS = ["view", "create", "edit", "delete"];

describe("can()", () => {
  it("admin can do everything on every resource", () => {
    for (const r of RESOURCES) {
      for (const a of ACTIONS) expect(can("admin", r, a)).toBe(true);
    }
  });

  it("viewer is read-only and locked out of team/audit/settings", () => {
    expect(can("viewer", "customers", "view")).toBe(true);
    expect(can("viewer", "customers", "edit")).toBe(false);
    expect(can("viewer", "customers", "delete")).toBe(false);
    expect(can("viewer", "team", "view")).toBe(false);
    expect(can("viewer", "audit", "view")).toBe(false);
    expect(can("viewer", "settings", "view")).toBe(false);
  });

  it("editor can create/edit content but never delete, and can't touch team/settings", () => {
    expect(can("editor", "destinations", "create")).toBe(true);
    expect(can("editor", "destinations", "edit")).toBe(true);
    expect(can("editor", "destinations", "delete")).toBe(false);
    expect(can("editor", "bookings", "edit")).toBe(false); // bookings are view-only for editors
    expect(can("editor", "team", "view")).toBe(false);
    expect(can("editor", "settings", "edit")).toBe(false);
  });

  it("manager has full content access but no team management", () => {
    expect(can("manager", "customers", "delete")).toBe(true);
    expect(can("manager", "team", "view")).toBe(false);
  });

  it("defaults unknown roles to viewer", () => {
    expect(can("nonsense", "customers", "view")).toBe(true);
    expect(can("nonsense", "customers", "delete")).toBe(false);
    expect(can(undefined, "team", "view")).toBe(false);
  });

  it("defaults the action to 'view'", () => {
    expect(can("viewer", "customers")).toBe(true);
  });

  it("denies unknown resources", () => {
    expect(can("admin", "does-not-exist", "view")).toBe(false);
  });
});

describe("roleLabel()", () => {
  it("returns the label for known roles", () => {
    expect(roleLabel("admin")).toBe("Administrator");
    expect(roleLabel("viewer")).toBe("Viewer");
  });
  it("falls back to the key for unknown roles", () => {
    expect(roleLabel("zzz")).toBe("zzz");
  });
});
