import { describe, expect, it } from "vitest";

import {
  assignableTripMembers,
  isSyntheticViewerMember,
  isTripMemberJoined,
  visibleTripMembers,
} from "../../members";
import { seedTrip } from "../../seed";

describe("member visibility", () => {
  it("identifies and hides the synthetic read-only viewer member", () => {
    expect(isSyntheticViewerMember({ id: "member-viewer" })).toBe(true);
    expect(isSyntheticViewerMember({ id: "member-aom" })).toBe(false);
    expect(visibleTripMembers(seedTrip.members).map((member) => member.id)).not.toContain(
      "member-viewer",
    );
  });

  it("returns only active visible members for assignment flows", () => {
    expect(
      assignableTripMembers([
        { id: "member-viewer", accessStatus: "active" },
        { id: "member-active", accessStatus: "active" },
        { id: "member-disabled", accessStatus: "disabled" },
      ]).map((member) => member.id),
    ).toEqual(["member-active"]);
  });

  it("identifies joined members from claims or the current session member", () => {
    expect(isTripMemberJoined({ id: "member-aom", claimPasswordHash: null }, "member-aom")).toBe(true);
    expect(isTripMemberJoined({ id: "member-beam", claimPasswordHash: "hash" }, "member-aom")).toBe(true);
    expect(isTripMemberJoined({ id: "member-beam", claimPasswordHash: null }, "member-aom")).toBe(false);
  });
});
