import { describe, expect, it } from "vitest";
import {
  buildCreateMemberInput,
  defaultCreatedMemberRole,
} from "../member-create-input";

describe("member create input", () => {
  it("builds trimmed member create input when management is allowed", () => {
    expect(buildCreateMemberInput({
      canManagePeople: true,
      displayName: "  Guide  ",
      role: "organizer",
    })).toEqual({
      displayName: "Guide",
      role: "organizer",
    });
  });

  it("returns null for blank or unauthorized creation attempts", () => {
    expect(buildCreateMemberInput({
      canManagePeople: true,
      displayName: "   ",
      role: defaultCreatedMemberRole,
    })).toBeNull();
    expect(buildCreateMemberInput({
      canManagePeople: false,
      displayName: "Guide",
      role: defaultCreatedMemberRole,
    })).toBeNull();
  });

  it("keeps the default created member role centralized", () => {
    expect(defaultCreatedMemberRole).toBe("traveler");
  });
});
