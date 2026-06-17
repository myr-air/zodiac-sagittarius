import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  buildInviteLink,
  filterTripMembers,
  isMemberJoined,
  memberSummaryCounts,
  visibleTripMembers,
} from "./TripMembersPage.support";

const currentMember = seedTrip.members[0];
const members = visibleTripMembers(seedTrip.members);

describe("TripMembersPage support helpers", () => {
  it("hides the synthetic viewer from workspace member lists", () => {
    expect(members.some((member) => member.id === "member-viewer")).toBe(false);
    expect(members.length).toBe(seedTrip.members.length - 1);
  });

  it("calculates joined, active, disabled, and pending counts", () => {
    const claimedMembers = members.map((member) => {
      if (member.id === "member-beam") return { ...member, claimPasswordHash: "hash" };
      if (member.id === "member-family") return { ...member, accessStatus: "disabled" as const };
      return member;
    });

    expect(memberSummaryCounts(claimedMembers, currentMember.id)).toEqual({
      active: 3,
      disabled: 1,
      joined: 2,
      pending: 2,
      total: 4,
    });
    expect(isMemberJoined(claimedMembers[0], currentMember.id)).toBe(true);
  });

  it("filters members by query, role, and claim status", () => {
    const membersWithDisabledViewer = members.map((member) => member.id === "member-family" ? { ...member, accessStatus: "disabled" as const } : member);

    expect(filterTripMembers({
      currentMemberId: currentMember.id,
      members,
      query: "family",
      roleFilter: "all",
      statusFilter: "all",
    }).map((member) => member.displayName)).toEqual(["Family Member"]);

    expect(filterTripMembers({
      currentMemberId: currentMember.id,
      members: membersWithDisabledViewer,
      query: "",
      roleFilter: "viewer",
      statusFilter: "disabled",
    }).map((member) => member.displayName)).toEqual(["Family Member"]);

    expect(filterTripMembers({
      currentMemberId: currentMember.id,
      members,
      query: "",
      roleFilter: "all",
      statusFilter: "claimed",
    }).map((member) => member.id)).toEqual([currentMember.id]);
  });

  it("builds invite links for join ids and invite tokens", () => {
    expect(buildInviteLink("HK-SZ-2025")).toBe("http://localhost/join/HK-SZ-2025");
    expect(buildInviteLink("HK-SZ-2025", "token value")).toBe("http://localhost/join?token=token%20value");
  });
});
