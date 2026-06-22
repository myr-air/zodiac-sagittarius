import { useMemo, useState } from "react";
import type {
  Member,
  Trip,
  TripMemberAccessStatus,
  TripRole,
} from "@/src/trip/types";
import {
  filterTripMembers,
  memberSummaryCounts,
  visibleTripMembers,
} from "../model/member-page-selectors";
import type {
  MemberRoleFilter,
  MemberStatusFilter,
} from "../model/member-page-options";
import {
  initialMemberFilterState,
  updateMemberFilterState,
  type MemberFilterState,
} from "../model/member-page-state";
import { useMemberCreateFormState } from "./useMemberCreateFormState";
import { useMemberInviteActions } from "./useMemberInviteActions";
import { useMemberTaskDialogState } from "./useMemberTaskDialogState";

interface TripMembersPageStateLabels {
  disable: string;
  enable: string;
  passwordTooShort: string;
}

interface UseTripMembersPageStateInput {
  canManagePeople: boolean;
  currentMember: Member;
  joinInviteToken?: string | null;
  labels: TripMembersPageStateLabels;
  onChangeMemberAccessStatus: (
    memberId: string,
    accessStatus: TripMemberAccessStatus,
  ) => void;
  onChangeMemberPassword: (memberId: string, password: string) => void;
  onCreateMember: (input: {
    displayName: string;
    role: Exclude<TripRole, "owner">;
  }) => void;
  onResetMemberClaim: (memberId: string) => void;
  onRotateJoinInviteToken?: () => Promise<void>;
  onTransferOwnership?: (targetMemberId: string) => void;
  trip: Trip;
}

export function useTripMembersPageState({
  canManagePeople,
  currentMember,
  joinInviteToken,
  labels,
  onChangeMemberAccessStatus,
  onChangeMemberPassword,
  onCreateMember,
  onResetMemberClaim,
  onRotateJoinInviteToken,
  onTransferOwnership,
  trip,
}: UseTripMembersPageStateInput) {
  const [filterState, setFilterState] = useState<MemberFilterState>(
    initialMemberFilterState,
  );
  const {
    createPanelOpen,
    newMemberName,
    newMemberRole,
    setCreatePanelOpen,
    setNewMemberName,
    setNewMemberRole,
    submitNewMember,
  } = useMemberCreateFormState({
    canManagePeople,
    onCreateMember,
  });
  const {
    copyInviteLink,
    copyState,
    inviteLink,
    isRotatingInviteToken,
    rotateInviteToken,
  } = useMemberInviteActions({
    canManagePeople,
    joinId: trip.joinId,
    joinInviteToken,
    onRotateJoinInviteToken,
  });
  const visibleMembers = useMemo(() => visibleTripMembers(trip.members), [
    trip.members,
  ]);
  const {
    closeMemberDialog,
    confirmChangeAccessStatus,
    confirmResetClaim,
    confirmTransferOwnership,
    memberDialog,
    passwordError,
    passwordValue,
    promptChangePassword,
    setPasswordValue,
    submitMemberDialog,
  } = useMemberTaskDialogState({
    labels,
    onChangeMemberAccessStatus,
    onChangeMemberPassword,
    onResetMemberClaim,
    onTransferOwnership,
    visibleMembers,
  });
  const summaryStats = useMemo(
    () => memberSummaryCounts(visibleMembers, currentMember.id),
    [currentMember.id, visibleMembers],
  );
  const filteredMembers = useMemo(
    () =>
      filterTripMembers({
        currentMemberId: currentMember.id,
        members: visibleMembers,
        query: filterState.query,
        roleFilter: filterState.roleFilter,
        statusFilter: filterState.statusFilter,
      }),
    [
      currentMember.id,
      filterState.query,
      filterState.roleFilter,
      filterState.statusFilter,
      visibleMembers,
    ],
  );

  function updateFilterState<Field extends keyof MemberFilterState>(
    field: Field,
    value: MemberFilterState[Field],
  ) {
    setFilterState((current) => updateMemberFilterState(current, field, value));
  }

  function resetFilters() {
    setFilterState(initialMemberFilterState);
  }

  return {
    confirmChangeAccessStatus,
    confirmResetClaim,
    confirmTransferOwnership,
    copyInviteLink,
    copyState,
    createPanelOpen,
    filteredMembers,
    inviteLink,
    isRotatingInviteToken,
    memberDialog,
    newMemberName,
    newMemberRole,
    passwordError,
    passwordValue,
    promptChangePassword,
    query: filterState.query,
    resetFilters,
    roleFilter: filterState.roleFilter,
    rotateInviteToken,
    setCreatePanelOpen,
    setNewMemberName,
    setNewMemberRole,
    setPasswordValue,
    setQuery: (query: string) => updateFilterState("query", query),
    setRoleFilter: (roleFilter: MemberRoleFilter) =>
      updateFilterState("roleFilter", roleFilter),
    setStatusFilter: (statusFilter: MemberStatusFilter) =>
      updateFilterState("statusFilter", statusFilter),
    statusFilter: filterState.statusFilter,
    submitMemberDialog,
    submitNewMember,
    summaryStats,
    visibleMembers,
    closeMemberDialog,
  };
}
