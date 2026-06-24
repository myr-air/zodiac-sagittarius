import { cn } from "@/src/lib/cn";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { FormEventHandler, ReactNode } from "react";
import {
  workspaceDialogBackdropClassName,
  workspaceDialogHeaderClassName,
  workspaceDialogPanelClassName,
} from "./workspace-dialog.styles";

interface WorkspaceDialogProps {
  ariaLabel?: string;
  children?: ReactNode;
  className?: string;
  closeAriaLabel: string;
  onClose: () => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  title: ReactNode;
  titleId?: string;
  formClassName?: string;
}

export function WorkspaceDialog({
  ariaLabel,
  children,
  className,
  closeAriaLabel,
  formClassName,
  onClose,
  onSubmit,
  title,
  titleId,
}: WorkspaceDialogProps) {
  return (
    <div className={workspaceDialogBackdropClassName} role="presentation">
      <section
        className={cn(workspaceDialogPanelClassName, className)}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={titleId}
      >
        <div className={workspaceDialogHeaderClassName}>
          <h2 id={titleId}>{title}</h2>
          <IconButton type="button" aria-label={closeAriaLabel} onClick={onClose}>
            <Icon name="x" />
          </IconButton>
        </div>
        {onSubmit ? (
          <form className={formClassName} onSubmit={onSubmit}>
            {children}
          </form>
        ) : (
          children
        )}
      </section>
    </div>
  );
}
