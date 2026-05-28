import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  canTripRole,
  claimTripParticipant,
  createTripParticipantSession,
  verifyTripCredentials,
  verifyTripParticipantPassword,
} from "./auth";

describe("trip participant auth", () => {
  it("accepts the trip join id and trip password before participant selection", () => {
    expect(verifyTripCredentials(seedTrip, { joinId: "HK-SZ-2025", password: "dim-sum-run" })).toBe(true);
    expect(verifyTripCredentials(seedTrip, { joinId: "HK-SZ-2025", password: "wrong" })).toBe(false);
  });

  it("claims an unclaimed participant with a password and creates a local session", () => {
    const trip = {
      ...seedTrip,
      members: seedTrip.members.map((member) =>
        member.id === "member-nam" ? { ...member, claimPasswordHash: undefined, claimedAt: undefined } : member,
      ),
    };

    const claimed = claimTripParticipant(trip, "member-nam", "my-trip-pin");
    const member = claimed.members.find((candidate) => candidate.id === "member-nam");
    const session = createTripParticipantSession(claimed, "member-nam");

    expect(member?.claimedAt).toBeTruthy();
    expect(member?.claimPasswordHash).toBeTruthy();
    expect(verifyTripParticipantPassword(member!, "my-trip-pin")).toBe(true);
    expect(session).toMatchObject({ tripId: seedTrip.id, memberId: "member-nam" });
    expect(session.sessionToken).toMatch(/^local_/);
  });

  it("rejects an existing participant password when someone tries to impersonate them", () => {
    const claimed = claimTripParticipant(seedTrip, "member-beam", "organizer-pin");
    const member = claimed.members.find((candidate) => candidate.id === "member-beam");

    expect(verifyTripParticipantPassword(member!, "bad-pin")).toBe(false);
    expect(verifyTripParticipantPassword(member!, "organizer-pin")).toBe(true);
  });

  it("maps roles to trip capabilities", () => {
    expect(canTripRole("organizer", "managePeople")).toBe(true);
    expect(canTripRole("traveler", "createSuggestion")).toBe(true);
    expect(canTripRole("traveler", "editItinerary")).toBe(false);
    expect(canTripRole("viewer", "viewPlan")).toBe(true);
    expect(canTripRole("viewer", "createSuggestion")).toBe(false);
  });
});
