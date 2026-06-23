import { describe, expect, it } from "vitest";
import {
  ACCOUNT_PORTAL_PROFILE_FALLBACK_AVATAR_COLOR,
  accountPortalProfileEmail,
  buildAccountPortalProfileDisplay,
} from "../account-portal-profile-display";

describe("account portal profile display", () => {
  it("builds display values from profile fields", () => {
    expect(
      buildAccountPortalProfileDisplay({
        avatarColor: "#0f766e",
        displayName: "May",
        email: "may@example.test",
        noEmail: "No email loaded",
      }),
    ).toEqual({
      avatarColor: "#0f766e",
      avatarInitial: "M",
      displayName: "May",
      email: "may@example.test",
    });
  });

  it("keeps portal profile fallbacks in one place", () => {
    expect(
      buildAccountPortalProfileDisplay({
        avatarColor: null,
        displayName: "",
        email: null,
        noEmail: "No email loaded",
      }),
    ).toEqual({
      avatarColor: ACCOUNT_PORTAL_PROFILE_FALLBACK_AVATAR_COLOR,
      avatarInitial: "A",
      displayName: "",
      email: "No email loaded",
    });
  });

  it("normalizes portal email labels consistently", () => {
    expect(accountPortalProfileEmail("may@example.test", "No email loaded")).toBe("may@example.test");
    expect(accountPortalProfileEmail(null, "No email loaded")).toBe("No email loaded");
    expect(accountPortalProfileEmail(undefined, "No email loaded")).toBe("No email loaded");
  });
});
