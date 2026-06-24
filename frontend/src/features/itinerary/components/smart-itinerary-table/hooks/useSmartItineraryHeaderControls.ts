import { useEffect, useRef, useState } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import { findTripPlanOptionById } from "@/src/trip/trip-plans";
import type { PlanVariant } from "@/src/trip/types";
import {
  closeSmartItineraryHeaderControls,
  initialSmartItineraryHeaderControlsState,
  toggleSmartItineraryHeaderControls,
  unmountClosedSmartItineraryHeaderControls,
} from "../smart-itinerary-header-controls-state";
import { selectedTripPlanIdForControl } from "../smart-itinerary-table-trip-plan-labels";

interface UseSmartItineraryHeaderControlsInput {
  selectedTripPlanId: string;
  tripPlans: PlanVariant[];
}

export function useSmartItineraryHeaderControls({
  selectedTripPlanId,
  tripPlans,
}: UseSmartItineraryHeaderControlsInput) {
  const [headerControlsState, setHeaderControlsState] = useState(
    initialSmartItineraryHeaderControlsState,
  );
  const headerControlsRef = useRef<HTMLDivElement>(null);
  const headerControlsButtonRef = useRef<HTMLButtonElement>(null);

  const selectedTripPlanIdForControlValue = selectedTripPlanIdForControl(
    tripPlans,
    selectedTripPlanId,
  );

  const selectedTripPlan = findTripPlanOptionById(
    tripPlans,
    selectedTripPlanIdForControlValue,
  );

  useEffect(() => {
    if (headerControlsState.expanded || !headerControlsState.render) return;

    const timeoutId = window.setTimeout(() => {
      setHeaderControlsState(unmountClosedSmartItineraryHeaderControls());
    }, 170);
    return () => window.clearTimeout(timeoutId);
  }, [headerControlsState.expanded, headerControlsState.render]);

  function closeHeaderControls() {
    setHeaderControlsState((current) =>
      closeSmartItineraryHeaderControls(current),
    );
  }

  useDismissOnOutside({
    enabled: headerControlsState.expanded,
    onDismiss: closeHeaderControls,
    triggerRefs: [headerControlsRef],
    onEscape: () => {
      closeHeaderControls();
      headerControlsButtonRef.current?.focus();
    },
  });

  function toggleHeaderControls() {
    setHeaderControlsState((current) =>
      toggleSmartItineraryHeaderControls(current),
    );
  }

  return {
    headerControlsButtonRef,
    headerControlsRef,
    headerControlsState,
    selectedTripPlan,
    selectedTripPlanIdForControlValue,
    toggleHeaderControls,
  };
}
