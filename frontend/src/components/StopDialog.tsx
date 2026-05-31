import { useState, type FormEvent } from "react";
import type { ActivityType, ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Button } from "./ui";
import { Icon } from "./icons";
import { activityTypeLabel } from "./itineraryDisplay";

export interface StopFormValues {
  startTime: string;
  activity: string;
  activityType: ActivityType;
  place: string;
  durationMinutes: number;
  transportation: string;
  note: string;
}

interface StopDialogProps {
  mode: "create" | "edit";
  initialItem?: ItineraryItem;
  onClose: () => void;
  onSubmit: (values: StopFormValues) => void;
}

const activityTypeOptions: ActivityType[] = ["food", "attraction", "experience", "travel", "shopping", "stay"];

const fieldIds = {
  activity: "stop-activity",
  activityType: "stop-activity-type",
  durationHours: "stop-duration-hours",
  durationMinutes: "stop-duration-minutes",
  note: "stop-note",
  place: "stop-place",
  startTime: "stop-start-time",
  transportation: "stop-transportation",
};

export function StopDialog({ mode, initialItem, onClose, onSubmit }: StopDialogProps) {
  const { locale, t } = useI18n();
  const [values, setValues] = useState<StopFormValues>(() => ({
    startTime: initialItem?.startTime ?? "16:30",
    activity: initialItem?.activity ?? "",
    activityType: initialItem?.activityType ?? "experience",
    place: initialItem?.place ?? "",
    durationMinutes: initialItem?.durationMinutes ?? 45,
    transportation: initialItem?.transportation ?? "",
    note: initialItem?.note ?? "",
  }));

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
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stop-dialog" role="dialog" aria-modal="true" aria-labelledby="stop-dialog-title">
        <div className="dialog-title-row">
          <h2 id="stop-dialog-title">{title}</h2>
          <button type="button" aria-label={t.stopDialog.closeForm} onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <form className="stop-form" onSubmit={handleSubmit}>
          <div className="dialog-grid">
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
            <label className="dialog-field-wide" htmlFor={fieldIds.activity}>
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
            <label className="dialog-field-wide" htmlFor={fieldIds.transportation}>
              <span>{t.stopDialog.fields.transportation}</span>
              <input id={fieldIds.transportation} value={values.transportation} onChange={(event) => update("transportation", event.target.value)} />
            </label>
            <label className="dialog-field-wide" htmlFor={fieldIds.note}>
              <span>{t.stopDialog.fields.note}</span>
              <textarea id={fieldIds.note} value={values.note} onChange={(event) => update("note", event.target.value)} rows={3} />
            </label>
          </div>

          <div className="dialog-actions">
            <Button type="button" variant="ghost" onClick={onClose}>{t.stopDialog.actions.cancel}</Button>
            <Button type="submit">{mode === "create" ? t.stopDialog.actions.create : t.stopDialog.actions.edit}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
