import { Button } from "@/src/ui";
import {
  dialogActionsClassName,
  dialogPrimaryActionsClassName,
} from "./stop-dialog.styles";

export function StopDialogActions({
  cancelLabel,
  deleteLabel,
  isFoodRecommendation,
  isSubmitting,
  mode,
  placeResolutionState,
  primaryLabel,
  promoteLabel,
  saveUnresolvedLabel,
  onClose,
  onDelete,
  onPromoteFoodRecommendation,
  onSubmitUnresolved,
}: {
  cancelLabel: string;
  deleteLabel: string;
  isFoodRecommendation: boolean;
  isSubmitting: boolean;
  mode: "create" | "edit";
  placeResolutionState?: "idle" | "resolving" | "ambiguous" | "unresolved";
  primaryLabel: string;
  promoteLabel: string;
  saveUnresolvedLabel: string;
  onClose: () => void;
  onDelete?: () => void;
  onPromoteFoodRecommendation?: () => void;
  onSubmitUnresolved: () => void;
}) {
  return (
    <div className={dialogActionsClassName}>
      {mode === "edit" && onDelete ? (
        <Button type="button" variant="danger" onClick={onDelete}>{deleteLabel}</Button>
      ) : <span />}
      <span />
      <div className={dialogPrimaryActionsClassName}>
        {isFoodRecommendation && onPromoteFoodRecommendation ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onPromoteFoodRecommendation}
          >
            {promoteLabel}
          </Button>
        ) : null}
        {placeResolutionState === "unresolved" ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={onSubmitUnresolved}
          >
            {saveUnresolvedLabel}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>{primaryLabel}</Button>
      </div>
    </div>
  );
}
