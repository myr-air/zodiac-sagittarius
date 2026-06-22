import { useEffect, useRef, useState } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import {
  headerControlsButtonClassName,
  headerControlsPanelClassName,
  pageHeaderActionsClassName,
  pageHeaderNoteClassName,
} from "./smart-itinerary-table.styles";
import { SmartItineraryTableHeaderControlsPanel } from "./SmartItineraryTableHeaderControlsPanel";
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
  const [headerControlsExpanded, setHeaderControlsExpanded] = useState(false);
  const [renderHeaderControls, setRenderHeaderControls] = useState(false);
  const headerControlsRef = useRef<HTMLDivElement>(null);
  const headerControlsButtonRef = useRef<HTMLButtonElement>(null);

  const selectedTripPlanIdForControlValue = selectedTripPlanIdForControl(
    tripPlans,
    selectedTripPlanId,
  );

  const selectedTripPlan =
    tripPlans.find((plan) => plan.id === selectedTripPlanIdForControlValue) ?? null;

  useEffect(() => {
    if (headerControlsExpanded || !renderHeaderControls) return;

    const timeoutId = window.setTimeout(() => {
      setRenderHeaderControls(false);
    }, 170);
    return () => window.clearTimeout(timeoutId);
  }, [headerControlsExpanded, renderHeaderControls]);

  useDismissOnOutside({
    enabled: headerControlsExpanded,
    onDismiss: () => setHeaderControlsExpanded(false),
    triggerRefs: [headerControlsRef],
    onEscape: () => {
      setHeaderControlsExpanded(false);
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
        aria-expanded={headerControlsExpanded}
        onClick={() => {
          if (!headerControlsExpanded) setRenderHeaderControls(true);
          setHeaderControlsExpanded((current) => !current);
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
            headerControlsExpanded && "rotate-90",
          )}
        />
      </button>
      {!canEdit ? (
        <p className={pageHeaderNoteClassName}>
          {itineraryLabels.editRequiresOrganizer}
        </p>
      ) : null}
      {renderHeaderControls ? (
        <div
          className={headerControlsPanelClassName}
          data-state={headerControlsExpanded ? "open" : "closed"}
          id="itinerary-header-controls"
          aria-hidden={!headerControlsExpanded}
          inert={headerControlsExpanded ? undefined : true}
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
