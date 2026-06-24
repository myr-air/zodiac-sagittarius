import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";
import type { ReactNode } from "react";
import {
  workspaceCompactDialogActionsClassName,
  workspaceCompactDialogBodyClassName,
  workspaceCompactDialogPanelClassName,
  workspaceCompactDialogTitleClassName,
  workspaceDeleteDialogClassName,
  workspaceDialogBackdropClassName,
} from "./workspace-dialog.styles";

type WorkspaceConfirmButtonVariant = "ghost" | "secondary";
type WorkspaceConfirmActionVariant = "primary" | "danger";

interface WorkspaceConfirmDialogProps {
  body: ReactNode;
  cancelLabel: string;
  cancelVariant?: WorkspaceConfirmButtonVariant;
  className?: string;
  confirmLabel: string;
  confirmVariant?: WorkspaceConfirmActionVariant;
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
  className,
  confirmLabel,
  confirmVariant = "danger",
  onCancel,
  onConfirm,
  title,
  titleId,
  titleTone = "default",
}: WorkspaceConfirmDialogProps) {
  const titleClassName = titleTone === "danger"
    ? `${workspaceCompactDialogTitleClassName} text-(--color-danger)`
    : workspaceCompactDialogTitleClassName;
  const dialogClassName = className
    ? cn(workspaceCompactDialogPanelClassName, className)
    : workspaceDeleteDialogClassName;

  return (
    <div className={workspaceDialogBackdropClassName} role="presentation">
      <section
        className={dialogClassName}
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
          <Button type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
