import { useState, type FormEvent } from "react";
import type { ItineraryItem, ItineraryTimeMode, PlaceResolutionCandidate } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { getTripDates } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { StopDialogActions } from "./stop-dialog/StopDialogActions";
import { StopDialogAdvancedFields } from "./stop-dialog/StopDialogAdvancedFields";
import { StopDialogContextFields } from "./stop-dialog/StopDialogContextFields";
import { StopDialogDetailSection } from "./stop-dialog/StopDialogDetailSection";
import { StopDialogPlaceResolution } from "./stop-dialog/StopDialogPlaceResolution";
import { StopDialogTimeWindow } from "./stop-dialog/StopDialogTimeWindow";
import {
  buildInitialStopDetailValues,
  buildInitialStopFormValues,
  buildStopSubmitValues,
} from "./stop-dialog/stop-dialog.form";
import {
  dialogErrorClassName,
  dialogFieldWideClassName,
  dialogGridClassName,
  dialogTitleRowClassName,
  modalBackdropClassName,
  stopDialogClassName,
  stopFormClassName,
} from "./stop-dialog/stop-dialog.styles";
import type { StopFormValues, StopManualPathOption } from "./stop-dialog/stop-dialog.types";
import {
  type StopDetailType,
  type StopDetailValues,
  detailTypeFromItem,
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
  endWindowFromDuration,
  itemKindForStopDetailType,
  parseRouteActivity,
  resolveStopActivityType,
  stopDialogDetailTypeOptions,
  stopDialogFieldIds,
  stopDetailLabels,
} from "./stop-dialog/stop-dialog.utils";

export type { StopFormValues, StopManualPathOption } from "./stop-dialog/stop-dialog.types";

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

