import { WorkspaceConfirmDialog } from "@/src/shared/components/workspace-dialog";

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
    <WorkspaceConfirmDialog
      body={bodyForActivity(item.activity)}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      onCancel={onCancel}
      onConfirm={() => void onConfirm(item.id)}
      title={titleForActivity(item.activity)}
      titleId="app-delete-dialog-title"
      titleTone="danger"
    />
  );
}
