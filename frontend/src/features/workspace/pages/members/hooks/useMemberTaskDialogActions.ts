import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { TripMemberAccessStatus } from "@/src/trip/types";
import {
  buildMemberTaskDialogSubmission,
  closeMemberTaskDialogState,
  type MemberTaskDialogFormState,
} from "../model/member-task-dialog-state";

interface MemberTaskDialogActionLabels {
  passwordTooShort: string;
}

interface UseMemberTaskDialogActionsInput {
  dialogState: MemberTaskDialogFormState;
  labels: MemberTaskDialogActionLabels;
  onChangeMemberAccessStatus: (
    memberId: string,
    accessStatus: TripMemberAccessStatus,
  ) => void;
  onChangeMemberPassword: (memberId: string, password: string) => void;
  onResetMemberClaim: (memberId: string) => void;
  onTransferOwnership?: (targetMemberId: string) => void;
  setDialogState: Dispatch<SetStateAction<MemberTaskDialogFormState>>;
}

export function useMemberTaskDialogActions({
  dialogState,
  labels,
  onChangeMemberAccessStatus,
  onChangeMemberPassword,
  onResetMemberClaim,
  onTransferOwnership,
  setDialogState,
}: UseMemberTaskDialogActionsInput) {
  function closeMemberDialog() {
    setDialogState(closeMemberTaskDialogState());
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
    submitMemberDialog,
  };
}
