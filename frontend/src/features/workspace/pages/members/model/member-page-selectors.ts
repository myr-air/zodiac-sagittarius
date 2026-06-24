import {
  normalizeSearchQuery,
  textMatchesSearchQuery,
} from "@/src/shared/text-search";
import {
  isTripMemberActive,
  isTripMemberJoined,
  visibleTripMembers as domainVisibleTripMembers,
} from "@/src/trip/members";
import type { Member } from "@/src/trip/types";
import type { MemberRoleFilter, MemberStatusFilter } from "./member-page-options";

export interface MemberSummaryCounts {
  active: number;
  disabled: number;
  joined: number;
  pending: number;
  total: number;
}

export function visibleTripMembers(members: Member[]): Member[] {
  return domainVisibleTripMembers(members);
}

export function memberSummaryCounts(members: Member[], currentMemberId: string): MemberSummaryCounts {
  const active = members.filter(isTripMemberActive).length;
  const joined = members.filter((member) => isTripMemberJoined(member, currentMemberId)).length;
  return {
    active,
    disabled: members.length - active,
    joined,
    pending: members.length - joined,
    total: members.length,
  };
}

export function filterTripMembers({
  currentMemberId,
  members,
  query,
  roleFilter,
  statusFilter,
}: {
  currentMemberId: string;
  members: Member[];
  query: string;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
}): Member[] {
  const normalizedQuery = normalizeSearchQuery(query);
  return members.filter((member) => {
    const matchesQuery =
      !normalizedQuery ||
      textMatchesSearchQuery(member.displayName, normalizedQuery);
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isTripMemberActive(member)) ||
      (statusFilter === "disabled" && !isTripMemberActive(member)) ||
      (statusFilter === "claimed" && isTripMemberJoined(member, currentMemberId)) ||
      (statusFilter === "pending" && !isTripMemberJoined(member, currentMemberId));

    return matchesQuery && matchesRole && matchesStatus;
  });
}
