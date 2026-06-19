import { useEffect, useMemo } from "react";
import { buildItineraryView } from "@/src/trip/itinerary";
import { resolveSelectedWorkspaceItem } from "@/src/trip/workspace/selected-itinerary-item";
import type { ItineraryItem, Trip } from "@/src/trip/types";

interface UseWorkspaceItineraryViewModelOptions {
  activePlanItems: ItineraryItem[];
  latestTripRef: { current: Trip };
  mainPlanItems: ItineraryItem[];
  planItems: ItineraryItem[];
  selectedItemId: string;
  trip: Trip;
}

export function useWorkspaceItineraryViewModel({
  activePlanItems,
  latestTripRef,
  mainPlanItems,
  planItems,
  selectedItemId,
  trip,
}: UseWorkspaceItineraryViewModelOptions) {
  const itineraryView = useMemo(
    () => buildItineraryView(planItems),
    [planItems],
  );
  const mainItineraryView = useMemo(
    () => buildItineraryView(mainPlanItems),
    [mainPlanItems],
  );

  useEffect(() => {
    latestTripRef.current = trip;
  }, [latestTripRef, trip]);

  const {
    selectedDay,
    selectedItem,
    selectedItemIdForView,
  } = resolveSelectedWorkspaceItem({
    activePlanItems,
    itineraryView,
    planItems,
    selectedItemId,
    tripStartDate: trip.startDate,
  });

  return {
    itineraryView,
    mainItineraryView,
    selectedDay,
    selectedItem,
    selectedItemIdForView,
  };
}
