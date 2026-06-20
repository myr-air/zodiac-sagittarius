import type { ItineraryItem, PlaceResolutionCandidate } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { getTripDates } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { StopDialogActions } from "./StopDialogActions";
import { StopDialogAdvancedFields } from "./StopDialogAdvancedFields";
import { StopDialogContextFields } from "./StopDialogContextFields";
import { StopDialogDetailSection } from "./StopDialogDetailSection";
import { StopDialogPlaceResolution } from "./StopDialogPlaceResolution";
import { StopDialogPrimaryFields } from "./StopDialogPrimaryFields";
import { StopDialogTimeWindow } from "./StopDialogTimeWindow";
import {
  dialogErrorClassName,
  dialogGridClassName,
  dialogTitleRowClassName,
  modalBackdropClassName,
  stopDialogClassName,
  stopFormClassName,
} from "./stop-dialog.styles";
import type { StopFormValues, StopManualPathOption } from "./stop-dialog.types";
import { useStopDialogModel } from "./use-stop-dialog-model";
import {
  type StopDetailType,
  stopDialogDetailTypeOptions,
  stopDetailLabels,
} from "./stop-dialog.utils";

export type { StopFormValues, StopManualPathOption } from "./stop-dialog.types";

interface StopDialogProps {
  mode: "create" | "edit";
  endDate?: string;
  initialDay?: string;
  initialItem?: ItineraryItem;
  initialParentItemId?: string | null;
  manualPathOptions?: StopManualPathOption[];
  onClose: () => void;
  onDelete?: () => void;
  onPromoteFoodRecommendation?: () => void;
  onSubmit: (values: StopFormValues) => void | Promise<void>;
  placeResolution?: { state: "idle" | "resolving" | "ambiguous" | "unresolved"; candidates: PlaceResolutionCandidate[] };
  startDate?: string;
}

const detailTypeOptions: StopDetailType[] = stopDialogDetailTypeOptions;

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
  placeResolution,
  startDate,
}: StopDialogProps) {
  const { locale, t } = useI18n();
  const dayOptions = startDate && endDate ? getTripDates(startDate, endDate) : [];
  const {
    derivedDuration,
    detailType,
    detailValues,
    handleSubmit,
    isSubActivity,
    isSubmitting,
    selectedCandidate,
    setSelectedCandidate,
    submitError,
    submitUnresolved,
    toggleNextDayEnd,
    update,
    updateActivity,
    updateDetail,
    updateDetailType,
    updateEndTime,
    updateStartTime,
    updateTimeMode,
    values,
  } = useStopDialogModel({
    initialDay,
    initialItem,
    initialParentItemId,
    onSubmit,
    saveFailedMessage: t.stopDialog.messages.saveFailed,
    startDate,
  });

  const detailLabels = stopDetailLabels(locale);
  const isFocusedEdit = mode === "edit";
  const title =
    mode === "create"
      ? t.stopDialog.titles.create
      : isSubActivity
        ? locale === "th"
          ? "แก้ไข sub-activity"
          : "Edit sub-activity"
        : t.stopDialog.titles.edit;
  const moreDetailsLabel =
    locale === "th" ? "รายละเอียดเพิ่มเติม" : "More details";

  return (
    <div className={modalBackdropClassName} role="presentation">
      <section className={stopDialogClassName} role="dialog" aria-modal="true" aria-labelledby="stop-dialog-title">
        <div className={dialogTitleRowClassName}>
          <h2 id="stop-dialog-title">{title}</h2>
          <button type="button" aria-label={t.stopDialog.closeForm} onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <form className={stopFormClassName} onSubmit={handleSubmit}>
          <div className={dialogGridClassName}>
            <StopDialogContextFields
              dayLabel={t.stopDialog.fields.day}
              dayOptions={dayOptions}
              detailLabels={detailLabels}
              detailType={detailType}
              detailTypeOptions={detailTypeOptions}
              isSubActivity={isSubActivity}
              locale={locale}
              manualPathOptions={manualPathOptions}
              mode={mode}
              pathLabel={t.stopDialog.fields.plan}
              startDate={startDate}
              typeLabel={t.stopDialog.fields.type}
              values={values}
              onUpdate={update}
              onUpdateDetailType={updateDetailType}
            />
            {mode === "create" ? (
              <StopDialogAdvancedFields
                advancedLabel={detailLabels.fields.advanced}
                isSubActivity={isSubActivity}
                values={values}
                onUpdate={update}
                onUpdateTimeMode={updateTimeMode}
              />
            ) : null}
            <StopDialogTimeWindow
              activity={values.activity}
              derivedDuration={derivedDuration}
              durationLabel={t.itinerary.headers.duration}
              endLabel={t.stopDialog.fields.endTime}
              endOffsetDays={values.endOffsetDays}
              endTime={values.endTime}
              locale={locale}
              nextDayLabel={locale === "th" ? "ข้ามวัน" : "Next day"}
              notSetLabel={locale === "th" ? "ไม่ระบุ" : "Not set"}
              startLabel={t.stopDialog.fields.startTime}
              startTime={values.startTime}
              timeMode={values.timeMode}
              onEndTimeChange={updateEndTime}
              onStartTimeChange={updateStartTime}
              onToggleNextDayEnd={toggleNextDayEnd}
            />
            <StopDialogPrimaryFields
              activityLabel={t.stopDialog.fields.activity}
              detailType={detailType}
              isFocusedEdit={isFocusedEdit}
              noteLabel={t.stopDialog.fields.note}
              placeLabel={t.stopDialog.fields.place}
              transportationLabel={t.stopDialog.fields.transportation}
              values={values}
              onUpdate={update}
              onUpdateActivity={updateActivity}
            />
            <StopDialogDetailSection
              detailLabels={detailLabels}
              detailType={detailType}
              detailValues={detailValues}
              isFocusedEdit={isFocusedEdit}
              mapLink={values.mapLink}
              mapLinkLabel={t.stopDialog.fields.mapLink}
              moreDetailsLabel={moreDetailsLabel}
              onMapLinkChange={(mapLink) => update("mapLink", mapLink)}
              updateDetail={updateDetail}
            />
            {placeResolution ? (
              <StopDialogPlaceResolution
                candidates={placeResolution.candidates}
                candidateListLabel={t.stopDialog.placeResolution.candidates}
                chooseCandidateLabel={(name) =>
                  t.stopDialog.actions.chooseCandidate({ name })
                }
                selectedCandidate={selectedCandidate}
                state={placeResolution.state}
                unresolvedMessage={t.stopDialog.placeResolution.unresolved}
                onSelectCandidate={setSelectedCandidate}
              />
            ) : null}
            {submitError ? (
              <p className={dialogErrorClassName} role="alert">
                {submitError}
              </p>
            ) : null}
          </div>

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
