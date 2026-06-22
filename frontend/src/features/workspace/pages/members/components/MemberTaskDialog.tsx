import { type FormEvent } from "react";
import { cn } from "@/src/lib/cn";
import { ActionBar, Button, FieldLabel, TextInput } from "@/src/ui";
import * as memberStyles from "../TripMembersPage.styles";
import type { MemberTaskDialogState } from "../member-task-dialog-state";
import type { MemberConfirmLabels } from "./member-management.types";

interface MemberTaskDialogProps {
  dialog: MemberTaskDialogState;
  labels: MemberConfirmLabels;
  passwordError: string | null;
  passwordValue: string;
  onCancel: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
}

export function MemberTaskDialog({
  dialog,
  labels,
  passwordError,
  passwordValue,
  onCancel,
  onPasswordChange,
  onSubmit,
}: MemberTaskDialogProps) {
  return (
    <div className={memberStyles.memberDialogBackdropClassName} role="presentation">
      <form className={memberStyles.memberDialogClassName} role="dialog" aria-modal="true" aria-labelledby="member-task-dialog-title" onSubmit={onSubmit}>
        <h2 className={memberStyles.memberDialogTitleClassName} id="member-task-dialog-title">{memberDialogTitle(dialog)}</h2>
        {dialog.kind === "password" ? (
          <>
            <p className={memberStyles.memberDialogBodyClassName}>{labels.passwordPrompt({ name: dialog.member.displayName })}</p>
            <FieldLabel>
              <span>รหัสผ่านใหม่</span>
              <TextInput value={passwordValue} onChange={(event) => onPasswordChange(event.target.value)} type="password" autoComplete="new-password" />
            </FieldLabel>
            {passwordError ? <p className={memberStyles.memberDialogErrorClassName} role="alert">{passwordError}</p> : null}
          </>
        ) : (
          <p className={memberStyles.memberDialogBodyClassName}>{memberDialogBody(dialog, labels)}</p>
        )}
        <ActionBar className={memberStyles.memberDialogActionsClassName}>
          <Button className={cn(memberStyles.memberResetButtonClassName, "w-auto")} variant="ghost" type="button" onClick={onCancel}>ยกเลิก</Button>
          <Button className={cn(memberStyles.memberCreateButtonClassName, "w-auto")} variant="ghost" type="submit">
            {memberDialogConfirmLabel(dialog)}
          </Button>
        </ActionBar>
      </form>
    </div>
  );
}

function memberDialogTitle(dialog: MemberTaskDialogState): string {
  if (dialog.kind === "reset") return `รีเซ็ตตัวตน ${dialog.member.displayName}`;
  if (dialog.kind === "access") return `${dialog.actionLabel} ${dialog.member.displayName}`;
  if (dialog.kind === "transfer") return `โอน owner ให้ ${dialog.member.displayName}`;
  return `เปลี่ยนรหัสผ่าน ${dialog.member.displayName}`;
}

function memberDialogBody(
  dialog: Exclude<MemberTaskDialogState, { kind: "password" }>,
  labels: MemberConfirmLabels,
): string {
  if (dialog.kind === "reset") return labels.resetClaim({ name: dialog.member.displayName });
  if (dialog.kind === "access") return labels.access({ action: dialog.actionLabel, name: dialog.member.displayName });
  return labels.transferOwner({ name: dialog.member.displayName });
}

function memberDialogConfirmLabel(dialog: MemberTaskDialogState): string {
  if (dialog.kind === "reset") return "รีเซ็ตตัวตน";
  if (dialog.kind === "transfer") return "โอน owner";
  if (dialog.kind === "password") return "บันทึกรหัสผ่าน";
  return "ยืนยัน";
}
