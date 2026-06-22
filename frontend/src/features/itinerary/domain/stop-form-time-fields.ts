import type { ItineraryTimeMode } from "@/src/trip/types";
import type { StopFormValues } from "./stop-form-values";
import {
  durationBetweenTimes,
  endOffsetDaysBetweenTimes,
} from "./stop-time";

export function applyStopStartTime(
  values: StopFormValues,
  startTime: string,
): StopFormValues {
  const nextEndOffsetDays = values.endTime
    ? endOffsetDaysBetweenTimes(startTime, values.endTime)
    : 0;
  const nextDuration = values.endTime
    ? durationBetweenTimes(startTime, values.endTime, nextEndOffsetDays)
    : null;

  return {
    ...values,
    startTime,
    endOffsetDays: values.endTime ? nextEndOffsetDays : values.endOffsetDays,
    durationMinutes: nextDuration,
  };
}

export function applyStopTimeMode(
  values: StopFormValues,
  timeMode: ItineraryTimeMode,
): StopFormValues {
  if (timeMode === "flexible") {
    return {
      ...values,
      timeMode,
      startTime: "",
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
    };
  }

  return {
    ...values,
    timeMode,
  };
}

export function applyStopEndTime(
  values: StopFormValues,
  nextEndTime: string,
): StopFormValues {
  if (!nextEndTime) {
    return {
      ...values,
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
    };
  }

  const nextEndOffsetDays = endOffsetDaysBetweenTimes(
    values.startTime,
    nextEndTime,
  );
  const nextDuration = durationBetweenTimes(
    values.startTime,
    nextEndTime,
    nextEndOffsetDays,
  );

  return {
    ...values,
    endTime: nextEndTime,
    endOffsetDays: nextEndOffsetDays,
    durationMinutes: nextDuration,
  };
}

export function toggleStopNextDayEnd(values: StopFormValues): StopFormValues {
  if (!values.endTime) return values;
  const endOffsetDays = values.endOffsetDays > 0 ? 0 : 1;
  const durationMinutes = durationBetweenTimes(
    values.startTime,
    values.endTime,
    endOffsetDays,
  );

  return {
    ...values,
    endOffsetDays,
    durationMinutes,
  };
}
