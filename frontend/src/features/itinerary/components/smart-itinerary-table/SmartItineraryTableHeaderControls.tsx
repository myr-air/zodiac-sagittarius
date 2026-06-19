import { useEffect, useRef, useState } from "react";
import { useDismissOnOutside } from "@/src/shared/hooks/use-dismiss-on-outside";
import type { PlanStatus, PlanVariant } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { cn } from "@/src/lib/cn";
import type { Messages } from "@/src/i18n/messages";
import {
  headerControlsButtonClassName,
  headerControlsContentClassName,
  headerControlsPanelClassName,
  headerControlsTitleBarClassName,
  headerControlsTitleClassName,
  pageHeaderActionsClassName,
  pageHeaderNoteClassName,
  pathFilterSummaryClassName,
} from "./smart-itinerary-table.styles";
import { SmartItineraryTablePathFilters } from "./SmartItineraryTablePathFilters";
import { SmartItineraryTableTripPlanControls } from "./SmartItineraryTableTripPlanControls";

interface TripPlanHeaderControlsProps {
  canEdit: boolean;
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
  selectedFilterLabel: string;
  selectedPathIds: Set<string>;
  selectedTripPlanId: string;
  showAllPaths: boolean;
  tripPlanError: string | null;
  tripPlans: PlanVariant[];
  onTogglePathFilter: (pathId: string) => void;
}

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

  const selectedTripPlanIdForControl = tripPlans.some(
    (plan) => plan.id === selectedTripPlanId,
  )
    ? selectedTripPlanId
    : (tripPlans[0]?.id ?? "");

  const selectedTripPlan =
    tripPlans.find((plan) => plan.id === selectedTripPlanIdForControl) ?? null;

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
              selectedTripPlanId={selectedTripPlanIdForControl}
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
        </div>
      ) : null}
    </div>
  );
}
