import type { Dispatch, SetStateAction } from "react";
import { findMemberById } from "@/src/trip/members";
import type {
  Member,
  TripMemberAccessStatus,
} from "@/src/trip/types";
import {
  openMemberTaskDialogState,
  type MemberTaskDialogFormState,
} from "../model/member-task-dialog-state";

interface MemberTaskDialogOpenLabels {
  disable: string;
  enable: string;
}

interface UseMemberTaskDialogOpenActionsInput {
  labels: MemberTaskDialogOpenLabels;
  setDialogState: Dispatch<SetStateAction<MemberTaskDialogFormState>>;
  visibleMembers: Member[];
}

export function useMemberTaskDialogOpenActions({
  labels,
  setDialogState,
  visibleMembers,
}: UseMemberTaskDialogOpenActionsInput) {
  function findVisibleMember(memberId: string) {
    return findMemberById(visibleMembers, memberId);
  }

  function confirmResetClaim(memberId: string) {
    const member = findVisibleMember(memberId);
    /* v8 ignore next */
    if (!member) return;
    setDialogState(openMemberTaskDialogState({ kind: "reset", member }));
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
    setDialogState(
      openMemberTaskDialogState({
        kind: "access",
        member,
        accessStatus,
        actionLabel,
      }),
    );
  }

  function confirmTransferOwnership(memberId: string) {
    const member = findVisibleMember(memberId);
    /* v8 ignore next */
    if (!member) return;
    setDialogState(openMemberTaskDialogState({ kind: "transfer", member }));
  }

  function promptChangePassword(memberId: string) {
    const member = findVisibleMember(memberId);
    /* v8 ignore next */
    if (!member) return;
    setDialogState(openMemberTaskDialogState({ kind: "password", member }));
  }

  return {
    confirmChangeAccessStatus,
    confirmResetClaim,
    confirmTransferOwnership,
    promptChangePassword,
  };
}
