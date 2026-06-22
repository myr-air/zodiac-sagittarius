import type { Locale } from "@/src/i18n/types";
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
  endLabel: string;
  errorMessage: string | null;
  nextDayEndLabel: string;
  optionalEndHint: string;
  previewLabel: string;
  previewWindow: string;
  startLabel: string;
  timeFormatHint: string;
}

const timeEditModalCopy: Record<
  Locale,
  {
    closeLabel: string;
    durationHidden: string;
    durationPrefix: string;
    endLabel: string;
    invalidTime: string;
    needsStartForEnd: string;
    nextDayEndLabel: string;
    optionalEndHint: string;
    previewLabel: string;
    startLabel: string;
    timeFormatHint: string;
  }
> = {
  en: {
    closeLabel: "Close time editor",
    durationHidden: "Duration hidden",
    durationPrefix: "Duration",
    endLabel: "End time",
    invalidTime: "Use HH:MM time, for example 09:30.",
    needsStartForEnd: "Add a start time before adding an end time.",
    nextDayEndLabel: "next day end",
    optionalEndHint: "End time is optional. Leave it blank to hide duration.",
    previewLabel: "Display preview",
    startLabel: "Start time",
    timeFormatHint: "Use 24-hour time, for example 08:30.",
  },
  th: {
    closeLabel: "ปิดตัวแก้ไขเวลา",
    durationHidden: "ไม่แสดง duration",
    durationPrefix: "ระยะเวลา",
    endLabel: "เวลาจบ",
    invalidTime: "เวลาใช้รูปแบบ HH:MM เช่น 09:30",
    needsStartForEnd: "ใส่เวลาเริ่มก่อนใส่เวลาจบ",
    nextDayEndLabel: "จบวันถัดไป",
    optionalEndHint: "เวลาจบไม่บังคับ ถ้าเว้นว่างจะไม่แสดง duration",
    previewLabel: "ตัวอย่างที่จะแสดง",
    startLabel: "เวลาเริ่ม",
    timeFormatHint: "ใช้รูปแบบ 24 ชั่วโมง เช่น 08:30",
  },
};

export function buildTimeEditModalModel({
  endOffsetDays,
  endTime,
  locale,
  startTime,
}: BuildTimeEditModalModelInput): TimeEditModalModel {
  const copy = timeEditModalCopy[locale];
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = endTime ? parseTimeToMinutes(endTime) : null;
  const hasValidStart = !startTime || startMinutes !== null;
  const hasValidEnd = !endTime || endMinutes !== null;
  const needsStartForEnd = Boolean(endTime && !startTime.trim());
  const derivedDuration =
    startMinutes !== null && endMinutes !== null
      ? durationBetweenTimes(startTime, endTime, endOffsetDays)
      : null;
  const errorMessage =
    !hasValidStart || !hasValidEnd
      ? copy.invalidTime
      : needsStartForEnd
        ? copy.needsStartForEnd
        : null;
  const previewWindow =
    startTime && endTime && derivedDuration
      ? formatTimeRangeLabel(startTime, endTime, endOffsetDays)
      : startTime || "--:--";
  const durationLabel = derivedDuration
    ? `${copy.durationPrefix}: ${formatDuration(derivedDuration, locale)}`
    : copy.durationHidden;

  return {
    closeLabel: copy.closeLabel,
    derivedDuration,
    durationLabel,
    endLabel: copy.endLabel,
    errorMessage,
    nextDayEndLabel: copy.nextDayEndLabel,
    optionalEndHint: copy.optionalEndHint,
    previewLabel: copy.previewLabel,
    previewWindow,
    startLabel: copy.startLabel,
    timeFormatHint: copy.timeFormatHint,
  };
}
