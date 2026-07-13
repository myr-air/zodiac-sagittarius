import { useI18n } from "@/src/i18n/I18nProvider";
import { getTripDates } from "@/src/trip/itinerary-core";
import { Icon } from "@/src/ui/icons";
import { StopDialogActions } from "./StopDialogActions";
import { StopDialogFormFields } from "./StopDialogFormFields";
import {
  dialogTitleRowClassName,
  modalBackdropClassName,
  stopDialogClassName,
  stopFormClassName,
} from "./stop-dialog.styles";
import type { StopDialogProps } from "./stop-dialog.types";
import { useStopDialogModel } from "./use-stop-dialog-model";
import { stopDetailLabels } from "@/src/features/itinerary/domain/stop-details";
import { stopDialogCopy } from "@/src/features/itinerary/domain/stop-dialog-copy";
import { dialogContextBannerClassName } from "./stop-dialog.styles";

export function StopDialog({
  mode,
  endDate,
  initialDay,
  initialItem,
  initialParentItemId = null,
  manualPathOptions = [],
  onClose,
  onDelete,
  onPromoteFoodRecommendation,
  onSubmit,
  parentItemActivity,
  placeSuggestions = [],
  placeResolution,
  startDate,
}: StopDialogProps) {
  const { locale, t } = useI18n();
  const dayOptions = startDate && endDate ? getTripDates(startDate, endDate) : [];
  const model = useStopDialogModel({
    initialDay,
    initialItem,
    initialParentItemId,
    onSubmit,
    saveFailedMessage: t.stopDialog.messages.saveFailed,
    startDate,
  });
  const {
    handleSubmit,
    isSubActivity,
    isSubmitting,
    submitUnresolved,
  } = model;

  const detailLabels = stopDetailLabels(locale);
  const copy = stopDialogCopy(locale);
  const isCreating = mode === "create";
  const title =
    mode === "create"
      ? isSubActivity
        ? t.stopDialog.titles.createSubActivity
        : t.stopDialog.titles.createParentBlock
      : isSubActivity
        ? copy.editSubActivityTitle
        : t.stopDialog.titles.edit;

  return (
    <div className={modalBackdropClassName} role="presentation">
      <section className={stopDialogClassName} role="dialog" aria-modal="true" aria-labelledby="stop-dialog-title">
        <div className={dialogTitleRowClassName}>
          <h2 id="stop-dialog-title">{title}</h2>
          <button type="button" aria-label={t.stopDialog.closeForm} onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        {isCreating ? (
          <div className={dialogContextBannerClassName}>
            <p>
              {isSubActivity
                ? parentItemActivity
                  ? t.stopDialog.context.subActivityHintWithParent({ parent: parentItemActivity })
                  : t.stopDialog.context.subActivityHint
                : t.stopDialog.context.parentBlockHint}
            </p>
          </div>
        ) : null}

        <form className={stopFormClassName} onSubmit={handleSubmit}>
          <StopDialogFormFields
            dayOptions={dayOptions}
            detailLabels={detailLabels}
            itineraryHeaders={t.itinerary.headers}
            locale={locale}
            manualPathOptions={manualPathOptions}
            mode={mode}
            model={model}
            placeResolution={placeResolution}
            placeSuggestions={placeSuggestions}
            startDate={startDate}
            stopDialogCopy={copy}
            stopDialogMessages={t.stopDialog}
          />

          <StopDialogActions
            cancelLabel={t.stopDialog.actions.cancel}
            deleteLabel={t.stopDialog.actions.delete}
            isFoodRecommendation={initialItem?.itemKind === "foodRecommendation"}
            isSubmitting={isSubmitting}
            mode={mode}
            placeResolutionState={placeResolution?.state}
            primaryLabel={isSubmitting ? t.stopDialog.messages.saving : mode === "create" ? t.stopDialog.actions.create : t.stopDialog.actions.edit}
            promoteLabel="Promote to meal"
            saveUnresolvedLabel={t.stopDialog.actions.saveUnresolved}
            onClose={onClose}
            onDelete={onDelete}
            onPromoteFoodRecommendation={onPromoteFoodRecommendation}
            onSubmitUnresolved={submitUnresolved}
          />
        </form>
      </section>
    </div>
  );
}
