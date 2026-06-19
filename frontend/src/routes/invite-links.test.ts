import { describe, expect, it } from "vitest";
import { buildInviteLink } from "./invite-links";

describe("invite link helpers", () => {
  it("builds absolute join links from join codes and invite tokens", () => {
    expect(buildInviteLink("HK-SZ-2025")).toBe("http://localhost/join/HK-SZ-2025");
    expect(buildInviteLink("HK-SZ-2025", "token value")).toBe("http://localhost/join?token=token%20value");
  });
});
