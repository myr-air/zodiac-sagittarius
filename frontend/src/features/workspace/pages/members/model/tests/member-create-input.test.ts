import { describe, expect, it } from "vitest";
import {
  buildCreateMemberInput,
  canBuildCreateMemberInput,
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

  it("checks whether member creation can be submitted", () => {
    expect(canBuildCreateMemberInput({
      canManagePeople: true,
      displayName: "Guide",
      role: defaultCreatedMemberRole,
    })).toBe(true);
    expect(canBuildCreateMemberInput({
      canManagePeople: true,
      displayName: "  ",
      role: defaultCreatedMemberRole,
    })).toBe(false);
    expect(canBuildCreateMemberInput({
      canManagePeople: false,
      displayName: "Guide",
      role: defaultCreatedMemberRole,
    })).toBe(false);
  });

  it("keeps the default created member role centralized", () => {
    expect(defaultCreatedMemberRole).toBe("traveler");
  });
});
