import type { PlaceResolutionCandidate } from "@/src/trip/types";
import { normalizeDurationMinutes } from "@/src/trip/itinerary-core";
import type { StopFormValues } from "./stop-form-values";
import {
  type StopDetailType,
  type StopDetailValues,
  buildStructuredStopDetails,
  readStringDetail,
  resolveStopActivityType,
} from "./stop-details";

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
  const nextPlace =
    detailType === "transportation"
      ? values.place ||
        readStringDetail(details.destination) ||
        readStringDetail(details.origin)
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
