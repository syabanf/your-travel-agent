import { describe, it, expect, beforeEach } from "vitest";
import { backend } from "@/api/backend";
import { LOCK_MS, MAX_ATTEMPTS, lockRemaining, readStaffSession, staffSignIn, staffSignOut } from "@/lib/staffAuth";

const refusal = (p) => p.then(() => null, (e) => e);

describe("staff sign-in", () => {
  // The shared setup clears storage before each test, so seed here.
  beforeEach(async () => {
    for (const [name, email, role, status] of [
      ["Dewi Lestari", "dewi@iconholiday.app", "manager", "active"],
      ["Tom Becker", "tom@iconholiday.app", "editor", "active"],
      ["Rina Putri", "rina@iconholiday.app", "viewer", "invited"],
      ["Alex Rivera", "alex@iconholiday.app", "admin", "active"],
    ]) await backend.entities.StaffMember.create({ name, email, role, status });
  });


  it("signs an active staff member in with their account's role, and logs it", async () => {
    const s = await staffSignIn("Dewi@IconHoliday.app", "demo1234", { remember: true });
    expect(s).toMatchObject({ name: "Dewi Lestari", role: "manager" });
    expect(readStaffSession().email).toBe("dewi@iconholiday.app");
    expect(localStorage.getItem("ich_staff_session")).not.toBeNull();
    const log = await backend.entities.AuditLog.list();
    expect(log.some((r) => r.action === "sign in" && r.actor === "Dewi Lestari")).toBe(true);
    await staffSignOut();
    expect(readStaffSession()).toBeNull();
  });

  it("keeps a session for the tab only unless asked to remember", async () => {
    await staffSignIn("tom@iconholiday.app", "demo1234");
    expect(localStorage.getItem("ich_staff_session")).toBeNull();
    expect(sessionStorage.getItem("ich_staff_session")).not.toBeNull();
  });

  it("refuses an account that hasn't been activated", async () => {
    const err = await refusal(staffSignIn("rina@iconholiday.app", "demo1234"));
    expect(err.refused).toBe(true);
    expect(err.message).toMatch(/activated/);
    expect(readStaffSession()).toBeNull();
  });

  it("counts down wrong attempts, then locks the form", async () => {
    const first = await refusal(staffSignIn("nobody@iconholiday.app", "demo1234"));
    expect(first.message).toBe(`The email or password is wrong. ${MAX_ATTEMPTS - 1} attempts left.`);
    for (let i = 1; i < MAX_ATTEMPTS - 1; i++) await refusal(staffSignIn("alex@iconholiday.app", "short"));
    const last = await refusal(staffSignIn("alex@iconholiday.app", "short"));
    expect(last.locked).toBe(true);
    expect(lockRemaining()).toBeGreaterThan(LOCK_MS - 1000);
    const blocked = await refusal(staffSignIn("alex@iconholiday.app", "demo1234"));
    expect(blocked.locked).toBe(true);
    expect(lockRemaining(Date.now() + LOCK_MS)).toBe(0);
  });
});
