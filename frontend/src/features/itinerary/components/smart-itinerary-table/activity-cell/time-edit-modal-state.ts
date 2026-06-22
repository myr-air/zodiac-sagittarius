import { endOffsetDaysBetweenTimes } from "@/src/features/itinerary/domain/itinerary-item-editing";
import type { ItineraryItem } from "@/src/trip/types";

type TimeEditModalItem = Pick<
  ItineraryItem,
  "endOffsetDays" | "endTime" | "startTime"
>;

export interface TimeEditModalFormState {
  endOffsetDays: number;
  endTime: string;
  saving: boolean;
  startTime: string;
}

export function initialTimeEditModalFormState(
  item: TimeEditModalItem,
): TimeEditModalFormState {
  return {
    endOffsetDays: item.endTime ? item.endOffsetDays ?? 0 : 0,
    endTime: item.endTime ?? "",
    saving: false,
    startTime: item.startTime ?? "",
  };
}

export function updateTimeEditModalStartTime(
  state: TimeEditModalFormState,
  startTime: string,
): TimeEditModalFormState {
  return {
    ...state,
    endOffsetDays: state.endTime
      ? endOffsetDaysBetweenTimes(startTime, state.endTime)
      : state.endOffsetDays,
    startTime,
  };
}

export function updateTimeEditModalEndTime(
  state: TimeEditModalFormState,
  endTime: string,
): TimeEditModalFormState {
  return {
    ...state,
    endOffsetDays: endTime
      ? endOffsetDaysBetweenTimes(state.startTime, endTime)
      : 0,
    endTime,
  };
}

export function toggleTimeEditModalEndOffsetDays(
  state: TimeEditModalFormState,
): TimeEditModalFormState {
  return {
    ...state,
    endOffsetDays: state.endOffsetDays > 0 ? 0 : 1,
  };
}

export function setTimeEditModalSaving(
  state: TimeEditModalFormState,
  saving: boolean,
): TimeEditModalFormState {
  return { ...state, saving };
}
