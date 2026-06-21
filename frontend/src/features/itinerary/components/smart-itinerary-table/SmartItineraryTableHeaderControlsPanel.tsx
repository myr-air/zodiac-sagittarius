import type { PlanStatus, PlanVariant } from "@/src/trip/types";
import type { Messages } from "@/src/i18n/messages";
import {
  headerControlsContentClassName,
  headerControlsTitleBarClassName,
  headerControlsTitleClassName,
  pathFilterSummaryClassName,
} from "./smart-itinerary-table.styles";
import { SmartItineraryTablePathFilters } from "./SmartItineraryTablePathFilters";
import { SmartItineraryTableTripPlanControls } from "./SmartItineraryTableTripPlanControls";

interface SmartItineraryTableHeaderControlsPanelProps {
  canManageTripPlans: boolean;
  filterOptions: { id: string; name: string }[];
  itineraryLabels: Messages["itinerary"];
  isTripPlanBusy: boolean;
  mainTripPlanId: string;
  onChangeShowAllPaths?: (showAll: boolean) => void;
  onChangeTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => boolean | void | Promise<boolean | void>;
  onCreateTripPlan: (name: string) => boolean | void | Promise<boolean | void>;
  onRenameTripPlan: (
    tripPlanId: string,
    name: string,
  ) => boolean | void | Promise<boolean | void>;
  onSetMainTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onTogglePathFilter: (pathId: string) => void;
  selectedFilterLabel: string;
  selectedPathIds: Set<string>;
  selectedTripPlan: PlanVariant | null;
  selectedTripPlanId: string;
  showAllPaths: boolean;
  tripPlanError: string | null;
  tripPlans: PlanVariant[];
}

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
