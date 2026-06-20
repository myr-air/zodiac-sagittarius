import { describe, expect, it } from "vitest";
import {
  buildPortalTripWizardCredentials,
  isValidPortalTripWizardJoinPassword,
} from "./portal-trip-wizard-credentials";

describe("portal trip wizard credentials", () => {
  it("builds route-aware join ids and preserves valid join passwords", () => {
    expect(
      buildPortalTripWizardCredentials({
        accessSalt: "ABC",
        currentJoinPassword: "ABCD-2345",
        destinationNames: ["Tokyo"],
        startDate: "2026-06-21",
      }),
    ).toEqual({
      joinId: "0626-TYO-ABC",
      joinPassword: "ABCD-2345",
    });
  });

  it("generates a replacement password when the current value is invalid", () => {
    const credentials = buildPortalTripWizardCredentials({
      accessSalt: "XYZ",
      currentJoinPassword: "bad-password",
      destinationNames: [],
      startDate: "",
    });

    expect(credentials.joinId).toBe("0000-TRP-XYZ");
    expect(credentials.joinPassword).not.toBe("bad-password");
    expect(isValidPortalTripWizardJoinPassword(credentials.joinPassword)).toBe(true);
  });

  it("validates portal join password shape", () => {
    expect(isValidPortalTripWizardJoinPassword("ABCD-2345")).toBe(true);
    expect(isValidPortalTripWizardJoinPassword("abcd-2345")).toBe(false);
    expect(isValidPortalTripWizardJoinPassword("ABCD2345")).toBe(false);
  });
});
