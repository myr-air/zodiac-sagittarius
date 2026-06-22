import { useCallback, useMemo, useState } from "react";
import {
  deriveItineraryPathOptions,
  mainItineraryPathId,
  resolveItineraryPathItems,
  updateItineraryPathSelection,
  type ItineraryPathSelection,
} from "@/src/trip/itinerary-paths";
import { defaultTripPlanId } from "@/src/trip/trip-plans";
import type { Trip } from "@/src/trip/types";

export function useItineraryPathWorkspace(
  trip: Pick<
    Trip,
    | "activePlanVariantId"
    | "itineraryItems"
    | "itineraryPaths"
    | "mainTripPlanId"
    | "planVariants"
    | "tripPlans"
  >,
  selectedTripPlanId: string,
) {
  const [pathSelection, setPathSelection] = useState<ItineraryPathSelection>({
    tripPathId: mainItineraryPathId,
    dayPathOverrides: {},
  });
  const activePlanItems = useMemo(
    () =>
      trip.itineraryItems.filter(
        (item) => item.planVariantId === selectedTripPlanId,
      ),
    [selectedTripPlanId, trip.itineraryItems],
  );
  const pathOptions = useMemo(
    () =>
      deriveItineraryPathOptions(activePlanItems, trip.itineraryPaths ?? []),
    [activePlanItems, trip.itineraryPaths],
  );
  const planItems = useMemo(
    () => resolveItineraryPathItems(activePlanItems, pathSelection),
    [activePlanItems, pathSelection],
  );
  const mainTripPlanId = defaultTripPlanId(trip);
  const mainPlanItems = useMemo(() => {
    const items = trip.itineraryItems.filter(
      (item) => item.planVariantId === mainTripPlanId,
    );
    return resolveItineraryPathItems(items, pathSelection);
  }, [
    pathSelection,
    trip.itineraryItems,
    mainTripPlanId,
  ]);

  const changeTripPath = useCallback((pathId: string) => {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "change-trip-path", pathId }),
    );
  }, []);

  const changeDayPath = useCallback((day: string, pathId: string) => {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "change-day-path", day, pathId }),
    );
  }, []);

  const clearDayPath = useCallback((day: string) => {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "clear-day-path", day }),
    );
  }, []);

  const clearAllDayPaths = useCallback(() => {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "clear-all-day-paths" }),
    );
  }, []);

  const toggleShowAllPaths = useCallback((showAll: boolean) => {
    setPathSelection((current) =>
      updateItineraryPathSelection(current, { type: "toggle-show-all-paths", showAll }),
    );
  }, []);

  return {
    activePlanItems,
    changeDayPath,
    changeTripPath,
    clearAllDayPaths,
    clearDayPath,
    dayPathOverrides: pathSelection.dayPathOverrides ?? {},
    mainPlanItems,
    pathOptions,
    pathSelection,
    planItems,
    selectedTripPathId: pathSelection.tripPathId ?? mainItineraryPathId,
    showAllPaths: Boolean(pathSelection.showAll),
    toggleShowAllPaths,
  };
}
