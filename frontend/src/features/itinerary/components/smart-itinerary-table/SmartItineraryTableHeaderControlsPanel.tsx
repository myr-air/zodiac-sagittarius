import {
  headerControlsContentClassName,
  headerControlsTitleBarClassName,
  headerControlsTitleClassName,
  pathFilterSummaryClassName,
} from "./smart-itinerary-table.styles";
import { SmartItineraryTablePathFilters } from "./SmartItineraryTablePathFilters";
import { SmartItineraryTableTripPlanControls } from "./SmartItineraryTableTripPlanControls";
import type { SmartItineraryTableHeaderControlsPanelProps } from "./trip-plan-controls.types";

export function SmartItineraryTableHeaderControlsPanel({
  canManageTripPlans,
  filterOptions,
  itineraryLabels,
  isTripPlanBusy,
  mainTripPlanId,
  onChangeShowAllPaths,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onCreateTripPlan,
  onRenameTripPlan,
  onSetMainTripPlan,
  onTogglePathFilter,
  selectedFilterLabel,
  selectedPathIds,
  selectedTripPlan,
  selectedTripPlanId,
  showAllPaths,
  tripPlanError,
  tripPlans,
}: SmartItineraryTableHeaderControlsPanelProps) {
  return (
    <>
      <div className={headerControlsTitleBarClassName}>
        <div className={headerControlsTitleClassName}>
          <strong>{itineraryLabels.tripPlans.selectorLabel}</strong>
          {isTripPlanBusy ? (
            <span className={pathFilterSummaryClassName}>
              {itineraryLabels.tripPlans.busy}
            </span>
          ) : tripPlanError ? (
            <span className={pathFilterSummaryClassName}>{tripPlanError}</span>
          ) : null}
        </div>
        <span className={pathFilterSummaryClassName}>
          {selectedTripPlan?.name ?? itineraryLabels.tripPlans.selectorLabel}
        </span>
      </div>
      <div className={headerControlsContentClassName}>
        <SmartItineraryTableTripPlanControls
          canManageTripPlans={canManageTripPlans}
          itineraryLabels={itineraryLabels}
          isTripPlanBusy={isTripPlanBusy}
          mainTripPlanId={mainTripPlanId}
          onChangeTripPlan={onChangeTripPlan}
          onChangeTripPlanStatus={onChangeTripPlanStatus}
          onCreateTripPlan={onCreateTripPlan}
          onRenameTripPlan={onRenameTripPlan}
          onSetMainTripPlan={onSetMainTripPlan}
          selectedTripPlanId={selectedTripPlanId}
          tripPlans={tripPlans}
        />
        <SmartItineraryTablePathFilters
          filterOptions={filterOptions}
          itineraryLabels={itineraryLabels}
          onChangeShowAllPaths={onChangeShowAllPaths}
          onTogglePathFilter={onTogglePathFilter}
          selectedFilterLabel={selectedFilterLabel}
          selectedPathIds={selectedPathIds}
          showAllPaths={showAllPaths}
        />
      </div>
    </>
  );
}
