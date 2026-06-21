export const workspaceDialogBackdropClassName =
  "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-4";

export const workspacePaddedDialogBackdropClassName =
  "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";

export const workspaceDialogPanelClassName =
  "grid w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface)";

export const workspaceDialogHeaderClassName =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-(--color-border) px-4 py-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-extrabold";

export const workspaceDialogFormClassName = "grid min-h-0 gap-3 overflow-y-auto p-4";

export const workspaceDialogGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";

export const workspaceDialogActionsClassName =
  "flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) pt-3";

export const workspaceCompactDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-(--color-text)";

export const workspaceCompactDialogBodyClassName =
  "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";

export const workspaceCompactDialogActionsClassName = "mt-1 flex justify-end gap-2";

export const workspaceDeleteDialogClassName =
  "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.14)]";
