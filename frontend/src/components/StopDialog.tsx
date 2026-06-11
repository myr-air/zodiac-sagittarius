import { useState, type FormEvent } from "react";
import type { ActivityType, ItineraryItem, ItineraryItemKind, ItineraryItemPriority, ItineraryItemStatus, ItineraryTimeMode, PlaceResolutionCandidate } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { formatDayLabel, getTripDates } from "@/src/trip/itinerary";
import { Button } from "./ui";
import { Icon } from "./icons";
import { formatThaiDate } from "./itineraryDisplay";
import { TimePickerField } from "./DateTimePickers";

type StopDetailType = "transportation" | "food" | "stay" | "attraction" | "event" | "task" | "shopping" | "experience";

interface StopDetailValues {
  bookingRef: string;
  budgetNote: string;
  costNote: string;
  detail: string;
  destination: string;
  entryWindow: string;
  meal: string;
  meetingPoint: string;
  mode: string;
  mustSee: string;
  mustTry: string;
  origin: string;
  provider: string;
  reservationName: string;
  targetItems: string;
  taxRefundNote: string;
  ticketRef: string;
}

export interface StopFormValues {
  day: string;
  pathId?: string;
  parentItemId?: string | null;
  itemKind: ItineraryItemKind;
  timeMode: ItineraryTimeMode;
  isPlanBlock: boolean;
  status: ItineraryItemStatus;
  priority: ItineraryItemPriority;
  startTime: string;
  activity: string;
  activityType: ActivityType;
  place: string;
  durationMinutes: number | null;
  transportation: string;
  details: Record<string, unknown>;
  note: string;
  resolvedPlace?: PlaceResolutionCandidate;
  saveUnresolved?: boolean;
}

export interface StopManualPathOption {
  id: string;
  name: string;
}

interface StopDialogProps {
  mode: "create" | "edit";
  endDate?: string;
  initialDay?: string;
  initialItem?: ItineraryItem;
  manualPathOptions?: StopManualPathOption[];
  onClose: () => void;
  onDelete?: () => void;
  onPromoteFoodRecommendation?: () => void;
  onSubmit: (values: StopFormValues) => void;
  placeResolution?: { state: "idle" | "resolving" | "ambiguous" | "unresolved"; candidates: PlaceResolutionCandidate[] };
  startDate?: string;
}

const detailTypeOptions: StopDetailType[] = ["transportation", "food", "stay", "attraction", "event", "task", "shopping", "experience"];
const detailTypeToActivityType: Record<StopDetailType, ActivityType> = {
  attraction: "attraction",
  event: "attraction",
  experience: "experience",
  food: "food",
  shopping: "shopping",
  stay: "stay",
  task: "experience",
  transportation: "travel",
};
const modalBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5 max-[767px]:items-end max-[767px]:p-2.5";
const stopDialogClassName = "stop-dialog max-h-[calc(100vh-40px)] w-[min(620px,100%)] overflow-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_24px_70px_rgb(15_23_42_/_0.22)]";
const dialogTitleRowClassName = "dialog-title-row grid min-h-[54px] grid-cols-[minmax(0,1fr)_34px] items-center gap-3 border-b border-(--color-border) px-4 [&_button]:grid [&_button]:size-[34px] [&_button]:rotate-180 [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-(--color-text-muted) [&_h2]:m-0 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:leading-[22px] [&_h2]:text-[#0f172a]";
const stopFormClassName = "stop-form grid gap-4 p-4";
const dialogGridClassName = "dialog-grid grid grid-cols-2 gap-3 max-[767px]:grid-cols-1 [&_input]:min-h-[38px] [&_input]:w-full [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:py-2 [&_input]:text-[13px] [&_input]:text-(--color-text) [&_label]:grid [&_label]:min-w-0 [&_label]:gap-1.5 [&_label>span]:text-xs [&_label>span]:font-bold [&_label>span]:text-(--color-text-muted) [&_select]:min-h-[38px] [&_select]:w-full [&_select]:rounded-(--radius-sm) [&_select]:border [&_select]:border-(--color-border-strong) [&_select]:bg-(--color-surface) [&_select]:px-2.5 [&_select]:py-2 [&_select]:text-[13px] [&_select]:text-(--color-text) [&_textarea]:min-h-[38px] [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-(--radius-sm) [&_textarea]:border [&_textarea]:border-(--color-border-strong) [&_textarea]:bg-(--color-surface) [&_textarea]:px-2.5 [&_textarea]:py-2 [&_textarea]:text-[13px] [&_textarea]:text-(--color-text)";
const dialogFieldWideClassName = "dialog-field-wide col-span-full";
const dialogActionsClassName = "dialog-actions grid grid-cols-[auto_1fr_auto] items-center gap-2.5 max-[767px]:grid-cols-1";
const dialogPrimaryActionsClassName = "dialog-primary-actions flex justify-end gap-2.5 max-[767px]:grid";
const placeCandidateListClassName = "place-candidate-list grid gap-2";
const placeCandidateButtonClassName = "place-candidate-button grid gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-left text-xs text-(--color-text) transition-[border-color,box-shadow] hover:border-(--color-primary) focus-visible:border-(--color-primary) focus-visible:outline-none aria-pressed:border-(--color-primary) aria-pressed:shadow-[0_0_0_2px_rgb(153_246_228_/_0.42)] [&_strong]:text-sm [&_strong]:font-extrabold [&_span]:text-(--color-text-muted)";

