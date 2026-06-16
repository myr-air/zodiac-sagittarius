import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/src/ui/icons";
import { formatDuration } from "@/src/features/itinerary/lib";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type { InlineItineraryItemPatch } from "../../../lib";
import type { ItineraryItem } from "@/src/trip/types";

import {
  endOffsetDaysBetweenTimes,
  formatTimeRangeLabel,
  formatTimeTooltip,
  parseTimeToMinutes,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  activityTimeButtonClassName,
  activityTimeEndClassName,
  activityTimeStartClassName,
  subActivityModalCloseClassName,
  timeEditFieldsClassName,
  timeEditFieldClassName,
  timeEditHelperClassName,
  timeEditInputClassName,
  timeEditModalBackdropClassName,
  timeEditModalBodyClassName,
  timeEditModalClassName,
  timeEditModalFooterClassName,
  timeEditModalHeaderClassName,
  timeEditModalTitleClassName,
  timeEditNextDayClassName,
  timeEditPreviewClassName,
  timeEditPreviewValueClassName,
} from "../../smart-itinerary-table.styles";
import { useEscapeToClose } from "./use-escape-close";

export function ActivityTimeButton({
  editable,
  item,
  itineraryLabels,
  locale,
  onSave,
}: {
  editable: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onSave: (patch: InlineItineraryItemPatch) => void | Promise<void>;
}) {
  const [timeEditOpen, setTimeEditOpen] = useState(false);
  const timeTooltip = formatTimeTooltip(item, locale);
  const startLabel = item.startTime?.trim() || "--:--";
  const endLabel = item.endTime?.trim()
    ? `${item.endTime.trim()}${item.endOffsetDays ? ` +${item.endOffsetDays}` : ""}`
    : "--:--";

  return (
    <>
      <button
        type="button"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        className={activityTimeButtonClassName}
        disabled={!editable}
        title={timeTooltip}
        onClick={(event) => {
          event.stopPropagation();
          setTimeEditOpen(true);
        }}
      >
        <span className={activityTimeStartClassName}>{startLabel}</span>
        <span className={activityTimeEndClassName}>{endLabel}</span>
      </button>
      {timeEditOpen ? (
        <TimeEditModal
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onClose={() => setTimeEditOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}

export function TimeEditModal({
  item,
  itineraryLabels,
  locale,
  onClose,
  onSave,
}: {
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onClose: () => void;
  onSave: (patch: InlineItineraryItemPatch) => void | Promise<void>;
}) {
  const [startTime, setStartTime] = useState(item.startTime ?? "");
  const [endTime, setEndTime] = useState(item.endTime ?? "");
  const [endOffsetDays, setEndOffsetDays] = useState(
    item.endTime ? item.endOffsetDays ?? 0 : 0,
  );
  const [saving, setSaving] = useState(false);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = endTime ? parseTimeToMinutes(endTime) : null;
  const hasValidStart = !startTime || startMinutes !== null;
  const hasValidEnd = !endTime || endMinutes !== null;
  const needsStartForEnd = Boolean(endTime && !startTime.trim());
  const derivedDuration =
    startMinutes !== null && endMinutes !== null
      ? Math.max(1, endMinutes + endOffsetDays * 24 * 60 - startMinutes)
      : null;
  const timeFormatHint =
    locale === "th"
      ? "ใช้รูปแบบ 24 ชั่วโมง เช่น 08:30"
      : "Use 24-hour time, for example 08:30.";
  const optionalEndHint =
    locale === "th"
      ? "เวลาจบไม่บังคับ ถ้าเว้นว่างจะไม่แสดง duration"
      : "End time is optional. Leave it blank to hide duration.";
  const errorMessage =
    !hasValidStart || !hasValidEnd
      ? locale === "th"
        ? "เวลาใช้รูปแบบ HH:MM เช่น 09:30"
        : "Use HH:MM time, for example 09:30."
        : needsStartForEnd
          ? locale === "th"
          ? "ใส่เวลาเริ่มก่อนใส่เวลาจบ"
          : "Add a start time before adding an end time."
        : null;
  const previewWindow =
    startTime && endTime && derivedDuration
      ? formatTimeRangeLabel(startTime, endTime, endOffsetDays)
      : startTime || "--:--";

  useEscapeToClose(onClose);

  function updateStartTime(nextStartTime: string) {
    setStartTime(nextStartTime);
    if (!endTime) return;
    const nextOffset = endOffsetDaysBetweenTimes(nextStartTime, endTime);
    setEndOffsetDays(nextOffset);
  }

  function updateEndTime(nextEndTime: string) {
    setEndTime(nextEndTime);
    setEndOffsetDays(nextEndTime ? endOffsetDaysBetweenTimes(startTime, nextEndTime) : 0);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || errorMessage) return;
    setSaving(true);
    try {
      await onSave({
        startTime: startTime.trim(),
        endTime: endTime.trim() || null,
        endOffsetDays: endTime.trim() ? endOffsetDays : 0,
        durationMinutes: endTime.trim() ? derivedDuration : null,
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
            <small>{itineraryLabels.row.inlineTime({ activity: item.activity })}</small>
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
              <span>{locale === "th" ? "เวลาเริ่ม" : "Start time"}</span>
              <input
                className={timeEditInputClassName}
                inputMode="numeric"
                maxLength={5}
                placeholder="08:30"
                title={timeFormatHint}
                value={startTime}
                onChange={(event) => updateStartTime(event.target.value)}
              />
            </label>
            <label className={timeEditFieldClassName}>
              <span>{locale === "th" ? "เวลาจบ" : "End time"}</span>
              <input
                className={timeEditInputClassName}
                inputMode="numeric"
                maxLength={5}
                placeholder="10:00"
                title={`${timeFormatHint} ${optionalEndHint}`}
                value={endTime}
                onChange={(event) => updateEndTime(event.target.value)}
              />
            </label>
          </div>
          <p className={timeEditHelperClassName}>
            {timeFormatHint} {optionalEndHint}
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
            <span>{locale === "th" ? "ตัวอย่างที่จะแสดง" : "Display preview"}</span>
            <strong className={timeEditPreviewValueClassName}>
              {previewWindow}
            </strong>
            {derivedDuration ? (
              <span>
                {locale === "th" ? "ระยะเวลา" : "Duration"}: {" "}
                {formatDuration(derivedDuration, locale)}
              </span>
            ) : (
              <span>{locale === "th" ? "ไม่แสดง duration" : "Duration hidden"}</span>
            )}
          </div>
          {errorMessage ? (
            <p className="text-xs font-bold text-(--color-danger)" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <footer className={timeEditModalFooterClassName}>
          <button
            type="button"
            className="inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
            onClick={onClose}
          >
            {itineraryLabels.row.durationCancel}
          </button>
          <button
            type="submit"
            className="inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route) px-3 text-xs font-extrabold text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || Boolean(errorMessage)}
          >
            {itineraryLabels.row.durationSave}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
