import { Icon, type IconName } from "@/src/ui/icons";

interface ActivityCellModalActionsProps {
  cancelClassName: string;
  cancelDisabled?: boolean;
  cancelLabel: string;
  onCancel: () => void;
  saveClassName: string;
  saveDisabled?: boolean;
  saveIconName?: IconName;
  saveLabel: string;
}

export function ActivityCellModalActions({
  cancelClassName,
  cancelDisabled = false,
  cancelLabel,
  onCancel,
  saveClassName,
  saveDisabled = false,
  saveIconName,
  saveLabel,
}: ActivityCellModalActionsProps) {
  return (
    <>
      <button
        type="button"
        className={cancelClassName}
        disabled={cancelDisabled}
        onClick={onCancel}
      >
        {cancelLabel}
      </button>
      <button type="submit" className={saveClassName} disabled={saveDisabled}>
        {saveIconName ? <Icon name={saveIconName} /> : null}
        {saveLabel}
      </button>
    </>
  );
}
