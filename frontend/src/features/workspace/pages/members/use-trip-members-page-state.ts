import { type FormEvent, useEffect, useMemo, useState } from "react";
import type {
  Member,
  Trip,
  TripMemberAccessStatus,
  TripRole,
} from "@/src/trip/types";
import {
  buildInviteLink,
  filterTripMembers,
  memberSummaryCounts,
  type MemberRoleFilter,
  type MemberStatusFilter,
  visibleTripMembers,
} from "./TripMembersPage.support";
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
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isRotatingInviteToken, setIsRotatingInviteToken] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] =
    useState<Exclude<TripRole, "owner">>("traveler");
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
  const inviteLink = buildInviteLink(trip.joinId, joinInviteToken);
  const filteredMembers = useMemo(
    () =>
      filterTripMembers({
        currentMemberId: currentMember.id,
        members: visibleMembers,
        query,
        roleFilter,
        statusFilter,
      }),
    [currentMember.id, query, roleFilter, statusFilter, visibleMembers],
  );

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function copyInviteLink() {
    /* v8 ignore next */
    if (!canManagePeople) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function rotateInviteToken() {
    if (!canManagePeople || !onRotateJoinInviteToken) return;
    setIsRotatingInviteToken(true);
    try {
      await onRotateJoinInviteToken();
      setCopyState("idle");
    } catch {
      setCopyState("error");
    } finally {
      setIsRotatingInviteToken(false);
    }
  }

  function resetFilters() {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  function submitNewMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = newMemberName.trim();
    if (!canManagePeople || !displayName) return;
    onCreateMember({ displayName, role: newMemberRole });
    setNewMemberName("");
    setNewMemberRole("traveler");
    setCreatePanelOpen(false);
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
