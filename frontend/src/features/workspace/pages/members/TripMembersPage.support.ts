import type { Member, TripRole } from "@/src/trip/types";

export { buildInviteLink } from "@/src/routes/invite-links";

export type MemberRoleFilter = "all" | TripRole;
export type MemberStatusFilter = "all" | "active" | "disabled" | "claimed" | "pending";

export interface MemberSummaryCounts {
  active: number;
  disabled: number;
  joined: number;
  pending: number;
  total: number;
}

export function visibleTripMembers(members: Member[]): Member[] {
  return members.filter((member) => member.id !== "member-viewer");
}

export function isMemberJoined(member: Member, currentMemberId: string): boolean {
  return Boolean(member.claimPasswordHash) || member.id === currentMemberId;
}

export function memberSummaryCounts(members: Member[], currentMemberId: string): MemberSummaryCounts {
  const active = members.filter((member) => member.accessStatus !== "disabled").length;
  const joined = members.filter((member) => isMemberJoined(member, currentMemberId)).length;
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
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return members.filter((member) => {
    const matchesQuery = normalizedQuery.length === 0 || member.displayName.toLocaleLowerCase().includes(normalizedQuery);
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && member.accessStatus !== "disabled") ||
      (statusFilter === "disabled" && member.accessStatus === "disabled") ||
      (statusFilter === "claimed" && isMemberJoined(member, currentMemberId)) ||
      (statusFilter === "pending" && !isMemberJoined(member, currentMemberId));

    return matchesQuery && matchesRole && matchesStatus;
  });
}
