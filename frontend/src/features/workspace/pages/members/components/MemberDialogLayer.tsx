import type { FormEvent } from "react";
import { MemberTaskDialog } from "./MemberTaskDialog";
import type { MemberConfirmLabels } from "./member-management.types";
import type { MemberTaskDialogState } from "../model/member-task-dialog-state";

interface MemberDialogLayerProps {
  dialog: MemberTaskDialogState | null;
  labels: MemberConfirmLabels;
  passwordError: string | null;
  passwordValue: string;
  onCancel: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
}

export function MemberDialogLayer({
  dialog,
  labels,
  passwordError,
  passwordValue,
  onCancel,
  onPasswordChange,
  onSubmit,
}: MemberDialogLayerProps) {
  return dialog ? (
    <MemberTaskDialog
      dialog={dialog}
      labels={labels}
      passwordError={passwordError}
      passwordValue={passwordValue}
      onCancel={onCancel}
      onPasswordChange={onPasswordChange}
      onSubmit={onSubmit}
    />
  ) : null;
}
