import { describe, expect, it } from "vitest";
import { seedTrip } from "../../seed";
import { findMemberById } from "../../members";

describe("member lookup", () => {
  it("finds a trip member by id", () => {
    expect(findMemberById(seedTrip.members, "member-aom")).toMatchObject({
      displayName: "Demo Traveler",
      id: "member-aom",
    });
  });

  it("returns undefined for missing member ids", () => {
    expect(findMemberById(seedTrip.members, "missing-member")).toBeUndefined();
    expect(findMemberById(seedTrip.members, null)).toBeUndefined();
    expect(findMemberById(seedTrip.members, undefined)).toBeUndefined();
  });
});
