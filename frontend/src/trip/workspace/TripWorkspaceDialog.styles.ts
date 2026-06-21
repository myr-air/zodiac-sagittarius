import {
  workspaceCompactDialogActionsClassName,
  workspaceCompactDialogBodyClassName,
  workspaceCompactDialogPanelClassName,
  workspaceCompactDialogTitleClassName,
  workspaceDeleteDialogClassName,
} from "@/src/shared/components/workspace-dialog";

export const workspaceDialogBackdropClassName =
  "modal-backdrop fixed inset-0 z-[80] grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
export const importDialogClassName =
  `import-options-dialog w-[min(520px,100%)] ${workspaceCompactDialogPanelClassName}`;
export const deleteDialogClassName = workspaceDeleteDialogClassName;
export const importDialogTitleClassName = workspaceCompactDialogTitleClassName;
export const deleteDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-[#991b1b]";
export const workspaceDialogBodyClassName = workspaceCompactDialogBodyClassName;
export const importDialogFieldsClassName =
  "grid gap-3 [&_label]:grid [&_label]:gap-1.5 [&_label>span]:text-xs [&_label>span]:font-bold [&_label>span]:text-(--color-text-muted) [&_input]:min-h-9 [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-sm [&_select]:min-h-9 [&_select]:rounded-(--radius-sm) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-2.5 [&_select]:text-sm";
export const workspaceDialogActionsClassName = workspaceCompactDialogActionsClassName;
