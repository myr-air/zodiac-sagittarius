import { describe, expect, it } from "vitest";
import {
  tripInvitableRoleValues,
  tripMemberAccessStatusValues,
  tripRoleValues,
} from "../../members";

describe("trip member type values", () => {
  it("keeps member roles and access statuses in canonical order", () => {
    expect(tripRoleValues).toEqual(["owner", "organizer", "traveler", "viewer"]);
    expect(tripInvitableRoleValues).toEqual(["organizer", "traveler", "viewer"]);
    expect(tripMemberAccessStatusValues).toEqual(["active", "disabled"]);
  });
});
