import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { TimePickerField } from "@/src/shared/components/date-time-pickers";
import { Icon } from "@/src/ui/icons";
import {
  endOffsetDaysBetweenTimes,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import { buildTimeEditModalModel } from "@/src/features/itinerary/domain/time-edit-modal-model";
import {
  subActivityModalCloseClassName,
  timeEditFieldsClassName,
  timeEditFieldClassName,
  timeEditHelperClassName,
  timeEditInputClassName,
  timeEditCancelButtonClassName,
  timeEditModalBackdropClassName,
  timeEditModalBodyClassName,
  timeEditModalClassName,
  timeEditModalFooterClassName,
  timeEditModalHeaderClassName,
  timeEditModalTitleClassName,
  timeEditNextDayClassName,
  timeEditPreviewClassName,
  timeEditPreviewValueClassName,
  timeEditSaveButtonClassName,
} from "../smart-itinerary-table.styles";
import { useEscapeToClose } from "./use-escape-close";
import type { TimeEditModalProps } from "./time-components.types";

export function TimeEditModal({
  item,
  itineraryLabels,
  locale,
  onClose,
  onSave,
}: TimeEditModalProps) {
  const [startTime, setStartTime] = useState(item.startTime ?? "");
  const [endTime, setEndTime] = useState(item.endTime ?? "");
  const [endOffsetDays, setEndOffsetDays] = useState(
    item.endTime ? item.endOffsetDays ?? 0 : 0,
  );
  const [saving, setSaving] = useState(false);
  const model = buildTimeEditModalModel({
    endOffsetDays,
    endTime,
    locale,
    startTime,
  });

  useEscapeToClose(onClose);

  function updateStartTime(nextStartTime: string) {
    setStartTime(nextStartTime);
    if (!endTime) return;
    const nextOffset = endOffsetDaysBetweenTimes(nextStartTime, endTime);
    setEndOffsetDays(nextOffset);
  }

  function updateEndTime(nextEndTime: string) {
    setEndTime(nextEndTime);
    setEndOffsetDays(
      nextEndTime ? endOffsetDaysBetweenTimes(startTime, nextEndTime) : 0,
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || model.errorMessage) return;
    setSaving(true);
    try {
      await onSave({
        startTime: startTime.trim(),
        endTime: endTime.trim() || null,
        endOffsetDays: endTime.trim() ? endOffsetDays : 0,
        durationMinutes: endTime.trim() ? model.derivedDuration : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={timeEditModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <form
        className={timeEditModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void save(event)}
      >
        <header className={timeEditModalHeaderClassName}>
          <strong className={timeEditModalTitleClassName}>
            <span>{item.activity}</span>
            <small>
              {itineraryLabels.row.inlineTime({ activity: item.activity })}
            </small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label="Close time editor"
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={timeEditModalBodyClassName}>
          <div className={timeEditFieldsClassName}>
            <label className={timeEditFieldClassName}>
              <span>{model.startLabel}</span>
              <TimePickerField
                className={timeEditInputClassName}
                value={startTime}
                onChange={updateStartTime}
              />
            </label>
            <label className={timeEditFieldClassName}>
              <span>{model.endLabel}</span>
              <TimePickerField
                className={timeEditInputClassName}
                value={endTime}
                onChange={updateEndTime}
              />
            </label>
          </div>
          <p className={timeEditHelperClassName}>
            {model.timeFormatHint} {model.optionalEndHint}
          </p>
          <button
            type="button"
            className={timeEditNextDayClassName}
            aria-pressed={endOffsetDays > 0}
            disabled={!endTime}
            onClick={() => setEndOffsetDays((current) => (current > 0 ? 0 : 1))}
          >
            +1 {locale === "th" ? "จบวันถัดไป" : "next day end"}
          </button>
          <div className={timeEditPreviewClassName}>
            <span>
              {locale === "th" ? "ตัวอย่างที่จะแสดง" : "Display preview"}
            </span>
            <strong className={timeEditPreviewValueClassName}>
              {model.previewWindow}
            </strong>
            <span>{model.durationLabel}</span>
          </div>
          {model.errorMessage ? (
            <p className="text-xs font-bold text-(--color-danger)" role="alert">
              {model.errorMessage}
            </p>
          ) : null}
        </div>
        <footer className={timeEditModalFooterClassName}>
          <button
            type="button"
            className={timeEditCancelButtonClassName}
            onClick={onClose}
          >
            {itineraryLabels.row.durationCancel}
          </button>
          <button
            type="submit"
            className={timeEditSaveButtonClassName}
            disabled={saving || Boolean(model.errorMessage)}
          >
            {itineraryLabels.row.durationSave}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
