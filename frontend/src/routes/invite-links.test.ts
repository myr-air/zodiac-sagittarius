import { describe, expect, it } from "vitest";
import { buildInviteEmailHref, buildInviteLink } from "./invite-links";

describe("invite link helpers", () => {
  it("builds absolute join links from join codes and invite tokens", () => {
    expect(buildInviteLink("HK-SZ-2025")).toBe("http://localhost/join/HK-SZ-2025");
    expect(buildInviteLink("HK-SZ-2025", "token value")).toBe("http://localhost/join?token=token%20value");
  });

  it("builds encoded invite email links", () => {
    expect(buildInviteEmailHref("Hong Kong May Route", "http://localhost/join?token=created-token")).toBe(
      "mailto:?subject=Join%20Hong%20Kong%20May%20Route&body=Join%20this%20trip%20in%20Joii%3A%20http%3A%2F%2Flocalhost%2Fjoin%3Ftoken%3Dcreated-token",
    );
  });
});
