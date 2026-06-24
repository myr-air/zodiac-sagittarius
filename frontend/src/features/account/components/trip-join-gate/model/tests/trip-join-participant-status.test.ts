import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { participantStatusLabel } from "../trip-join-participant-status";

const labels = {
  claimed: "Claimed",
  disabled: "Disabled",
  linked: "Linked",
  ready: "Ready",
};

describe("trip join participant status", () => {
  it("labels participant access states from member fields", () => {
    const member = seedTrip.members[1];

    expect(participantStatusLabel(member, labels)).toBe("Ready");
    expect(participantStatusLabel({ ...member, accessStatus: "disabled" }, labels)).toBe("Disabled");
    expect(participantStatusLabel({ ...member, userId: "user-1" }, labels)).toBe("Linked");
    expect(participantStatusLabel({ ...member, claimPasswordHash: "hash" }, labels)).toBe("Claimed");
    expect(participantStatusLabel({ ...member, claimedAt: "2026-05-29T00:00:00.000Z" }, labels)).toBe("Claimed");
  });
});
