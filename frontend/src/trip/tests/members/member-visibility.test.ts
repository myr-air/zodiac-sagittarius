import { describe, expect, it } from "vitest";

import {
  assignableTripMembers,
  isSyntheticViewerMember,
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
});
