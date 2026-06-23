import type { StopFormValues } from "./stop-form-values";
import {
  type StopDetailType,
  itemKindForStopDetailType,
  resolveStopActivityType,
} from "./stop-details";

export function applyStopDetailType(
  values: StopFormValues,
  nextDetailType: StopDetailType,
): StopFormValues {
  const nextActivityType = resolveStopActivityType(
    nextDetailType,
    values.activityType,
  );
  return {
    ...values,
    activityType: nextActivityType,
    itemKind: itemKindForStopDetailType(nextDetailType),
    isPlanBlock:
      nextDetailType === "transportation" && !values.parentItemId
        ? true
        : nextDetailType === "task"
          ? false
          : values.isPlanBlock,
    timeMode: nextDetailType === "task" ? "flexible" : values.timeMode,
    startTime: nextDetailType === "task" ? "" : values.startTime,
    endTime: nextDetailType === "task" ? null : values.endTime,
    endOffsetDays: nextDetailType === "task" ? 0 : values.endOffsetDays,
    durationMinutes: nextDetailType === "task" ? null : values.durationMinutes,
  };
}
