import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import {
  mainPathOption,
  pathOptionStoryPlanA,
  pathPlanOneOption,
  storyRainPathOption,
} from "./path-options";

export {
  buildBookingDoc,
  buildBusTravelItineraryItem,
  buildFlightTravelItineraryItem,
  buildItineraryItem,
  buildSharedFlightBookingDoc,
} from "@/src/trip/testing/fixtures/itinerary-item-fixtures";

export const defaultSmartItineraryPathOptions = [
  mainPathOption,
  pathPlanOneOption,
  storyRainPathOption,
] as const satisfies ReadonlyArray<ItineraryPathOption>;

export const defaultPathOptionsForPanel = [
  mainPathOption,
  pathPlanOneOption,
  pathOptionStoryPlanA,
] as const satisfies ReadonlyArray<ItineraryPathOption>;

export const defaultDayPathOptions = [
  mainPathOption,
  pathOptionStoryPlanA,
] as const satisfies ReadonlyArray<ItineraryPathOption>;

export function pathOptionsForDay(
  pathOptions: ReadonlyArray<ItineraryPathOption>,
  day: string,
): ItineraryPathOption[] {
  return pathOptions.map((option) =>
    option.scope === "day" ? { ...option, day } : option,
  );
}
