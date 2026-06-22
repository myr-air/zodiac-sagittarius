import { type FormEvent, useState } from "react";
import type {
  Member,
  TripMemberAccessStatus,
} from "@/src/trip/types";
import type { MemberTaskDialogState } from "./components/MemberTaskDialog";
import { buildMemberPasswordInput } from "./model/member-password-input";

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
  const [memberDialog, setMemberDialog] =
    useState<MemberTaskDialogState | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
    const password = buildMemberPasswordInput(passwordValue);
    if (!password) {
      setPasswordError(labels.passwordTooShort);
      return;
    }
    onChangeMemberPassword(memberDialog.member.id, password);
    closeMemberDialog();
  }

  return {
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
  };
}
