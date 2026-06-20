import { describe, expect, it } from "vitest";
import {
  memberRoleFilterValues,
  memberStatusFilterValues,
} from "./member-page-options";

describe("member page options", () => {
  it("keeps member role and status filters in shared display order", () => {
    expect(memberRoleFilterValues).toEqual([
      "all",
      "owner",
      "organizer",
      "traveler",
      "viewer",
    ]);
    expect(memberStatusFilterValues).toEqual([
      "all",
      "active",
      "disabled",
      "claimed",
      "pending",
    ]);
  });
});