const fieldIds = {
  activity: "stop-activity",
  activityType: "stop-activity-type",
  bookingRef: "stop-booking-ref",
  budgetNote: "stop-budget-note",
  costNote: "stop-cost-note",
  day: "stop-day",
  detail: "stop-detail",
  destination: "stop-destination",
  path: "stop-path",
  durationHours: "stop-duration-hours",
  durationMinutes: "stop-duration-minutes",
  endTime: "stop-end-time",
  entryWindow: "stop-entry-window",
  meal: "stop-meal",
  meetingPoint: "stop-meeting-point",
  mode: "stop-mode",
  mustSee: "stop-must-see",
  mustTry: "stop-must-try",
  note: "stop-note",
  origin: "stop-origin",
  place: "stop-place",
  provider: "stop-provider",
  reservationName: "stop-reservation-name",
  startTime: "stop-start-time",
  targetItems: "stop-target-items",
  taxRefundNote: "stop-tax-refund-note",
  ticketRef: "stop-ticket-ref",
  transportation: "stop-transportation",
  itemKind: "stop-item-kind",
  timeMode: "stop-time-mode",
  isPlanBlock: "stop-is-plan-block",
  status: "stop-status",
  priority: "stop-priority",
};

const emptyDetailValues: StopDetailValues = {
  bookingRef: "",
  budgetNote: "",
  costNote: "",
  detail: "",
  destination: "",
  entryWindow: "",
  meal: "",
  meetingPoint: "",
  mode: "",
  mustSee: "",
  mustTry: "",
  origin: "",
  provider: "",
  reservationName: "",
  targetItems: "",
  taxRefundNote: "",
  ticketRef: "",
};

