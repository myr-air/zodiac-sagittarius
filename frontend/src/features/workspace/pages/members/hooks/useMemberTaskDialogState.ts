import { useState } from "react";
import type { Member, TripMemberAccessStatus } from "@/src/trip/types";
import {
  initialMemberTaskDialogFormState,
  updateMemberTaskDialogPasswordValue,
} from "../model/member-task-dialog-state";
import { useMemberTaskDialogActions } from "./useMemberTaskDialogActions";
import { useMemberTaskDialogOpenActions } from "./useMemberTaskDialogOpenActions";

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

  function setPasswordValue(passwordValue: string) {
    setDialogState((current) =>
      updateMemberTaskDialogPasswordValue(current, passwordValue),
    );
  }

  const {
    closeMemberDialog,
    submitMemberDialog,
  } = useMemberTaskDialogActions({
    dialogState,
    labels,
    onChangeMemberAccessStatus,
    onChangeMemberPassword,
    onResetMemberClaim,
    onTransferOwnership,
    setDialogState,
  });
  const {
    confirmChangeAccessStatus,
    confirmResetClaim,
    confirmTransferOwnership,
    promptChangePassword,
  } = useMemberTaskDialogOpenActions({
    labels,
    setDialogState,
    visibleMembers,
  });

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
