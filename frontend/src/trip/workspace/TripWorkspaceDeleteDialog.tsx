import { Button } from "@/src/ui";
import {
  deleteDialogClassName,
  deleteDialogTitleClassName,
  workspaceDialogActionsClassName,
  workspaceDialogBackdropClassName,
  workspaceDialogBodyClassName,
} from "./TripWorkspaceDialog.styles";

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
    <div className={workspaceDialogBackdropClassName} role="presentation">
      <section
        className={deleteDialogClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-delete-dialog-title"
      >
        <h2 className={deleteDialogTitleClassName} id="app-delete-dialog-title">
          {titleForActivity(item.activity)}
        </h2>
        <p className={workspaceDialogBodyClassName}>
          {bodyForActivity(item.activity)}
        </p>
        <div className={workspaceDialogActionsClassName}>
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
