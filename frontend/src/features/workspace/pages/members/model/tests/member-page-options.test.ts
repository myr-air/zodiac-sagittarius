import { describe, expect, it } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import {
  memberInviteRoleLabel,
  memberInviteRoleValues,
  memberRoleFilterLabel,
  memberRoleFilterValues,
  memberStatusFilterLabel,
  memberStatusFilterValues,
} from "../member-page-options";

describe("member page options", () => {
  it("keeps member role and status filters in shared display order", () => {
    expect(memberInviteRoleValues).toEqual([
      "organizer",
      "traveler",
      "viewer",
    ]);
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

  it("centralizes member filter labels beside filter values", () => {
    expect(memberInviteRoleLabel("organizer", enMessages)).toBe("Organizer");
    expect(memberInviteRoleLabel("traveler", enMessages)).toBe("Traveler");
    expect(memberInviteRoleLabel("viewer", enMessages)).toBe("Viewer");
    expect(memberRoleFilterLabel("all", enMessages)).toBe("All roles");
    expect(memberRoleFilterLabel("owner", enMessages)).toBe("Owner");
    expect(memberStatusFilterLabel("all", enMessages)).toBe("All statuses");
    expect(memberStatusFilterLabel("active", enMessages)).toBe("Active");
    expect(memberStatusFilterLabel("claimed", enMessages)).toBe(enMessages.join.memberStatus.claimed);
    expect(memberStatusFilterLabel("pending", enMessages)).toBe("Pending");
  });
});
