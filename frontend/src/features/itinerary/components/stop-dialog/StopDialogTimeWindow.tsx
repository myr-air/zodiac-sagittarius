import { TimePickerField } from "@/src/components/DateTimePickers";
import { formatDuration } from "@/src/features/itinerary/lib";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryTimeMode } from "@/src/trip/types";
import {
  durationSummaryClassName,
  nextDayToggleButtonClassName,
  nextDayToggleLabelClassName,
  timeWindowGroupClassName,
} from "./stop-dialog.styles";
import { stopDialogFieldIds } from "./stop-dialog.utils";

export function StopDialogTimeWindow({
  activity,
  derivedDuration,
  durationLabel,
  endLabel,
  endOffsetDays,
  endTime,
  locale,
  nextDayLabel,
  notSetLabel,
  startLabel,
  startTime,
  timeMode,
  onEndTimeChange,
  onStartTimeChange,
  onToggleNextDayEnd,
}: {
  activity: string;
  derivedDuration: number | null;
  durationLabel: string;
  endLabel: string;
  endOffsetDays: number;
  endTime: string | null;
  locale: Locale;
  nextDayLabel: string;
  notSetLabel: string;
  startLabel: string;
  startTime: string;
  timeMode: ItineraryTimeMode;
  onEndTimeChange: (endTime: string) => void;
  onStartTimeChange: (startTime: string) => void;
  onToggleNextDayEnd: () => void;
}) {
  return (
    <div
      className={timeWindowGroupClassName}
      role="group"
      aria-label={locale === "th" ? "ช่วงเวลา" : "Time window"}
    >
      <label htmlFor={stopDialogFieldIds.startTime}>
        <span>{startLabel}</span>
        <TimePickerField
          id={stopDialogFieldIds.startTime}
          value={startTime}
          onChange={onStartTimeChange}
          required={timeMode !== "flexible"}
        />
      </label>
      <label htmlFor={stopDialogFieldIds.endTime}>
        <span>{endLabel}</span>
        <TimePickerField
          id={stopDialogFieldIds.endTime}
          value={endTime ?? ""}
          onChange={onEndTimeChange}
        />
      </label>
      <label
        className={nextDayToggleLabelClassName}
        htmlFor={stopDialogFieldIds.endOffsetDays}
      >
        <span>{nextDayLabel}</span>
        <button
          id={stopDialogFieldIds.endOffsetDays}
          className={nextDayToggleButtonClassName}
          type="button"
          aria-label={`Toggle next-day end ${activity || "activity"}`}
          aria-pressed={endOffsetDays > 0}
          disabled={timeMode === "flexible" || !endTime}
          onClick={onToggleNextDayEnd}
        >
          +1
        </button>
      </label>
      <div
        className={durationSummaryClassName}
        aria-labelledby={stopDialogFieldIds.derivedDuration}
      >
        <span id={stopDialogFieldIds.derivedDuration}>{durationLabel}</span>
        {derivedDuration ? (
          <strong>{formatDuration(derivedDuration, locale)}</strong>
        ) : (
          <strong>{notSetLabel}</strong>
        )}
      </div>
    </div>
  );
}
