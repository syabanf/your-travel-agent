import { describe, it, expect, beforeEach } from "vitest";
import { backend } from "@/api/backend";
import { submitRegistration, registrationStatus, decideRegistration } from "@/lib/registration";

const wipe = async () => {
  for (const r of await backend.entities.Registration.list()) {
    await backend.entities.Registration.delete(r.id);
  }
};

describe("sign-up approval", () => {
  beforeEach(wipe);

  it("files a request as pending, without granting access", async () => {
    const { registration, duplicate } = await submitRegistration({
      full_name: "Rina Sari",
      email: "Rina.Sari@Example.com",
      phone: "+62 812 0000 1111",
    });
    expect(registration.status).toBe("pending");
    expect(duplicate).toBe(false);
    // Stored lower-cased so a differently-typed address still matches later.
    expect(registration.email).toBe("rina.sari@example.com");
  });

  it("does not stack duplicate requests for one address", async () => {
    await submitRegistration({ full_name: "Rina", email: "rina@example.com" });
    const second = await submitRegistration({ full_name: "Rina", email: "  RINA@example.com " });
    expect(second.duplicate).toBe(true);
    expect(await backend.entities.Registration.list()).toHaveLength(1);
  });

  it("reports the admin's decision, case- and space-insensitively", async () => {
    const { registration } = await submitRegistration({ full_name: "Rina", email: "rina@example.com" });
    expect((await registrationStatus(" RINA@Example.com ")).status).toBe("pending");

    await decideRegistration(registration.id, "approved", "Dewi");
    const after = await registrationStatus("rina@example.com");
    expect(after.status).toBe("approved");
    expect(after.registration.reviewed_by).toBe("Dewi");
    expect(after.registration.reviewed_at).toBeTruthy();
  });

  it("returns 'none' for an address that never registered", async () => {
    // Demo accounts sit in this bucket — callers let them through.
    expect((await registrationStatus("stranger@example.com")).status).toBe("none");
    expect((await registrationStatus("")).status).toBe("none");
    expect((await registrationStatus(undefined)).status).toBe("none");
  });

  it("keeps a rejection visible so sign-in can refuse it", async () => {
    const { registration } = await submitRegistration({ full_name: "Spam", email: "spam@example.com" });
    await decideRegistration(registration.id, "rejected");
    expect((await registrationStatus("spam@example.com")).status).toBe("rejected");
  });
});
