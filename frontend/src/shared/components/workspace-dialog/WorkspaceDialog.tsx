import { cn } from "@/src/lib/cn";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { type FormEventHandler, type KeyboardEvent, type ReactNode, useEffect, useRef } from "react";
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
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = dialogFocusableElements(dialogRef.current);
    const firstFormControl = focusable.find((element) => !element.closest("[data-dialog-chrome='true']"));
    (firstFormControl ?? focusable[0] ?? dialogRef.current)?.focus();
    return () => restoreFocusRef.current?.focus();
  }, []);

  const onDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogFocusableElements(dialogRef.current);
    if (!focusable.length || !dialogRef.current) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (document.activeElement === dialogRef.current) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={workspaceDialogBackdropClassName} role="presentation">
      <section
        ref={dialogRef}
        className={cn(workspaceDialogPanelClassName, className)}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
      >
        <div className={workspaceDialogHeaderClassName} data-dialog-chrome="true">
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

function dialogFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), summary, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}
