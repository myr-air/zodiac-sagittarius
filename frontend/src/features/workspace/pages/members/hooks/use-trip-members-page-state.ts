import type {
  Member,
  Trip,
  TripMemberAccessStatus,
  TripRole,
} from "@/src/trip/types";
import { useMemberCreateFormState } from "./useMemberCreateFormState";
import { useMemberInviteActions } from "./useMemberInviteActions";
import { useMemberPageDerivedState } from "./useMemberPageDerivedState";
import { useMemberPageFilters } from "./useMemberPageFilters";
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
  const {
    query,
    resetFilters,
    roleFilter,
    setQuery,
    setRoleFilter,
    setStatusFilter,
    statusFilter,
  } = useMemberPageFilters();
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
  const {
    filteredMembers,
    summaryStats,
    visibleMembers,
  } = useMemberPageDerivedState({
    currentMemberId: currentMember.id,
    members: trip.members,
    query,
    roleFilter,
    statusFilter,
  });
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
    query,
    resetFilters,
    roleFilter,
    rotateInviteToken,
    setCreatePanelOpen,
    setNewMemberName,
    setNewMemberRole,
    setPasswordValue,
    setQuery,
    setRoleFilter,
    setStatusFilter,
    statusFilter,
    submitMemberDialog,
    submitNewMember,
    summaryStats,
    visibleMembers,
    closeMemberDialog,
  };
}
