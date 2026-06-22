import { type FormEvent, useState } from "react";
import type {
  Member,
  TripMemberAccessStatus,
} from "@/src/trip/types";
import {
  buildMemberTaskDialogSubmission,
  closeMemberTaskDialogState,
  initialMemberTaskDialogFormState,
  openMemberTaskDialogState,
  updateMemberTaskDialogPasswordValue,
} from "../model/member-task-dialog-state";

interface MemberTaskDialogLabels {
  disable: string;
  enable: string;
  passwordTooShort: string;
}

interface UseMemberTaskDialogStateInput {
  labels: MemberTaskDialogLabels;
  onChangeMemberAccessStatus: (
    memberId: string,
    accessStatus: TripMemberAccessStatus,
  ) => void;
  onChangeMemberPassword: (memberId: string, password: string) => void;
  onResetMemberClaim: (memberId: string) => void;
  onTransferOwnership?: (targetMemberId: string) => void;
  visibleMembers: Member[];
}

export function useMemberTaskDialogState({
  labels,
  onChangeMemberAccessStatus,
  onChangeMemberPassword,
  onResetMemberClaim,
  onTransferOwnership,
  visibleMembers,
}: UseMemberTaskDialogStateInput) {
  const [dialogState, setDialogState] = useState(
    initialMemberTaskDialogFormState,
  );

  function findVisibleMember(memberId: string) {
    return visibleMembers.find((candidate) => candidate.id === memberId);
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

  function closeMemberDialog() {
    setDialogState(closeMemberTaskDialogState());
  }

  function setPasswordValue(passwordValue: string) {
    setDialogState((current) =>
      updateMemberTaskDialogPasswordValue(current, passwordValue),
    );
  }

  function submitMemberDialog(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const submission = buildMemberTaskDialogSubmission(
      dialogState,
      labels.passwordTooShort,
    );
    if (submission.kind === "none") return;
    if (submission.kind === "invalidPassword") {
      setDialogState(submission.state);
      return;
    }
    if (submission.kind === "reset") {
      onResetMemberClaim(submission.memberId);
      closeMemberDialog();
      return;
    }
    if (submission.kind === "access") {
      onChangeMemberAccessStatus(
        submission.memberId,
        submission.accessStatus,
      );
      closeMemberDialog();
      return;
    }
    if (submission.kind === "transfer") {
      onTransferOwnership?.(submission.memberId);
      closeMemberDialog();
      return;
    }
    onChangeMemberPassword(submission.memberId, submission.password);
    closeMemberDialog();
  }

  return {
    closeMemberDialog,
    confirmChangeAccessStatus,
    confirmResetClaim,
    confirmTransferOwnership,
    memberDialog: dialogState.dialog,
    passwordError: dialogState.passwordError,
    passwordValue: dialogState.passwordValue,
    promptChangePassword,
    setPasswordValue,
    submitMemberDialog,
  };
}
