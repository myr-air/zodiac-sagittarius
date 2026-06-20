import { type FormEvent, useEffect, useMemo, useState } from "react";
import type {
  Member,
  Trip,
  TripMemberAccessStatus,
  TripRole,
} from "@/src/trip/types";
import type { MemberTaskDialogState } from "./components/MemberTaskDialog";
import {
  buildInviteLink,
  filterTripMembers,
  memberSummaryCounts,
  type MemberRoleFilter,
  type MemberStatusFilter,
  visibleTripMembers,
} from "./TripMembersPage.support";

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
  const [memberDialog, setMemberDialog] =
    useState<MemberTaskDialogState | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const visibleMembers = useMemo(() => visibleTripMembers(trip.members), [
    trip.members,
  ]);
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

  function findVisibleMember(memberId: string) {
    return visibleMembers.find((candidate) => candidate.id === memberId);
  }

  function confirmResetClaim(memberId: string) {
    const member = findVisibleMember(memberId);
    /* v8 ignore next */
    if (!member) return;
    setMemberDialog({ kind: "reset", member });
  }

  function confirmChangeAccessStatus(
    memberId: string,
    accessStatus: TripMemberAccessStatus,
  ) {
    const member = findVisibleMember(memberId);
    /* v8 ignore next */
    if (!member) return;
    const actionLabel =
      accessStatus === "disabled" ? labels.disable : labels.enable;
    setMemberDialog({ kind: "access", member, accessStatus, actionLabel });
  }

  function confirmTransferOwnership(memberId: string) {
    const member = findVisibleMember(memberId);
    /* v8 ignore next */
    if (!member) return;
    setMemberDialog({ kind: "transfer", member });
  }

  function promptChangePassword(memberId: string) {
    const member = findVisibleMember(memberId);
    /* v8 ignore next */
    if (!member) return;
    setPasswordValue("");
    setPasswordError(null);
    setMemberDialog({ kind: "password", member });
  }

  function closeMemberDialog() {
    setMemberDialog(null);
    setPasswordValue("");
    setPasswordError(null);
  }

  function submitMemberDialog(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!memberDialog) return;
    if (memberDialog.kind === "reset") {
      onResetMemberClaim(memberDialog.member.id);
      closeMemberDialog();
      return;
    }
    if (memberDialog.kind === "access") {
      onChangeMemberAccessStatus(
        memberDialog.member.id,
        memberDialog.accessStatus,
      );
      closeMemberDialog();
      return;
    }
    if (memberDialog.kind === "transfer") {
      onTransferOwnership?.(memberDialog.member.id);
      closeMemberDialog();
      return;
    }
    const password = passwordValue.trim();
    if (password.length < 4) {
      setPasswordError(labels.passwordTooShort);
      return;
    }
    onChangeMemberPassword(memberDialog.member.id, password);
    closeMemberDialog();
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
