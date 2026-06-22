import type {
  Member,
  TripMemberAccessStatus,
} from "@/src/trip/types";
import { buildMemberPasswordInput } from "./model/member-password-input";

export type MemberTaskDialogState =
  | { kind: "reset"; member: Member }
  | {
      accessStatus: TripMemberAccessStatus;
      actionLabel: string;
      kind: "access";
      member: Member;
    }
  | { kind: "transfer"; member: Member }
  | { kind: "password"; member: Member };

export interface MemberTaskDialogFormState {
  dialog: MemberTaskDialogState | null;
  passwordError: string | null;
  passwordValue: string;
}

export type MemberTaskDialogSubmission =
  | { kind: "none" }
  | { kind: "invalidPassword"; state: MemberTaskDialogFormState }
  | { kind: "reset"; memberId: string }
  | {
      accessStatus: TripMemberAccessStatus;
      kind: "access";
      memberId: string;
    }
  | { kind: "transfer"; memberId: string }
  | { kind: "password"; memberId: string; password: string };

export const initialMemberTaskDialogFormState: MemberTaskDialogFormState = {
  dialog: null,
  passwordError: null,
  passwordValue: "",
};

export function openMemberTaskDialogState(
  dialog: MemberTaskDialogState,
): MemberTaskDialogFormState {
  return {
    dialog,
    passwordError: null,
    passwordValue: "",
  };
}

export function closeMemberTaskDialogState(): MemberTaskDialogFormState {
  return initialMemberTaskDialogFormState;
}

export function updateMemberTaskDialogPasswordValue(
  state: MemberTaskDialogFormState,
  passwordValue: string,
): MemberTaskDialogFormState {
  return {
    ...state,
    passwordError: null,
    passwordValue,
  };
}

export function buildMemberTaskDialogSubmission(
  state: MemberTaskDialogFormState,
  passwordTooShort: string,
): MemberTaskDialogSubmission {
  const { dialog } = state;
  if (!dialog) return { kind: "none" };
  if (dialog.kind === "reset") {
    return { kind: "reset", memberId: dialog.member.id };
  }
  if (dialog.kind === "access") {
    return {
      accessStatus: dialog.accessStatus,
      kind: "access",
      memberId: dialog.member.id,
    };
  }
  if (dialog.kind === "transfer") {
    return { kind: "transfer", memberId: dialog.member.id };
  }
  const password = buildMemberPasswordInput(state.passwordValue);
  if (!password) {
    return {
      kind: "invalidPassword",
      state: {
        ...state,
        passwordError: passwordTooShort,
      },
    };
  }
  return { kind: "password", memberId: dialog.member.id, password };
}
