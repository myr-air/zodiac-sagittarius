import { describe, expect, it } from "vitest";
import { seedTrip } from "./seed";
import {
  canTripRole,
  claimTripParticipant,
  createTripParticipant,
  createTripParticipantSession,
  findSessionMember,
  hashLocalSecret,
  linkTripParticipantToUser,
  resetTripParticipantClaim,
  setTripParticipantPassword,
  setTripParticipantAccessStatus,
  updateTripParticipantRole,
  verifyTripCredentials,
  verifyTripParticipantPassword,
} from "./auth";

describe("trip participant auth", () => {
  it("accepts the seed trip credentials before participant selection", () => {
    expect(verifyTripCredentials(seedTrip, { joinId: "HK-SZ-2025", password: "seed-trip-pass" })).toBe(true);
    expect(verifyTripCredentials(seedTrip, { joinId: " HK-SZ-2025 ", password: " seed-trip-pass " })).toBe(true);
    expect(verifyTripCredentials(seedTrip, { joinId: "HK-SZ-2025", password: "dim-sum-run" })).toBe(false);
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
    expect(session.sessionToken).toMatch(/^local-/);
    expect(session.sessionToken).not.toContain(seedTrip.id);
    expect(session.sessionToken).not.toContain("member-nam");
    expect(session.expiresAt).toBeTruthy();
  });

  it("rejects an existing participant password when someone tries to impersonate them", () => {
    const claimed = claimTripParticipant(seedTrip, "member-beam", "organizer-pin");
    const member = claimed.members.find((candidate) => candidate.id === "member-beam");

    expect(verifyTripParticipantPassword(member!, "bad-pin")).toBe(false);
    expect(verifyTripParticipantPassword(member!, "organizer-pin")).toBe(true);
  });

  it("ignores weak, duplicate, owner, and disabled participant mutations", () => {
    const disabled = setTripParticipantAccessStatus(seedTrip, "member-nam", "disabled");
    const reactivated = setTripParticipantAccessStatus(disabled, "member-nam", "active");
    const weakClaim = claimTripParticipant(seedTrip, "member-nam", "123");
    const duplicateClaim = claimTripParticipant(claimTripParticipant(seedTrip, "member-nam", "first-pin"), "member-nam", "second-pin");
    const weakPassword = setTripParticipantPassword(seedTrip, "member-nam", "123");
    const disabledPassword = setTripParticipantPassword(disabled, "member-nam", "new-pin");
    const ownerDisabled = setTripParticipantAccessStatus(seedTrip, "member-aom", "disabled");

    expect(reactivated.members.find((member) => member.id === "member-nam")?.accessStatus).toBe("active");
    expect(weakClaim).toBe(seedTrip);
    expect(weakPassword).toBe(seedTrip);
    expect(duplicateClaim.members.find((member) => member.id === "member-nam")?.claimPasswordHash).toBe(hashLocalSecret("first-pin"));
    expect(disabledPassword.members.find((member) => member.id === "member-nam")?.claimPasswordHash).toBeNull();
    expect(ownerDisabled.members.find((member) => member.id === "member-aom")).toBe(seedTrip.members.find((member) => member.id === "member-aom"));
  });

  it("creates active non-owner participants with unique slugs and rotating colors", () => {
    const existing = createTripParticipant(seedTrip, { displayName: "Nam", role: "traveler" });
    const fallback = createTripParticipant(existing, { displayName: "!!!", role: "viewer" });
    const blank = createTripParticipant(fallback, { displayName: "   ", role: "traveler" });

    expect(existing.members.at(-1)).toMatchObject({ id: "member-nam-2", displayName: "Nam", role: "traveler", accessStatus: "active" });
    expect(fallback.members.at(-1)).toMatchObject({ id: "member-member", displayName: "!!!", role: "viewer" });
    expect(blank).toBe(fallback);
  });

  it("maps roles to trip capabilities", () => {
    expect(canTripRole("organizer", "managePeople")).toBe(true);
    expect(canTripRole("traveler", "createSuggestion")).toBe(true);
    expect(canTripRole("traveler", "editItinerary")).toBe(false);
    expect(canTripRole("viewer", "viewPlan")).toBe(true);
    expect(canTripRole("viewer", "createSuggestion")).toBe(false);
  });

  it("lets organizers reset a participant claim when someone picked the wrong identity", () => {
    const claimed = claimTripParticipant(seedTrip, "member-nam", "old-pin");
    const reset = resetTripParticipantClaim(claimed, "member-nam");
    const member = reset.members.find((candidate) => candidate.id === "member-nam");

    expect(member?.claimPasswordHash).toBeNull();
    expect(member?.claimedAt).toBeNull();
    expect(member?.lastSeenAt).toBeNull();
    expect(member?.presence).toBe("offline");
  });

  it("lets a participant change their password", () => {
    const changed = setTripParticipantPassword(seedTrip, "member-aom", "new-owner-pin");
    const member = changed.members.find((candidate) => candidate.id === "member-aom");

    expect(member?.claimPasswordHash).toBeTruthy();
    expect(member?.claimedAt).toBeTruthy();
    expect(member?.lastSeenAt).toBeTruthy();
    expect(verifyTripParticipantPassword(member!, "new-owner-pin")).toBe(true);
  });

  it("updates participant roles without demoting the owner", () => {
    const updated = updateTripParticipantRole(seedTrip, "member-nam", "organizer");
    const ownerAttempt = updateTripParticipantRole(updated, "member-aom", "viewer");

    expect(updated.members.find((member) => member.id === "member-nam")?.role).toBe("organizer");
    expect(ownerAttempt.members.find((member) => member.id === "member-aom")?.role).toBe("owner");
  });

  it("disables participant access and clears their claim", () => {
    const claimed = claimTripParticipant(seedTrip, "member-nam", "old-pin");
    const disabled = setTripParticipantAccessStatus(claimed, "member-nam", "disabled");
    const member = disabled.members.find((candidate) => candidate.id === "member-nam");

    expect(member?.accessStatus).toBe("disabled");
    expect(member?.claimPasswordHash).toBeNull();
    expect(member?.claimedAt).toBeNull();
    expect(member?.presence).toBe("offline");
  });

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

  it("links a guest participant to a permanent account", () => {
    const linked = linkTripParticipantToUser(seedTrip, "member-nam", "user-018");
    const member = linked.members.find((candidate) => candidate.id === "member-nam");

    expect(member?.userId).toBe("user-018");
    expect(member?.claimedAt).toBeTruthy();
  });
});
