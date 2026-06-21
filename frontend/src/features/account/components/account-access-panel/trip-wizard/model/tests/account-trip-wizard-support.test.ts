import { describe, expect, it } from "vitest";
import {
  buildInviteEmailHref,
  buildInviteLink,
  generateJoinIdForTrip,
} from "../account-trip-wizard-support";

describe("account trip wizard support", () => {
  it("generates route-aware join codes from destination cities", () => {
    expect(generateJoinIdForTrip("2026-06-21", ["Thailand", "Tokyo"], "ABC")).toBe("0626-TYO-ABC");
    expect(buildInviteLink("0626-TYO-ABC", "token value")).toBe("http://localhost/join?token=token%20value");
    expect(buildInviteEmailHref("Tokyo", "http://localhost/join/TYO")).toContain("subject=Join%20Tokyo");
  });
});
