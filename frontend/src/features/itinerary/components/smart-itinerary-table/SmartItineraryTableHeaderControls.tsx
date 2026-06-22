import { useEffect, useRef, useState } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import { findTripPlanOptionById } from "@/src/trip/trip-plans";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import {
  headerControlsButtonClassName,
  headerControlsPanelClassName,
  pageHeaderActionsClassName,
  pageHeaderNoteClassName,
} from "./smart-itinerary-table.styles";
import { SmartItineraryTableHeaderControlsPanel } from "./SmartItineraryTableHeaderControlsPanel";
import {
  closeSmartItineraryHeaderControls,
  initialSmartItineraryHeaderControlsState,
  toggleSmartItineraryHeaderControls,
  unmountClosedSmartItineraryHeaderControls,
} from "./smart-itinerary-header-controls-state";
import { selectedTripPlanIdForControl } from "./smart-itinerary-table-trip-plan-labels";
import type { TripPlanHeaderControlsProps } from "./trip-plan-controls.types";

export function SmartItineraryTableHeaderControls({
  canEdit,
  canManageTripPlans,
  filterOptions,
  itineraryLabels,
  isTripPlanBusy,
  mainTripPlanId,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onCreateTripPlan,
  onRenameTripPlan,
  onSetMainTripPlan,
  onTogglePathFilter,
  selectedFilterLabel,
  selectedPathIds,
  selectedTripPlanId,
  showAllPaths,
  onChangeShowAllPaths,
  tripPlanError,
  tripPlans,
}: TripPlanHeaderControlsProps) {
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

  useDismissOnOutside({
    enabled: headerControlsState.expanded,
    onDismiss: () =>
      setHeaderControlsState((current) =>
        closeSmartItineraryHeaderControls(current),
      ),
    triggerRefs: [headerControlsRef],
    onEscape: () => {
      setHeaderControlsState((current) =>
        closeSmartItineraryHeaderControls(current),
      );
      headerControlsButtonRef.current?.focus();
    },
  });

  return (
    <div
      ref={headerControlsRef}
      className={pageHeaderActionsClassName}
      role="group"
      aria-label={itineraryLabels.actionsLabel}
    >
      <button
        ref={headerControlsButtonRef}
        type="button"
        className={headerControlsButtonClassName}
        aria-label={`${itineraryLabels.tripPlans.selectorLabel} controls`}
        aria-controls="itinerary-header-controls"
        aria-expanded={headerControlsState.expanded}
        onClick={() => {
          setHeaderControlsState((current) =>
            toggleSmartItineraryHeaderControls(current),
          );
        }}
      >
        <Icon name="settings" />
        <span className="min-w-0 truncate">
          {selectedTripPlan?.name ?? itineraryLabels.tripPlans.selectorLabel}
        </span>
        <Icon
          name="chevronRight"
          className={cn(
            "transition-transform duration-150",
            headerControlsState.expanded && "rotate-90",
          )}
        />
      </button>
      {!canEdit ? (
        <p className={pageHeaderNoteClassName}>
          {itineraryLabels.editRequiresOrganizer}
        </p>
      ) : null}
      {headerControlsState.render ? (
        <div
          className={headerControlsPanelClassName}
          data-state={headerControlsState.expanded ? "open" : "closed"}
          id="itinerary-header-controls"
          aria-hidden={!headerControlsState.expanded}
          inert={headerControlsState.expanded ? undefined : true}
        >
          <SmartItineraryTableHeaderControlsPanel
            canManageTripPlans={canManageTripPlans}
            filterOptions={filterOptions}
            itineraryLabels={itineraryLabels}
            isTripPlanBusy={isTripPlanBusy}
            mainTripPlanId={mainTripPlanId}
            onChangeShowAllPaths={onChangeShowAllPaths}
            onChangeTripPlan={onChangeTripPlan}
            onChangeTripPlanStatus={onChangeTripPlanStatus}
            onCreateTripPlan={onCreateTripPlan}
            onRenameTripPlan={onRenameTripPlan}
            onSetMainTripPlan={onSetMainTripPlan}
            onTogglePathFilter={onTogglePathFilter}
            selectedFilterLabel={selectedFilterLabel}
            selectedPathIds={selectedPathIds}
            selectedTripPlan={selectedTripPlan}
            selectedTripPlanId={selectedTripPlanIdForControlValue}
            showAllPaths={showAllPaths}
            tripPlanError={tripPlanError}
            tripPlans={tripPlans}
          />
        </div>
      ) : null}
    </div>
  );
}
