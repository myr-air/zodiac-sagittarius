import { Button } from "@/src/ui";

const deleteModalBackdropClassName =
  "modal-backdrop fixed inset-0 z-[80] grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const deleteDialogClassName =
  "delete-confirm-dialog grid w-[min(420px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-danger-border) bg-(--color-surface) p-4 shadow-[0_14px_34px_rgb(15_23_42_/_0.14)]";
const deleteDialogTitleClassName =
  "m-0 text-base font-extrabold leading-[22px] text-[#991b1b]";
const deleteDialogBodyClassName =
  "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const deleteDialogActionsClassName = "mt-1 flex justify-end gap-2";

interface DeleteDialogItem {
  activity: string;
  id: string;
}

interface TripWorkspaceDeleteDialogProps {
  cancelLabel: string;
  confirmLabel: string;
  item: DeleteDialogItem | null;
  onCancel: () => void;
  onConfirm: (itemId: string) => void | Promise<void>;
  titleForActivity: (activity: string) => string;
  bodyForActivity: (activity: string) => string;
}

export function TripWorkspaceDeleteDialog({
  cancelLabel,
  confirmLabel,
  item,
  onCancel,
  onConfirm,
  titleForActivity,
  bodyForActivity,
}: TripWorkspaceDeleteDialogProps) {
  if (!item) return null;

  return (
    <div className={deleteModalBackdropClassName} role="presentation">
      <section
        className={deleteDialogClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-delete-dialog-title"
      >
        <h2 className={deleteDialogTitleClassName} id="app-delete-dialog-title">
          {titleForActivity(item.activity)}
        </h2>
        <p className={deleteDialogBodyClassName}>
          {bodyForActivity(item.activity)}
        </p>
        <div className={deleteDialogActionsClassName}>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void onConfirm(item.id)}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
