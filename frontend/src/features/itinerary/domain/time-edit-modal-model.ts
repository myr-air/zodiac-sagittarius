import type { Locale } from "@/src/i18n/types";
import { getMessages } from "@/src/i18n/messages";
import {
  durationBetweenTimes,
  formatTimeRangeLabel,
  parseTimeToMinutes,
} from "./itinerary-item-editing";
import { formatDuration } from "./itinerary-time-display";

interface BuildTimeEditModalModelInput {
  endOffsetDays: number;
  endTime: string;
  locale: Locale;
  startTime: string;
}

export interface TimeEditModalModel {
  closeLabel: string;
  derivedDuration: number | null;
  durationLabel: string;
  endError: string | null;
  endLabel: string;
  nextDayEndLabel: string;
  optionalEndHint: string;
  previewLabel: string;
  previewWindow: string;
  startError: string | null;
  startLabel: string;
  timeFormatHint: string;
}

export function buildTimeEditModalModel({
  endOffsetDays,
  endTime,
  locale,
  startTime,
}: BuildTimeEditModalModelInput): TimeEditModalModel {
  const copy = getMessages(locale).itinerary.row.timeEdit;
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = endTime ? parseTimeToMinutes(endTime) : null;
  const startError =
    startTime.trim() && startMinutes === null ? copy.invalidStartTime : null;
  const endError = endTime.trim() && endMinutes === null ? copy.invalidEndTime : null;
  const derivedDuration =
    startMinutes !== null && endMinutes !== null
      ? durationBetweenTimes(startTime, endTime, endOffsetDays)
      : null;
  const previewWindow = (() => {
    const trimmedStart = startTime.trim();
    const trimmedEnd = endTime.trim();
    if (trimmedStart && trimmedEnd && derivedDuration !== null) {
      return formatTimeRangeLabel(trimmedStart, trimmedEnd, endOffsetDays);
    }
    if (trimmedEnd) {
      return `${trimmedStart ? `${trimmedStart} - ` : ""}${trimmedEnd}${endOffsetDays > 0 ? ` +${endOffsetDays}` : ""}`;
    }
    return trimmedStart || "--:--";
  })();
  const durationLabel = derivedDuration
    ? `${copy.durationPrefix}: ${formatDuration(derivedDuration, locale)}`
    : copy.durationHidden;

  return {
    closeLabel: copy.closeLabel,
    derivedDuration,
    durationLabel,
    endError,
    endLabel: copy.endLabel,
    nextDayEndLabel: copy.nextDayEndLabel,
    optionalEndHint: copy.optionalEndHint,
    previewLabel: copy.previewLabel,
    previewWindow,
    startError,
    startLabel: copy.startLabel,
    timeFormatHint: copy.timeFormatHint,
  };
}
