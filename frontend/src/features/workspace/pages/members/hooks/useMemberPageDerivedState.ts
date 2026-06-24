import { useMemo } from "react";
import type { Member } from "@/src/trip/types";
import {
  filterTripMembers,
  memberSummaryCounts,
  visibleTripMembers,
} from "../model/member-page-selectors";
import type {
  MemberRoleFilter,
  MemberStatusFilter,
} from "../model/member-page-options";

interface UseMemberPageDerivedStateInput {
  currentMemberId: string;
  members: Member[];
  query: string;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
}

export function useMemberPageDerivedState({
  currentMemberId,
  members,
  query,
  roleFilter,
  statusFilter,
}: UseMemberPageDerivedStateInput) {
  const visibleMembers = useMemo(() => visibleTripMembers(members), [members]);
  const summaryStats = useMemo(
    () => memberSummaryCounts(visibleMembers, currentMemberId),
    [currentMemberId, visibleMembers],
  );
  const filteredMembers = useMemo(
    () =>
      filterTripMembers({
        currentMemberId,
        members: visibleMembers,
        query,
        roleFilter,
        statusFilter,
      }),
    [
      currentMemberId,
      query,
      roleFilter,
      statusFilter,
      visibleMembers,
    ],
  );

  return {
    filteredMembers,
    summaryStats,
    visibleMembers,
  };
}