export function StopDialog({ mode, endDate, initialDay, initialItem, manualPathOptions = [], onClose, onDelete, onPromoteFoodRecommendation, onSubmit, placeResolution, startDate }: StopDialogProps) {
  const { locale, t } = useI18n();
  const dayOptions = startDate && endDate ? getTripDates(startDate, endDate) : [];
  const [values, setValues] = useState<StopFormValues>(() => ({
    day: initialItem?.day ?? initialDay ?? startDate ?? "",
    pathId: initialItem?.pathRole === "alternative" ? initialItem.pathId : "main",
    parentItemId: initialItem?.parentItemId ?? null,
    itemKind: initialItem?.itemKind ?? "activity",
    timeMode: initialItem?.timeMode ?? "scheduled",
    isPlanBlock: initialItem?.isPlanBlock ?? false,
    status: initialItem?.status ?? "idea",
    priority: initialItem?.priority ?? "normal",
    startTime: initialItem?.startTime ?? "16:30",
    activity: initialItem?.activity ?? "",
    activityType: initialItem?.activityType ?? "experience",
    place: initialItem?.place ?? "",
    durationMinutes: initialItem?.durationMinutes ?? 45,
    transportation: initialItem?.transportation ?? "",
    details: initialItem?.details ?? {},
    note: initialItem?.note ?? "",
  }));
  const [detailType, setDetailType] = useState<StopDetailType>(() => detailTypeFromActivityType(initialItem?.activityType ?? "experience"));
  const [detailValues, setDetailValues] = useState<StopDetailValues>(() => ({
    ...emptyDetailValues,
    detail: initialItem?.note ?? "",
    mode: initialItem?.transportation ?? "",
  }));
  const [selectedCandidate, setSelectedCandidate] = useState<PlaceResolutionCandidate | undefined>();

  const title = mode === "create" ? t.stopDialog.titles.create : t.stopDialog.titles.edit;
  const detailLabels = stopDetailLabels(locale);
  const endTime = addMinutesToTime(values.startTime, Math.max(1, Number(values.durationMinutes) || 1));
  const minuteOptions = durationMinuteOptions((values.durationMinutes ?? 45) % 60);

  function update<K extends keyof StopFormValues>(key: K, value: StopFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateDuration(hours: number, minutes: number) {
    update("durationMinutes", hours * 60 + minutes);
  }

  function updateEndTime(nextEndTime: string) {
    const nextDuration = durationBetweenTimes(values.startTime, nextEndTime);
    if (nextDuration !== null) update("durationMinutes", nextDuration);
  }

  function updateDetail<K extends keyof StopDetailValues>(key: K, value: StopDetailValues[K]) {
    setDetailValues((current) => ({ ...current, [key]: value }));
  }

  function updateActivity(activity: string) {
    update("activity", activity);
    const parsedRoute = parseRouteActivity(activity);
    if (!parsedRoute) return;

    setDetailType("transportation");
    setDetailValues((current) => ({
      ...current,
      destination: parsedRoute.destination,
      origin: parsedRoute.origin,
    }));
    if (parsedRoute.startTime && parsedRoute.durationMinutes) {
      setValues((current) => ({
        ...current,
        activity,
        durationMinutes: parsedRoute.durationMinutes ?? current.durationMinutes,
        startTime: parsedRoute.startTime ?? current.startTime,
      }));
    }
  }

  function buildSubmitValues(saveUnresolved: boolean): StopFormValues {
    const details = buildStructuredStopDetails(detailType, detailValues);
    const nextPlace = detailType === "transportation"
      ? values.place || readStringDetail(details.destination) || readStringDetail(details.origin)
      : values.place;

    return {
      ...values,
      activity: values.activity.trim(),
      activityType: detailTypeToActivityType[detailType],
      startTime: values.timeMode === "flexible" ? "" : values.startTime,
      durationMinutes: values.timeMode === "flexible" ? null : Math.max(1, Number(values.durationMinutes) || 1),
      details,
      place: nextPlace.trim(),
      transportation: values.transportation.trim(),
      note: values.note.trim(),
      resolvedPlace: saveUnresolved ? undefined : selectedCandidate,
      saveUnresolved,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(buildSubmitValues(false));
  }

  function submitUnresolved() {
    onSubmit(buildSubmitValues(true));
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
            {mode === "edit" && dayOptions.length ? (
              <label className={dialogFieldWideClassName} htmlFor={fieldIds.day}>
                <span>{t.stopDialog.fields.day}</span>
                <select id={fieldIds.day} value={values.day} onChange={(event) => update("day", event.target.value)}>
                  {dayOptions.map((day) => (
                    <option value={day} key={day}>{formatDayLabel(day, startDate ?? day, locale)} · {formatThaiDate(day, locale)}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {mode === "edit" && manualPathOptions.length > 1 ? (
              <label className={dialogFieldWideClassName} htmlFor={fieldIds.path}>
                <span>{t.stopDialog.fields.plan}</span>
                <select id={fieldIds.path} value={values.pathId ?? "main"} onChange={(event) => update("pathId", event.target.value)}>
                  {manualPathOptions.map((option) => (
                    <option value={option.id} key={option.id}>{option.name}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label htmlFor={fieldIds.itemKind}>
              <span>Item kind</span>
              <select id={fieldIds.itemKind} value={values.itemKind} onChange={(event) => update("itemKind", event.target.value as ItineraryItemKind)}>
                {["travel", "activity", "lodging", "meal", "note", "preparation", "foodRecommendation"].map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label htmlFor={fieldIds.timeMode}>
              <span>Time mode</span>
              <select id={fieldIds.timeMode} value={values.timeMode} onChange={(event) => update("timeMode", event.target.value as ItineraryTimeMode)}>
                <option value="scheduled">scheduled</option>
                <option value="flexible">flexible</option>
              </select>
            </label>
            <label htmlFor={fieldIds.status}>
              <span>Status</span>
              <select id={fieldIds.status} value={values.status} onChange={(event) => update("status", event.target.value as ItineraryItemStatus)}>
                {["idea", "planned", "booked", "confirmed", "done", "skipped"].map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label htmlFor={fieldIds.priority}>
              <span>Priority</span>
              <select id={fieldIds.priority} value={values.priority} onChange={(event) => update("priority", event.target.value as ItineraryItemPriority)}>
                {["low", "normal", "high", "must"].map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={dialogFieldWideClassName} htmlFor={fieldIds.isPlanBlock}>
              <span>
                <input
                  id={fieldIds.isPlanBlock}
                  type="checkbox"
                  checked={values.isPlanBlock}
                  onChange={(event) => update("isPlanBlock", event.target.checked)}
                />
                Plan block
              </span>
            </label>
            <label htmlFor={fieldIds.activityType}>
              <span>{t.stopDialog.fields.type}</span>
              <select id={fieldIds.activityType} value={detailType} onChange={(event) => setDetailType(event.target.value as StopDetailType)}>
                {detailTypeOptions.map((option) => (
                  <option value={option} key={option}>{detailLabels.types[option]}</option>
                ))}
              </select>
            </label>
            <label htmlFor={fieldIds.startTime}>
              <span>{t.stopDialog.fields.startTime}</span>
              <TimePickerField id={fieldIds.startTime} value={values.startTime} onChange={(value) => update("startTime", value)} required={values.timeMode !== "flexible"} />
            </label>
            <label htmlFor={fieldIds.endTime}>
              <span>{t.stopDialog.fields.endTime}</span>
              <TimePickerField id={fieldIds.endTime} value={endTime} onChange={updateEndTime} required={values.timeMode !== "flexible"} />
            </label>
            <label htmlFor={fieldIds.durationHours}>
              <span>{t.stopDialog.fields.hours}</span>
              <input
                id={fieldIds.durationHours}
                min={0}
                type="number"
                value={Math.floor((values.durationMinutes ?? 45) / 60)}
                onChange={(event) => updateDuration(Number(event.target.value), (values.durationMinutes ?? 45) % 60)}
                required={values.timeMode !== "flexible"}
              />
            </label>
            <label htmlFor={fieldIds.durationMinutes}>
              <span>{t.stopDialog.fields.minutes}</span>
              <select
                id={fieldIds.durationMinutes}
                value={(values.durationMinutes ?? 45) % 60}
                onChange={(event) => updateDuration(Math.floor((values.durationMinutes ?? 45) / 60), Number(event.target.value))}
              >
                {minuteOptions.map((minutes) => (
                  <option value={minutes} key={minutes}>{minutes}</option>
                ))}
              </select>
            </label>
            <label className={dialogFieldWideClassName} htmlFor={fieldIds.activity}>
              <span>{t.stopDialog.fields.activity}</span>
              <input id={fieldIds.activity} value={values.activity} onChange={(event) => updateActivity(event.target.value)} required />
            </label>
            <label htmlFor={fieldIds.place}>
              <span>{t.stopDialog.fields.place}</span>
              <input id={fieldIds.place} value={values.place} onChange={(event) => update("place", event.target.value)} required={detailType !== "transportation"} />
            </label>
            <StopDetailFields
              detailLabels={detailLabels}
              detailType={detailType}
              detailValues={detailValues}
              updateDetail={updateDetail}
            />
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
            {detailType === "transportation" ? null : (
              <label className={dialogFieldWideClassName} htmlFor={fieldIds.transportation}>
                <span>{t.stopDialog.fields.transportation}</span>
                <input id={fieldIds.transportation} value={values.transportation} onChange={(event) => update("transportation", event.target.value)} />
              </label>
            )}
            <label className={dialogFieldWideClassName} htmlFor={fieldIds.note}>
              <span>{t.stopDialog.fields.note}</span>
              <textarea id={fieldIds.note} value={values.note} onChange={(event) => update("note", event.target.value)} rows={3} />
            </label>
          </div>

          <div className={dialogActionsClassName}>
            {mode === "edit" && onDelete ? (
              <Button type="button" variant="danger" onClick={onDelete}>{t.stopDialog.actions.delete}</Button>
            ) : <span />}
            <span />
            <div className={dialogPrimaryActionsClassName}>
              {initialItem?.itemKind === "foodRecommendation" && onPromoteFoodRecommendation ? (
                <Button type="button" variant="secondary" onClick={onPromoteFoodRecommendation}>
                  Promote to meal
                </Button>
              ) : null}
              {placeResolution?.state === "unresolved" ? (
                <Button type="button" variant="ghost" onClick={submitUnresolved}>{t.stopDialog.actions.saveUnresolved}</Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={onClose}>{t.stopDialog.actions.cancel}</Button>
              <Button type="submit">{mode === "create" ? t.stopDialog.actions.create : t.stopDialog.actions.edit}</Button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

function StopDetailFields({
  detailLabels,
  detailType,
  detailValues,
  updateDetail,
}: {
  detailLabels: ReturnType<typeof stopDetailLabels>;
  detailType: StopDetailType;
  detailValues: StopDetailValues;
  updateDetail: <K extends keyof StopDetailValues>(key: K, value: StopDetailValues[K]) => void;
}) {
  if (detailType === "transportation") {
    return (
      <>
        <DetailInput id={fieldIds.origin} label={detailLabels.fields.origin} value={detailValues.origin} onChange={(value) => updateDetail("origin", value)} />
        <DetailInput id={fieldIds.destination} label={detailLabels.fields.destination} value={detailValues.destination} onChange={(value) => updateDetail("destination", value)} />
        <DetailInput id={fieldIds.mode} label={detailLabels.fields.mode} value={detailValues.mode} onChange={(value) => updateDetail("mode", value)} />
        <DetailInput id={fieldIds.ticketRef} label={detailLabels.fields.ticketRef} value={detailValues.ticketRef} onChange={(value) => updateDetail("ticketRef", value)} />
        <DetailInput id={fieldIds.costNote} label={detailLabels.fields.costNote} value={detailValues.costNote} onChange={(value) => updateDetail("costNote", value)} />
      </>
    );
  }

  if (detailType === "food") {
    return (
      <>
        <DetailInput id={fieldIds.meal} label={detailLabels.fields.meal} value={detailValues.meal} onChange={(value) => updateDetail("meal", value)} />
        <DetailInput id={fieldIds.reservationName} label={detailLabels.fields.reservationName} value={detailValues.reservationName} onChange={(value) => updateDetail("reservationName", value)} />
        <DetailInput id={fieldIds.mustTry} label={detailLabels.fields.mustTry} value={detailValues.mustTry} onChange={(value) => updateDetail("mustTry", value)} />
        <DetailInput id={fieldIds.budgetNote} label={detailLabels.fields.budgetNote} value={detailValues.budgetNote} onChange={(value) => updateDetail("budgetNote", value)} />
      </>
    );
  }

  if (detailType === "stay") {
    return (
      <>
        <DetailInput id={fieldIds.entryWindow} label={detailLabels.fields.checkWindow} value={detailValues.entryWindow} onChange={(value) => updateDetail("entryWindow", value)} />
        <DetailInput id={fieldIds.bookingRef} label={detailLabels.fields.bookingRef} value={detailValues.bookingRef} onChange={(value) => updateDetail("bookingRef", value)} />
        <DetailInput id={fieldIds.detail} label={detailLabels.fields.luggageDetail} value={detailValues.detail} onChange={(value) => updateDetail("detail", value)} />
      </>
    );
  }

  if (detailType === "attraction" || detailType === "event") {
    return (
      <>
        <DetailInput id={fieldIds.entryWindow} label={detailLabels.fields.entryWindow} value={detailValues.entryWindow} onChange={(value) => updateDetail("entryWindow", value)} />
        <DetailInput id={fieldIds.ticketRef} label={detailLabels.fields.ticketRef} value={detailValues.ticketRef} onChange={(value) => updateDetail("ticketRef", value)} />
        <DetailInput id={fieldIds.mustSee} label={detailLabels.fields.mustSee} value={detailValues.mustSee} onChange={(value) => updateDetail("mustSee", value)} />
      </>
    );
  }

  if (detailType === "task") {
    return (
      <>
        <DetailInput id={fieldIds.detail} label={detailLabels.fields.detail} value={detailValues.detail} onChange={(value) => updateDetail("detail", value)} />
        <DetailInput id={fieldIds.meetingPoint} label={detailLabels.fields.relatedPlace} value={detailValues.meetingPoint} onChange={(value) => updateDetail("meetingPoint", value)} />
      </>
    );
  }

  if (detailType === "shopping") {
    return (
      <>
        <DetailInput id={fieldIds.targetItems} label={detailLabels.fields.targetItems} value={detailValues.targetItems} onChange={(value) => updateDetail("targetItems", value)} />
        <DetailInput id={fieldIds.budgetNote} label={detailLabels.fields.budgetNote} value={detailValues.budgetNote} onChange={(value) => updateDetail("budgetNote", value)} />
        <DetailInput id={fieldIds.taxRefundNote} label={detailLabels.fields.taxRefundNote} value={detailValues.taxRefundNote} onChange={(value) => updateDetail("taxRefundNote", value)} />
      </>
    );
  }

  return (
    <>
      <DetailInput id={fieldIds.provider} label={detailLabels.fields.provider} value={detailValues.provider} onChange={(value) => updateDetail("provider", value)} />
      <DetailInput id={fieldIds.meetingPoint} label={detailLabels.fields.meetingPoint} value={detailValues.meetingPoint} onChange={(value) => updateDetail("meetingPoint", value)} />
      <DetailInput id={fieldIds.bookingRef} label={detailLabels.fields.bookingRef} value={detailValues.bookingRef} onChange={(value) => updateDetail("bookingRef", value)} />
    </>
  );
}

function DetailInput({ id, label, onChange, value }: { id: string; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label htmlFor={id}>
      <span>{label}</span>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function buildStructuredStopDetails(detailType: StopDetailType, detailValues: StopDetailValues): Record<string, unknown> {
  const details = trimmedDetailValues(detailValues);
  const nextDetails: Record<string, unknown> = { kind: detailType };

  for (const key of detailKeysForType(detailType)) {
    const value = details[key];
    if (value) nextDetails[key] = value;
  }
  return nextDetails;
}

function detailKeysForType(detailType: StopDetailType): Array<keyof StopDetailValues> {
  if (detailType === "transportation") {
    return ["origin", "destination", "mode", "ticketRef", "costNote"];
  }
  if (detailType === "food") {
    return ["meal", "reservationName", "mustTry", "budgetNote"];
  }
  if (detailType === "stay") {
    return ["entryWindow", "bookingRef", "detail"];
  }
  if (detailType === "attraction" || detailType === "event") {
    return ["entryWindow", "ticketRef", "mustSee"];
  }
  if (detailType === "task") {
    return ["detail", "meetingPoint"];
  }
  if (detailType === "shopping") {
    return ["targetItems", "budgetNote", "taxRefundNote"];
  }
  return ["provider", "meetingPoint", "bookingRef"];
}

function readStringDetail(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function trimmedDetailValues(values: StopDetailValues): StopDetailValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  ) as StopDetailValues;
}

function detailTypeFromActivityType(activityType: ActivityType): StopDetailType {
  if (activityType === "travel") return "transportation";
  return activityType;
}

function addMinutesToTime(startTime: string, durationMinutes: number): string {
  const start = timeToMinutes(startTime);
  if (start === null) return "";
  const total = (start + durationMinutes) % (24 * 60);
  return minutesToTime(total);
}

function durationBetweenTimes(startTime: string, endTime: string): number | null {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return null;
  const duration = (end - start + 24 * 60) % (24 * 60);
  return Math.max(1, duration);
}

function parseRouteActivity(value: string): { destination: string; durationMinutes?: number; origin: string; startTime?: string } | null {
  const match = /^\s*(.+?)\s*(?:->|→)\s*(.+?)(?:\s*\((.*?)\))?\s*$/.exec(value);
  if (!match) return null;
  const origin = match[1]?.trim();
  const destination = match[2]?.trim();
  if (!origin || !destination) return null;
  const timeRange = parseTimeRange(match[3] ?? "");

  return {
    destination,
    durationMinutes: timeRange?.durationMinutes,
    origin,
    startTime: timeRange?.startTime,
  };
}

function parseTimeRange(value: string): { durationMinutes: number; startTime: string } | null {
  const match = /(\d{1,2})[.:](\d{2})\s*(am|pm)?\s*[-–]\s*(\d{1,2})[.:](\d{2})\s*(am|pm)?/i.exec(value);
  if (!match) return null;
  const startTime = normalizeClockTime(match[1], match[2], match[3] || match[6]);
  const endTime = normalizeClockTime(match[4], match[5], match[6] || match[3]);
  if (!startTime || !endTime) return null;
  const durationMinutes = durationBetweenTimes(startTime, endTime);
  if (durationMinutes === null) return null;
  return { durationMinutes, startTime };
}

function normalizeClockTime(hourText: string, minuteText: string, meridiem?: string): string | null {
  let hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59) return null;
  if (meridiem) {
    const normalizedMeridiem = meridiem.toLowerCase();
    if (hour < 1 || hour > 12) return null;
    if (normalizedMeridiem === "pm" && hour < 12) hour += 12;
    if (normalizedMeridiem === "am" && hour === 12) hour = 0;
  }
  if (hour > 23) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function minutesToTime(value: number): string {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function durationMinuteOptions(currentMinute: number): number[] {
  return Array.from(new Set([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, currentMinute])).sort((a, b) => a - b);
}

function stopDetailLabels(locale: "en" | "th") {
  if (locale === "th") {
    return {
      types: {
        attraction: "สถานที่",
        event: "อีเวนต์ / รอบเวลา",
        experience: "กิจกรรม",
        food: "อาหาร",
        shopping: "ช้อปปิ้ง",
        stay: "ที่พัก",
        task: "งานต้องทำ",
        transportation: "การเดินทาง",
      },
      fields: {
        bookingRef: "เลขจอง / booking",
        budgetNote: "งบ / ค่าใช้จ่าย",
        checkWindow: "เวลาเช็กอิน / เช็กเอาต์",
        costNote: "ค่าใช้จ่าย",
        destination: "ถึง",
        detail: "รายละเอียด",
        entryWindow: "รอบ / ช่วงเวลา",
        luggageDetail: "กระเป๋า / รายละเอียด",
        meal: "มื้ออาหาร",
        meetingPoint: "จุดนัดพบ",
        mode: "โดย",
        mustSee: "จุดที่ต้องดู",
        mustTry: "เมนูที่ต้องลอง",
        origin: "จาก",
        provider: "ผู้ให้บริการ",
        relatedPlace: "สถานที่เกี่ยวข้อง",
        reservationName: "ชื่อจอง",
        targetItems: "ของที่อยากซื้อ",
        taxRefundNote: "tax refund",
        ticketRef: "ตั๋ว / pass",
      },
    };
  }

  return {
    types: {
      attraction: "Attraction",
      event: "Event",
      experience: "Experience",
      food: "Food",
      shopping: "Shopping",
      stay: "Stay",
      task: "Task",
      transportation: "Transportation",
    },
    fields: {
      bookingRef: "Booking ref",
      budgetNote: "Budget note",
      checkWindow: "Check-in / out",
      costNote: "Cost / spend note",
      destination: "To",
      detail: "Detail",
      entryWindow: "Round / time slot",
      luggageDetail: "Bag / luggage detail",
      meal: "Meal",
      meetingPoint: "Meeting point",
      mode: "By",
      mustSee: "Must see",
      mustTry: "Must try",
      origin: "From",
      provider: "Provider",
      relatedPlace: "Related place",
      reservationName: "Reservation name",
      targetItems: "Target items",
      taxRefundNote: "Tax refund note",
      ticketRef: "Ticket / pass",
    },
  };
}
