import { cn } from "@/src/lib/cn";
import type { FormEventHandler, ReactNode } from "react";
import {
  workspaceCompactDialogActionsClassName,
  workspaceCompactDialogPanelClassName,
  workspaceCompactDialogTitleClassName,
  workspaceDialogBackdropClassName,
} from "./workspace-dialog.styles";

interface WorkspaceCompactFormDialogProps {
  actions: ReactNode;
  children: ReactNode;
  className?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  title: string;
  titleId: string;
}

export function WorkspaceCompactFormDialog({
  actions,
  children,
  className,
  onSubmit,
  title,
  titleId,
}: WorkspaceCompactFormDialogProps) {
  return (
    <div className={workspaceDialogBackdropClassName} role="presentation">
      <form
        className={cn(workspaceCompactDialogPanelClassName, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={onSubmit}
      >
        <h2 className={workspaceCompactDialogTitleClassName} id={titleId}>
          {title}
        </h2>
        {children}
        <div className={workspaceCompactDialogActionsClassName}>
          {actions}
        </div>
      </form>
    </div>
  );
}
