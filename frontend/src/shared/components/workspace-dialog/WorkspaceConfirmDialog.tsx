import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";
import { type KeyboardEvent, type ReactNode, useEffect, useRef } from "react";
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
  const dialogRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleClassName = titleTone === "danger"
    ? `${workspaceCompactDialogTitleClassName} text-(--color-danger)`
    : workspaceCompactDialogTitleClassName;
  const dialogClassName = className
    ? cn(workspaceCompactDialogPanelClassName, className)
    : workspaceDeleteDialogClassName;

  useEffect(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = confirmDialogFocusableElements(dialogRef.current);
    (focusable[0] ?? dialogRef.current)?.focus();
    return () => restoreFocusRef.current?.focus();
  }, []);

  const onDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = confirmDialogFocusableElements(dialogRef.current);
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
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-label={titleId ? undefined : title}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onDialogKeyDown}
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

function confirmDialogFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), summary, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}
