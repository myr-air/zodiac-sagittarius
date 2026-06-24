import type { StopFormValues } from "./stop-form-values";
import { type StopDetailType, type StopDetailValues } from "./stop-details";
import { endWindowFromDuration, parseRouteActivity } from "./stop-time";
import { applyStopDetailType } from "./stop-form-detail-type";

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

  const parsedEnd =
    parsedRoute.startTime && parsedRoute.durationMinutes
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
