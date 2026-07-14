import type { ItineraryItem } from "@/src/trip/types";
import { normalizeDurationMinutes } from "@/src/trip/itinerary-core";
import type { StopFormValues } from "./stop-form-values";
import {
  type StopDetailValues,
  emptyStopDetailValues,
  readStringDetail,
  structuredStopDetailValues,
} from "./stop-details";
import { addMinutesToTime } from "./stop-time";

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
    timeMode: initialItem?.timeMode ?? "flexible",
    isPlanBlock: initialItem?.isPlanBlock ?? false,
    status: initialItem?.status ?? "idea",
    priority: initialItem?.priority ?? "normal",
    startTime: initialItem?.startTime ?? "",
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
    mode:
      readStringDetail(initialItem?.details?.mode) ||
      initialItem?.transportation ||
      "",
  };
}
