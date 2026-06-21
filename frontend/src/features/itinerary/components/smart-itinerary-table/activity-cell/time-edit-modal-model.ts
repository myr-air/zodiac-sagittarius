import type { Locale } from "@/src/i18n/types";
import { formatDuration } from "@/src/features/itinerary/lib";
import {
  durationBetweenTimes,
  formatTimeRangeLabel,
  parseTimeToMinutes,
} from "@/src/features/itinerary/domain/itinerary-item-editing";

interface BuildTimeEditModalModelInput {
  endOffsetDays: number;
  endTime: string;
  locale: Locale;
  startTime: string;
}

export interface TimeEditModalModel {
  derivedDuration: number | null;
  durationLabel: string;
  endLabel: string;
  errorMessage: string | null;
  optionalEndHint: string;
  previewWindow: string;
  startLabel: string;
  timeFormatHint: string;
}

export function buildTimeEditModalModel({
  endOffsetDays,
  endTime,
  locale,
  startTime,
}: BuildTimeEditModalModelInput): TimeEditModalModel {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = endTime ? parseTimeToMinutes(endTime) : null;
  const hasValidStart = !startTime || startMinutes !== null;
  const hasValidEnd = !endTime || endMinutes !== null;
  const needsStartForEnd = Boolean(endTime && !startTime.trim());
  const derivedDuration =
    startMinutes !== null && endMinutes !== null
      ? durationBetweenTimes(startTime, endTime, endOffsetDays)
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
  const durationLabel = derivedDuration
    ? `${locale === "th" ? "ระยะเวลา" : "Duration"}: ${formatDuration(derivedDuration, locale)}`
    : locale === "th"
      ? "ไม่แสดง duration"
      : "Duration hidden";

  return {
    derivedDuration,
    durationLabel,
    endLabel: locale === "th" ? "เวลาจบ" : "End time",
    errorMessage,
    optionalEndHint,
    previewWindow,
    startLabel: locale === "th" ? "เวลาเริ่ม" : "Start time",
    timeFormatHint,
  };
}
