import { type FormEvent, type SetStateAction, useMemo, useState } from "react";
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
} from "./model/member-page-selectors";
import {
  buildCreateMemberInput,
  defaultCreatedMemberRole,
} from "./model/member-create-input";
import type {
  MemberRoleFilter,
  MemberStatusFilter,
} from "./model/member-page-options";
import { useMemberInviteActions } from "./use-member-invite-actions";
import { useMemberTaskDialogState } from "./use-member-task-dialog-state";

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

interface MemberFilterState {
  query: string;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
}

interface MemberCreateFormState {
  isOpen: boolean;
  name: string;
  role: Exclude<TripRole, "owner">;
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
  const [filterState, setFilterState] = useState<MemberFilterState>({
    query: "",
    roleFilter: "all",
    statusFilter: "all",
  });
  const [createFormState, setCreateFormState] =
    useState<MemberCreateFormState>({
      isOpen: false,
      name: "",
      role: defaultCreatedMemberRole,
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
    setFilterState((current) => ({ ...current, [field]: value }));
  }

  function updateCreateFormState<Field extends keyof MemberCreateFormState>(
    field: Field,
    value: MemberCreateFormState[Field],
  ) {
    setCreateFormState((current) => ({ ...current, [field]: value }));
  }

  function resetFilters() {
    setFilterState({
      query: "",
      roleFilter: "all",
      statusFilter: "all",
    });
  }

  function setCreatePanelOpen(nextOpen: SetStateAction<boolean>) {
    setCreateFormState((current) => ({
      ...current,
      isOpen: typeof nextOpen === "function" ? nextOpen(current.isOpen) : nextOpen,
    }));
  }

  function submitNewMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildCreateMemberInput({
      canManagePeople,
      displayName: createFormState.name,
      role: createFormState.role,
    });
    if (!input) return;
    onCreateMember(input);
    setCreateFormState({
      isOpen: false,
      name: "",
      role: defaultCreatedMemberRole,
    });
  }

  return {
    confirmChangeAccessStatus,
    confirmResetClaim,
    confirmTransferOwnership,
    copyInviteLink,
    copyState,
    createPanelOpen: createFormState.isOpen,
    filteredMembers,
    inviteLink,
    isRotatingInviteToken,
    memberDialog,
    newMemberName: createFormState.name,
    newMemberRole: createFormState.role,
    passwordError,
    passwordValue,
    promptChangePassword,
    query: filterState.query,
    resetFilters,
    roleFilter: filterState.roleFilter,
    rotateInviteToken,
    setCreatePanelOpen,
    setNewMemberName: (name: string) => updateCreateFormState("name", name),
    setNewMemberRole: (role: Exclude<TripRole, "owner">) =>
      updateCreateFormState("role", role),
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
