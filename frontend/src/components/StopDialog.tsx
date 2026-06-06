import { useState, type FormEvent } from "react";
import type { ActivityType, ItineraryItem, PlaceResolutionCandidate } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { formatDayLabel, getTripDates } from "@/src/trip/itinerary";
import { Button } from "./ui";
import { Icon } from "./icons";
import { activityTypeLabel, formatThaiDate } from "./itineraryDisplay";

export interface StopFormValues {
  day: string;
  pathId?: string;
  startTime: string;
  activity: string;
  activityType: ActivityType;
  place: string;
  durationMinutes: number;
  transportation: string;
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
  onSubmit: (values: StopFormValues) => void;
  placeResolution?: { state: "idle" | "resolving" | "ambiguous" | "unresolved"; candidates: PlaceResolutionCandidate[] };
  startDate?: string;
}

const activityTypeOptions: ActivityType[] = ["food", "attraction", "experience", "travel", "shopping", "stay"];
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
  day: "stop-day",
  path: "stop-path",
  durationHours: "stop-duration-hours",
  durationMinutes: "stop-duration-minutes",
  note: "stop-note",
  place: "stop-place",
  startTime: "stop-start-time",
  transportation: "stop-transportation",
};

export function StopDialog({ mode, endDate, initialDay, initialItem, manualPathOptions = [], onClose, onDelete, onSubmit, placeResolution, startDate }: StopDialogProps) {
  const { locale, t } = useI18n();
  const dayOptions = startDate && endDate ? getTripDates(startDate, endDate) : [];
  const [values, setValues] = useState<StopFormValues>(() => ({
    day: initialItem?.day ?? initialDay ?? startDate ?? "",
    pathId: initialItem?.pathRole === "alternative" ? initialItem.pathId : "main",
    startTime: initialItem?.startTime ?? "16:30",
    activity: initialItem?.activity ?? "",
    activityType: initialItem?.activityType ?? "experience",
    place: initialItem?.place ?? "",
    durationMinutes: initialItem?.durationMinutes ?? 45,
    transportation: initialItem?.transportation ?? "",
    note: initialItem?.note ?? "",
  }));
  const [selectedCandidate, setSelectedCandidate] = useState<PlaceResolutionCandidate | undefined>();

  const title = mode === "create" ? t.stopDialog.titles.create : t.stopDialog.titles.edit;

  function update<K extends keyof StopFormValues>(key: K, value: StopFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateDuration(hours: number, minutes: number) {
    update("durationMinutes", hours * 60 + minutes);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...values,
      activity: values.activity.trim(),
      place: values.place.trim(),
      transportation: values.transportation.trim(),
      note: values.note.trim(),
      durationMinutes: Math.max(1, Number(values.durationMinutes) || 1),
      resolvedPlace: selectedCandidate,
      saveUnresolved: false,
    });
  }

  function submitUnresolved() {
    onSubmit({
      ...values,
      activity: values.activity.trim(),
      place: values.place.trim(),
      transportation: values.transportation.trim(),
      note: values.note.trim(),
      durationMinutes: Math.max(1, Number(values.durationMinutes) || 1),
      resolvedPlace: undefined,
      saveUnresolved: true,
    });
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
            <label htmlFor={fieldIds.startTime}>
              <span>{t.stopDialog.fields.time}</span>
              <input id={fieldIds.startTime} type="time" value={values.startTime} onChange={(event) => update("startTime", event.target.value)} required />
            </label>
            <label htmlFor={fieldIds.durationHours}>
              <span>{t.stopDialog.fields.hours}</span>
              <input
                id={fieldIds.durationHours}
                min={0}
                type="number"
                value={Math.floor(values.durationMinutes / 60)}
                onChange={(event) => updateDuration(Number(event.target.value), values.durationMinutes % 60)}
                required
              />
            </label>
            <label htmlFor={fieldIds.durationMinutes}>
              <span>{t.stopDialog.fields.minutes}</span>
              <select
                id={fieldIds.durationMinutes}
                value={values.durationMinutes % 60}
                onChange={(event) => updateDuration(Math.floor(values.durationMinutes / 60), Number(event.target.value))}
              >
                {[0, 5, 10, 15, 20, 30, 45, 50, 55].map((minutes) => (
                  <option value={minutes} key={minutes}>{minutes}</option>
                ))}
              </select>
            </label>
            <label className={dialogFieldWideClassName} htmlFor={fieldIds.activity}>
              <span>{t.stopDialog.fields.activity}</span>
              <input id={fieldIds.activity} value={values.activity} onChange={(event) => update("activity", event.target.value)} required />
            </label>
            <label htmlFor={fieldIds.activityType}>
              <span>{t.stopDialog.fields.type}</span>
              <select id={fieldIds.activityType} value={values.activityType} onChange={(event) => update("activityType", event.target.value as ActivityType)}>
                {activityTypeOptions.map((option) => (
                  <option value={option} key={option}>{activityTypeLabel(option, locale)}</option>
                ))}
              </select>
            </label>
            <label htmlFor={fieldIds.place}>
              <span>{t.stopDialog.fields.place}</span>
              <input id={fieldIds.place} value={values.place} onChange={(event) => update("place", event.target.value)} required />
            </label>
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
            <label className={dialogFieldWideClassName} htmlFor={fieldIds.transportation}>
              <span>{t.stopDialog.fields.transportation}</span>
              <input id={fieldIds.transportation} value={values.transportation} onChange={(event) => update("transportation", event.target.value)} />
            </label>
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
