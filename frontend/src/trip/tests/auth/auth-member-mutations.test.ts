import { describe, expect, it } from "vitest";
import { seedTrip } from "../../seed";
import { getTripFixtureMemberById } from "../../trip-fixtures";
import {
  appendTripParticipant,
  claimTripParticipant,
  createTripParticipant,
  hashLocalSecret,
  linkTripParticipantToUser,
  replaceTripParticipant,
  resetTripParticipantClaim,
  setTripParticipantAccessStatus,
  setTripParticipantPassword,
  updateTripParticipantRole,
  verifyTripParticipantPassword,
} from "../../auth";

describe("trip participant member mutations", () => {
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
    expect(ownerDisabled.members.find((member) => member.id === "member-aom")).toBe(getTripFixtureMemberById("member-aom"));
  });

  it("creates active non-owner participants with unique slugs and rotating colors", () => {
    const existing = createTripParticipant(seedTrip, { displayName: "Nam", role: "traveler" });
    const fallback = createTripParticipant(existing, { displayName: "!!!", role: "viewer" });
    const blank = createTripParticipant(fallback, { displayName: "   ", role: "traveler" });

    expect(existing.members.at(-1)).toMatchObject({ id: "member-nam-2", displayName: "Nam", role: "traveler", accessStatus: "active" });
    expect(fallback.members.at(-1)).toMatchObject({ id: "member-member", displayName: "!!!", role: "viewer" });
    expect(blank).toBe(fallback);
  });

  it("replaces and appends participants from API responses", () => {
    const replacement = {
      ...getTripFixtureMemberById("member-beam"),
      displayName: "Beam updated",
    };
    const replaced = replaceTripParticipant(seedTrip, replacement);
    const appended = appendTripParticipant(seedTrip, {
      id: "member-new",
      displayName: "New friend",
      role: "traveler",
      presence: "offline",
      color: "#111827",
    });

    expect(replaced.members.find((member) => member.id === "member-beam")).toBe(replacement);
    expect(replaced.members.find((member) => member.id === "member-aom")).toBe(getTripFixtureMemberById("member-aom"));
    expect(appended.members).toHaveLength(seedTrip.members.length + 1);
    expect(appended.members.at(-1)?.id).toBe("member-new");
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

  it("links a guest participant to a permanent account", () => {
    const linked = linkTripParticipantToUser(seedTrip, "member-nam", "user-018");
    const member = linked.members.find((candidate) => candidate.id === "member-nam");

    expect(member?.userId).toBe("user-018");
    expect(member?.claimedAt).toBeTruthy();
  });
});
