import { Button } from "@/src/ui";
import type { ReactNode } from "react";
import {
  workspaceCompactDialogActionsClassName,
  workspaceCompactDialogBodyClassName,
  workspaceCompactDialogTitleClassName,
  workspaceDeleteDialogClassName,
  workspaceDialogBackdropClassName,
} from "./workspace-dialog.styles";

type WorkspaceConfirmButtonVariant = "ghost" | "secondary";

interface WorkspaceConfirmDialogProps {
  body: ReactNode;
  cancelLabel: string;
  cancelVariant?: WorkspaceConfirmButtonVariant;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  titleId?: string;
  titleTone?: "default" | "danger";
}

export function WorkspaceConfirmDialog({
  body,
  cancelLabel,
  cancelVariant = "ghost",
  confirmLabel,
  onCancel,
  onConfirm,
  title,
  titleId,
  titleTone = "default",
}: WorkspaceConfirmDialogProps) {
  const titleClassName = titleTone === "danger"
    ? `${workspaceCompactDialogTitleClassName} text-(--color-danger)`
    : workspaceCompactDialogTitleClassName;

  return (
    <div className={workspaceDialogBackdropClassName} role="presentation">
      <section
        className={workspaceDeleteDialogClassName}
        role="dialog"
        aria-modal="true"
        aria-label={titleId ? undefined : title}
        aria-labelledby={titleId}
      >
        <h2 className={titleClassName} id={titleId}>
          {title}
        </h2>
        <p className={workspaceCompactDialogBodyClassName}>
          {body}
        </p>
        <div className={workspaceCompactDialogActionsClassName}>
          <Button type="button" variant={cancelVariant} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
