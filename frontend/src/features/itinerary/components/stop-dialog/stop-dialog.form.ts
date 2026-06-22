import type { ItineraryItem, PlaceResolutionCandidate } from "@/src/trip/types";
import { normalizeDurationMinutes } from "@/src/trip/itinerary-core";
import type { StopFormValues } from "./stop-dialog.types";
import {
  type StopDetailType,
  type StopDetailValues,
  buildStructuredStopDetails,
  emptyStopDetailValues,
  itemKindForStopDetailType,
  readStringDetail,
  resolveStopActivityType,
  structuredStopDetailValues,
} from "./stop-dialog.utils";
import {
  addMinutesToTime,
  endWindowFromDuration,
  parseRouteActivity,
} from "./stop-dialog-time";
export {
  applyStopEndTime,
  applyStopStartTime,
  applyStopTimeMode,
  toggleStopNextDayEnd,
} from "./stop-dialog-time-fields";

export function buildInitialStopFormValues({
  initialDay,
  initialItem,
  initialParentItemId = null,
  startDate,
}: {
  initialDay?: string;
  initialItem?: ItineraryItem;
  initialParentItemId?: string | null;
  startDate?: string;
}): StopFormValues {
  return {
    day: initialItem?.day ?? initialDay ?? startDate ?? "",
    pathId: initialItem?.pathRole === "alternative" ? initialItem.pathId : "main",
    parentItemId: initialItem?.parentItemId ?? initialParentItemId,
    itemKind: initialItem?.itemKind ?? "activity",
    timeMode: initialItem?.timeMode ?? "scheduled",
    isPlanBlock: initialItem?.isPlanBlock ?? false,
    status: initialItem?.status ?? "idea",
    priority: initialItem?.priority ?? "normal",
    startTime: initialItem?.startTime ?? "16:30",
    endTime: initialItem
      ? (initialItem.endTime ??
        addMinutesToTime(
          initialItem.startTime,
          normalizeDurationMinutes(initialItem.durationMinutes ?? 45),
        ))
      : null,
    endOffsetDays: initialItem?.endOffsetDays ?? 0,
    activity: initialItem?.activity ?? "",
    activityType: initialItem?.activityType ?? "experience",
    place: initialItem?.place ?? "",
    mapLink: initialItem?.mapLink ?? "",
    durationMinutes: initialItem?.durationMinutes ?? null,
    transportation: initialItem?.transportation ?? "",
    details: initialItem?.details ?? {},
    note: initialItem?.note ?? "",
  };
}

export function buildInitialStopDetailValues(
  initialItem: ItineraryItem | undefined,
): StopDetailValues {
  return {
    ...emptyStopDetailValues,
    ...structuredStopDetailValues(initialItem?.details),
    mode: readStringDetail(initialItem?.details?.mode) || initialItem?.transportation || "",
  };
}

export function buildStopSubmitValues({
  detailType,
  detailValues,
  saveUnresolved,
  selectedCandidate,
  values,
}: {
  detailType: StopDetailType;
  detailValues: StopDetailValues;
  saveUnresolved: boolean;
  selectedCandidate?: PlaceResolutionCandidate;
  values: StopFormValues;
}): StopFormValues {
  const details = buildStructuredStopDetails(detailType, detailValues);
  const nextPlace = detailType === "transportation"
    ? values.place || readStringDetail(details.destination) || readStringDetail(details.origin)
    : values.place;

  return {
    ...values,
    activity: values.activity.trim(),
    activityType: resolveStopActivityType(detailType, values.activityType),
    isPlanBlock: values.parentItemId ? false : values.isPlanBlock,
    startTime: values.timeMode === "flexible" ? "" : values.startTime,
    endTime: values.timeMode === "flexible" ? null : values.endTime,
    endOffsetDays:
      values.timeMode === "flexible" || !values.endTime
        ? 0
        : values.endOffsetDays,
    durationMinutes:
      values.timeMode === "flexible" || !values.endTime
        ? null
        : normalizeDurationMinutes(values.durationMinutes),
    details,
    place: nextPlace.trim(),
    mapLink: values.mapLink?.trim() ?? "",
    transportation: values.transportation.trim(),
    note: values.note.trim(),
    resolvedPlace: saveUnresolved ? undefined : selectedCandidate,
    saveUnresolved,
  };
}

export function applyStopDetailType(values: StopFormValues, nextDetailType: StopDetailType): StopFormValues {
  const nextActivityType = resolveStopActivityType(nextDetailType, values.activityType);
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

export function applyStopActivityInput({
  activity,
  detailValues,
  values,
}: {
  activity: string;
  detailValues: StopDetailValues;
  values: StopFormValues;
}): {
  detailType?: StopDetailType;
  detailValues?: StopDetailValues;
  values: StopFormValues;
} {
  const parsedRoute = parseRouteActivity(activity);
  if (!parsedRoute) {
    return {
      values: { ...values, activity },
    };
  }

  const parsedEnd = parsedRoute.startTime && parsedRoute.durationMinutes
    ? endWindowFromDuration(parsedRoute.startTime, parsedRoute.durationMinutes)
    : null;

  return {
    detailType: "transportation",
    detailValues: {
      ...detailValues,
      destination: parsedRoute.destination,
      origin: parsedRoute.origin,
    },
    values: {
      ...applyStopDetailType({ ...values, activity }, "transportation"),
      durationMinutes: parsedRoute.durationMinutes ?? values.durationMinutes,
      startTime: parsedRoute.startTime ?? values.startTime,
      ...(parsedEnd
        ? {
            endTime: parsedEnd.endTime,
            endOffsetDays: parsedEnd.endOffsetDays,
          }
        : {}),
    },
  };
}
