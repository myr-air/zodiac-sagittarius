import { useState, type FormEvent } from "react";
import type { ItineraryItem, ItineraryItemKind, ItineraryItemPriority, ItineraryItemStatus, ItineraryTimeMode, PlaceResolutionCandidate } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { formatDayLabel, getTripDates } from "@/src/trip/itinerary";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { formatDuration, formatThaiDate } from "@/src/features/itinerary/lib";
import { TimePickerField } from "@/src/components/DateTimePickers";
import { StopDialogDetails } from "./stop-dialog/StopDialogDetails";
import {
  buildInitialStopDetailValues,
  buildInitialStopFormValues,
  buildStopSubmitValues,
} from "./stop-dialog/stop-dialog.form";
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
const modalBackdropClassName = "modal-backdrop fixed inset-0 z-[70] grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5 max-[767px]:items-end max-[767px]:p-2.5";
const stopDialogClassName = "stop-dialog max-h-[calc(100vh-40px)] w-[min(620px,100%)] overflow-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const dialogTitleRowClassName = "dialog-title-row grid min-h-[54px] grid-cols-[minmax(0,1fr)_34px] items-center gap-3 border-b border-(--color-border) px-4 [&_button]:grid [&_button]:size-[34px] [&_button]:rotate-180 [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-(--color-text-muted) [&_h2]:m-0 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:leading-[22px] [&_h2]:text-[#0f172a]";
const stopFormClassName = "stop-form grid gap-4 p-4";
const dialogGridClassName = "dialog-grid grid grid-cols-2 gap-3 max-[767px]:grid-cols-1 [&_input]:min-h-[38px] [&_input]:w-full [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:py-2 [&_input]:text-[13px] [&_input]:text-(--color-text) [&_label]:grid [&_label]:min-w-0 [&_label]:gap-1.5 [&_label>span]:text-xs [&_label>span]:font-bold [&_label>span]:text-(--color-text-muted) [&_select]:min-h-[38px] [&_select]:w-full [&_select]:rounded-(--radius-sm) [&_select]:border [&_select]:border-(--color-border-strong) [&_select]:bg-(--color-surface) [&_select]:px-2.5 [&_select]:py-2 [&_select]:text-[13px] [&_select]:text-(--color-text) [&_textarea]:min-h-[38px] [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-(--radius-sm) [&_textarea]:border [&_textarea]:border-(--color-border-strong) [&_textarea]:bg-(--color-surface) [&_textarea]:px-2.5 [&_textarea]:py-2 [&_textarea]:text-[13px] [&_textarea]:text-(--color-text)";
const dialogFieldWideClassName = "dialog-field-wide col-span-full";
const timeWindowGroupClassName =
  "time-window-group col-span-full grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_minmax(132px,auto)] items-end gap-3 max-[767px]:grid-cols-1";
const nextDayToggleLabelClassName =
  "next-day-toggle-label !flex min-w-[72px] flex-col gap-1.5";
const nextDayToggleButtonClassName =
  "inline-flex min-h-[38px] min-w-[58px] items-center justify-center rounded-(--radius-sm) border border-(--color-border-strong) bg-(--color-surface) px-2 text-xs font-extrabold text-(--color-text-muted) transition-[background,border-color,color] duration-150 hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-(--color-primary-border) aria-pressed:bg-(--color-primary-soft) aria-pressed:text-(--color-primary-strong)";
const durationSummaryClassName =
  "duration-summary grid min-h-[38px] min-w-0 content-center gap-0.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-1.5 text-xs text-(--color-text-muted) [&_strong]:text-sm [&_strong]:font-extrabold [&_strong]:leading-5 [&_strong]:text-(--color-text) [&_span]:font-bold";
const advancedDetailsClassName = "advanced-stop-fields col-span-full rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 [&_summary]:cursor-pointer [&_summary]:text-xs [&_summary]:font-extrabold [&_summary]:text-(--color-text-muted)";
const advancedDetailsGridClassName = "mt-3 grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const dialogActionsClassName = "dialog-actions grid grid-cols-[auto_1fr_auto] items-center gap-2.5 max-[767px]:grid-cols-1";
const dialogPrimaryActionsClassName = "dialog-primary-actions flex justify-end gap-2.5 max-[767px]:grid";
const placeCandidateListClassName = "place-candidate-list grid gap-2";
const placeCandidateButtonClassName = "place-candidate-button grid gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-left text-xs text-(--color-text) transition-[border-color,box-shadow] hover:border-(--color-primary) focus-visible:border-(--color-primary) focus-visible:outline-none aria-pressed:border-(--color-primary) aria-pressed:shadow-[0_0_0_2px_rgb(153_246_228_/_0.42)] [&_strong]:text-sm [&_strong]:font-extrabold [&_span]:text-(--color-text-muted)";
const dialogWarningClassName = "dialog-warning col-span-full rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-warning-soft) px-3 py-2 text-sm font-bold leading-5 text-(--color-warning-strong)";
const dialogErrorClassName = "dialog-error col-span-full rounded-(--radius-sm) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2 text-sm font-bold text-(--color-danger)";


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
            {mode === "edit" && !isSubActivity && dayOptions.length ? (
              <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.day}>
                <span>{t.stopDialog.fields.day}</span>
                <Select id={stopDialogFieldIds.day} value={values.day} onChange={(event) => update("day", event.target.value)}>
                  {dayOptions.map((day) => (
                    <option value={day} key={day}>{formatDayLabel(day, startDate ?? day, locale)} · {formatThaiDate(day, locale)}</option>
                  ))}
                </Select>
              </label>
            ) : null}
            {mode === "edit" && !isSubActivity && manualPathOptions.length > 1 ? (
              <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.path}>
                <span>{t.stopDialog.fields.plan}</span>
                <Select id={stopDialogFieldIds.path} value={values.pathId ?? "main"} onChange={(event) => update("pathId", event.target.value)}>
                  {manualPathOptions.map((option) => (
                    <option value={option.id} key={option.id}>{option.name}</option>
                  ))}
                </Select>
              </label>
            ) : null}
            <label htmlFor={stopDialogFieldIds.activityType}>
              <span>{t.stopDialog.fields.type}</span>
              <Select id={stopDialogFieldIds.activityType} value={detailType} onChange={(event) => updateDetailType(event.target.value as StopDetailType)}>
                {detailTypeOptions.map((option) => (
                  <option value={option} key={option}>{detailLabels.types[option]}</option>
                ))}
              </Select>
            </label>
            {mode === "create" ? (
              <details className={advancedDetailsClassName}>
                <summary>{detailLabels.fields.advanced}</summary>
                <div className={advancedDetailsGridClassName}>
                  <label htmlFor={stopDialogFieldIds.itemKind}>
                    <span>Item kind</span>
                    <Select id={stopDialogFieldIds.itemKind} value={values.itemKind} onChange={(event) => update("itemKind", event.target.value as ItineraryItemKind)}>
                      {["travel", "activity", "lodging", "meal", "note", "preparation", "foodRecommendation"].map((option) => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </Select>
                  </label>
                  <label htmlFor={stopDialogFieldIds.timeMode}>
                    <span>Time mode</span>
                    <Select id={stopDialogFieldIds.timeMode} value={values.timeMode} onChange={(event) => updateTimeMode(event.target.value as ItineraryTimeMode)}>
                      <option value="scheduled">scheduled</option>
                      <option value="flexible">flexible</option>
                    </Select>
                  </label>
                  <label htmlFor={stopDialogFieldIds.status}>
                    <span>Status</span>
                    <Select id={stopDialogFieldIds.status} value={values.status} onChange={(event) => update("status", event.target.value as ItineraryItemStatus)}>
                      {["idea", "planned", "booked", "confirmed", "done", "skipped"].map((option) => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </Select>
                  </label>
                  <label htmlFor={stopDialogFieldIds.priority}>
                    <span>Priority</span>
                    <Select id={stopDialogFieldIds.priority} value={values.priority} onChange={(event) => update("priority", event.target.value as ItineraryItemPriority)}>
                      {["low", "normal", "high", "must"].map((option) => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </Select>
                  </label>
                  <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.isPlanBlock}>
                    <span>
                      <input
                        id={stopDialogFieldIds.isPlanBlock}
                        type="checkbox"
                        checked={values.isPlanBlock && !isSubActivity}
                        disabled={isSubActivity}
                        onChange={(event) => update("isPlanBlock", event.target.checked)}
                      />
                      Plan block
                    </span>
                  </label>
                </div>
              </details>
            ) : null}
            <div
              className={timeWindowGroupClassName}
              role="group"
              aria-label={locale === "th" ? "ช่วงเวลา" : "Time window"}
            >
              <label htmlFor={stopDialogFieldIds.startTime}>
                <span>{t.stopDialog.fields.startTime}</span>
                <TimePickerField id={stopDialogFieldIds.startTime} value={values.startTime} onChange={updateStartTime} required={values.timeMode !== "flexible"} />
              </label>
              <label htmlFor={stopDialogFieldIds.endTime}>
                <span>{t.stopDialog.fields.endTime}</span>
                <TimePickerField id={stopDialogFieldIds.endTime} value={values.endTime ?? ""} onChange={updateEndTime} />
              </label>
              <label className={nextDayToggleLabelClassName} htmlFor={stopDialogFieldIds.endOffsetDays}>
                <span>{locale === "th" ? "ข้ามวัน" : "Next day"}</span>
                <button
                  id={stopDialogFieldIds.endOffsetDays}
                  className={nextDayToggleButtonClassName}
                  type="button"
                  aria-label={`Toggle next-day end ${values.activity || "activity"}`}
                  aria-pressed={values.endOffsetDays > 0}
                  disabled={values.timeMode === "flexible" || !values.endTime}
                  onClick={toggleNextDayEnd}
                >
                  +1
                </button>
              </label>
              <div className={durationSummaryClassName} aria-labelledby={stopDialogFieldIds.derivedDuration}>
                <span id={stopDialogFieldIds.derivedDuration}>{t.itinerary.headers.duration}</span>
                {derivedDuration ? (
                  <strong>{formatDuration(derivedDuration, locale)}</strong>
                ) : (
                  <strong>{locale === "th" ? "ไม่ระบุ" : "Not set"}</strong>
                )}
              </div>
            </div>
            <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.activity}>
              <span>{t.stopDialog.fields.activity}</span>
              <input id={stopDialogFieldIds.activity} value={values.activity} onChange={(event) => updateActivity(event.target.value)} required />
            </label>
            <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.place}>
              <span>{t.stopDialog.fields.place}</span>
              <input id={stopDialogFieldIds.place} value={values.place} onChange={(event) => update("place", event.target.value)} required={detailType !== "transportation"} />
            </label>
            {isFocusedEdit ? (
              <details className={advancedDetailsClassName}>
                <summary>{moreDetailsLabel}</summary>
                <div className={advancedDetailsGridClassName}>
                  <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.mapLink}>
                    <span>{t.stopDialog.fields.mapLink}</span>
                    <input
                      id={stopDialogFieldIds.mapLink}
                      type="url"
                      inputMode="url"
                      value={values.mapLink ?? ""}
                      onChange={(event) => update("mapLink", event.target.value)}
                      placeholder="https://maps.google.com/... or https://uri.amap.com/..."
                    />
                  </label>
                  <StopDialogDetails
                    detailLabels={detailLabels}
                    detailType={detailType}
                    detailValues={detailValues}
                    updateDetail={updateDetail}
                  />
                </div>
              </details>
            ) : (
              <>
                <label className={dialogFieldWideClassName} htmlFor={stopDialogFieldIds.mapLink}>
                  <span>{t.stopDialog.fields.mapLink}</span>
                  <input
                    id={stopDialogFieldIds.mapLink}
                    type="url"
                    inputMode="url"
                    value={values.mapLink ?? ""}
                    onChange={(event) => update("mapLink", event.target.value)}
                    placeholder="https://maps.google.com/... or https://uri.amap.com/..."
                  />
                </label>
                <StopDialogDetails
                  detailLabels={detailLabels}
                  detailType={detailType}
                  detailValues={detailValues}
                  updateDetail={updateDetail}
                />
              </>
            )}
            {placeResolution?.state === "ambiguous" ? (
              <div className={dialogFieldWideClassName} aria-label={t.stopDialog.placeResolution.candidates}>
                <div className={placeCandidateListClassName}>
                  {placeResolution.candidates.map((candidate) => (
                    <button
                      type="button"
                      className={placeCandidateButtonClassName}
                      key={`${candidate.source}:${candidate.name}:${candidate.address}`}
                      aria-label={t.stopDialog.actions.chooseCandidate({ name: candidate.name })}
                      aria-pressed={selectedCandidate?.mapLink === candidate.mapLink}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <strong>{candidate.name}</strong>
                      <span>{candidate.address}</span>
                      <span>{candidate.source} · {Math.round(candidate.confidence * 100)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {placeResolution?.state === "unresolved" ? (
              <p className={dialogWarningClassName} role="alert">
                {t.stopDialog.placeResolution.unresolved}
              </p>
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

          <div className={dialogActionsClassName}>
            {mode === "edit" && onDelete ? (
              <Button type="button" variant="danger" onClick={onDelete}>{t.stopDialog.actions.delete}</Button>
            ) : <span />}
            <span />
            <div className={dialogPrimaryActionsClassName}>
              {initialItem?.itemKind === "foodRecommendation" && onPromoteFoodRecommendation ? (
                <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onPromoteFoodRecommendation}>
                  Promote to meal
                </Button>
              ) : null}
              {placeResolution?.state === "unresolved" ? (
                <Button type="button" variant="ghost" disabled={isSubmitting} onClick={submitUnresolved}>{t.stopDialog.actions.saveUnresolved}</Button>
              ) : null}
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={onClose}>{t.stopDialog.actions.cancel}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t.stopDialog.messages.saving : mode === "create" ? t.stopDialog.actions.create : t.stopDialog.actions.edit}</Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