export function StopDialog({ mode, endDate, initialDay, initialItem, initialParentItemId = null, manualPathOptions = [], onClose, onDelete, onPromoteFoodRecommendation, onSubmit, placeResolution, startDate }: StopDialogProps) {
  const { locale, t } = useI18n();
  const dayOptions = startDate && endDate ? getTripDates(startDate, endDate) : [];
  const [values, setValues] = useState<StopFormValues>(() =>
    buildInitialStopFormValues({
      initialDay,
      initialItem,
      initialParentItemId,
      startDate,
    }),
  );
  const [detailType, setDetailType] = useState<StopDetailType>(() => detailTypeFromItem(initialItem));
  const [detailValues, setDetailValues] = useState<StopDetailValues>(() =>
    buildInitialStopDetailValues(initialItem),
  );
  const [selectedCandidate, setSelectedCandidate] = useState<PlaceResolutionCandidate | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const detailLabels = stopDetailLabels(locale);
  const isSubActivity = Boolean(values.parentItemId);
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
  const derivedDuration =
    values.timeMode === "flexible" || !values.endTime
      ? null
      : values.durationMinutes;

  function update<K extends keyof StopFormValues>(key: K, value: StopFormValues[K]) {
    setSubmitError(null);
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateStartTime(startTime: string) {
    const nextEndOffsetDays = values.endTime
      ? endOffsetDaysBetweenTimes(startTime, values.endTime)
      : 0;
    const nextDuration = values.endTime
      ? durationBetweenTimes(startTime, values.endTime, nextEndOffsetDays)
      : null;
    setValues((current) => ({
      ...current,
      startTime,
      endOffsetDays: values.endTime ? nextEndOffsetDays : current.endOffsetDays,
      durationMinutes: nextDuration,
    }));
  }

  function updateTimeMode(timeMode: ItineraryTimeMode) {
    setSubmitError(null);
    setValues((current) =>
      timeMode === "flexible"
        ? {
            ...current,
            timeMode,
            startTime: "",
            endTime: null,
            endOffsetDays: 0,
            durationMinutes: null,
          }
        : {
            ...current,
            timeMode,
          },
    );
  }

  function updateEndTime(nextEndTime: string) {
    if (!nextEndTime) {
      setValues((current) => ({
        ...current,
        endTime: null,
        endOffsetDays: 0,
        durationMinutes: null,
      }));
      return;
    }
    const nextEndOffsetDays = endOffsetDaysBetweenTimes(values.startTime, nextEndTime);
    const nextDuration = durationBetweenTimes(
      values.startTime,
      nextEndTime,
      nextEndOffsetDays,
    );
    setValues((current) => ({
      ...current,
      endTime: nextEndTime,
      endOffsetDays: nextEndOffsetDays,
      durationMinutes: nextDuration,
    }));
  }

  function toggleNextDayEnd() {
    if (!values.endTime) return;
    const endOffsetDays = values.endOffsetDays > 0 ? 0 : 1;
    const durationMinutes = durationBetweenTimes(
      values.startTime,
      values.endTime,
      endOffsetDays,
    );
    setValues((current) => ({
      ...current,
      endOffsetDays,
      durationMinutes,
    }));
  }

  function updateDetail<K extends keyof StopDetailValues>(key: K, value: StopDetailValues[K]) {
    setDetailValues((current) => ({ ...current, [key]: value }));
  }

  function updateDetailType(nextDetailType: StopDetailType) {
    setDetailType(nextDetailType);
    setValues((current) => {
      const nextActivityType = resolveStopActivityType(nextDetailType, current.activityType);
      return {
        ...current,
        activityType: nextActivityType,
        itemKind: itemKindForStopDetailType(nextDetailType),
        isPlanBlock:
          nextDetailType === "transportation" && !current.parentItemId
            ? true
            : nextDetailType === "task"
              ? false
              : current.isPlanBlock,
        timeMode: nextDetailType === "task" ? "flexible" : current.timeMode,
        startTime: nextDetailType === "task" ? "" : current.startTime,
        endTime: nextDetailType === "task" ? null : current.endTime,
        endOffsetDays: nextDetailType === "task" ? 0 : current.endOffsetDays,
        durationMinutes:
          nextDetailType === "task" ? null : current.durationMinutes,
      };
    });
  }

  function updateActivity(activity: string) {
    update("activity", activity);
    const parsedRoute = parseRouteActivity(activity);
    if (!parsedRoute) return;

    updateDetailType("transportation");
    setDetailValues((current) => ({
      ...current,
      destination: parsedRoute.destination,
      origin: parsedRoute.origin,
    }));
    if (parsedRoute.startTime && parsedRoute.durationMinutes) {
      const parsedEnd = endWindowFromDuration(
        parsedRoute.startTime,
        parsedRoute.durationMinutes,
      );
      setValues((current) => ({
        ...current,
        activity,
        durationMinutes: parsedRoute.durationMinutes ?? current.durationMinutes,
        startTime: parsedRoute.startTime ?? current.startTime,
        ...(parsedEnd
          ? {
              endTime: parsedEnd.endTime,
              endOffsetDays: parsedEnd.endOffsetDays,
            }
          : {}),
      }));
    }
  }

  function buildSubmitValues(saveUnresolved: boolean): StopFormValues {
    return buildStopSubmitValues({
      detailType,
      detailValues,
      saveUnresolved,
      selectedCandidate,
      values,
    });
  }

  async function submitValues(saveUnresolved: boolean) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(buildSubmitValues(saveUnresolved));
    } catch {
      setSubmitError(t.stopDialog.messages.saveFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitValues(false);
  }

  function submitUnresolved() {
    void submitValues(true);
  }

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
            <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.activity}>
              <span>{t.stopDialog.fields.activity}</span>
              <input id={stopDialogFieldIds.activity} value={values.activity} onChange={(event) => updateActivity(event.target.value)} required />
            </label>
            <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.place}>
              <span>{t.stopDialog.fields.place}</span>
              <input id={stopDialogFieldIds.place} value={values.place} onChange={(event) => update("place", event.target.value)} required={detailType !== "transportation"} />
            </label>
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
            {!isFocusedEdit && detailType !== "transportation" ? (
              <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.transportation}>
                <span>{t.stopDialog.fields.transportation}</span>
                <input id={stopDialogFieldIds.transportation} value={values.transportation} onChange={(event) => update("transportation", event.target.value)} />
              </label>
            ) : null}
            {!isFocusedEdit ? (
              <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.note}>
                <span>{t.stopDialog.fields.note}</span>
                <textarea id={stopDialogFieldIds.note} value={values.note} onChange={(event) => update("note", event.target.value)} rows={3} />
              </label>
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
