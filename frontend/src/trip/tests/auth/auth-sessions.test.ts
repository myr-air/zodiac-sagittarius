import { describe, expect, it } from "vitest";
import { seedTrip } from "../../seed";
import {
  createTripParticipantSession,
  findSessionMember,
  setTripParticipantAccessStatus,
} from "../../auth";

describe("trip participant sessions", () => {
  it("rejects expired participant sessions", () => {
    const expiredSession = createTripParticipantSession(seedTrip, "member-nam", {
      now: new Date("2026-05-28T00:00:00.000Z"),
      rememberDays: -1,
    });

    expect(expiredSession.expiresAt).toBe("2026-05-27T00:00:00.000Z");
    expect(findSessionMember(seedTrip, expiredSession, new Date("2026-05-28T00:00:00.000Z"))).toBeNull();
    expect(findSessionMember(seedTrip, null)).toBeNull();
    expect(findSessionMember(seedTrip, { ...expiredSession, tripId: "other-trip" }, new Date("2026-05-26T00:00:00.000Z"))).toBeNull();
    expect(findSessionMember(seedTrip, { ...expiredSession, memberId: "missing-member" }, new Date("2026-05-26T00:00:00.000Z"))).toBeNull();
    expect(findSessionMember(setTripParticipantAccessStatus(seedTrip, "member-nam", "disabled"), { ...expiredSession, memberId: "member-nam" }, new Date("2026-05-26T00:00:00.000Z"))).toBeNull();
  });
});
