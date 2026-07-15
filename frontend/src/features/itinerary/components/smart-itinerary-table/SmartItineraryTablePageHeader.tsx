import type { PlanStatus, PlanVariant } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { PageHeader } from "@/src/shared/components/page-header";
import { SmartItineraryTableHeaderControls } from "./SmartItineraryTableHeaderControls";
import { SmartItineraryTableMeta } from "./SmartItineraryTableMeta";
import type { TripPlanMutationResult } from "./trip-plan-controls.types";

interface SmartItineraryTablePageHeaderProps {
  canEdit: boolean;
  canManageTripPlans: boolean;
  endDate: string;
  filterOptions: { id: string; name: string }[];
  groupsCount: number;
  hideTablePlanControls?: boolean;
  isTripPlanBusy: boolean;
  itemsCount: number;
  mainTripPlanId: string;
  onChangeShowAllPaths?: (showAll: boolean) => void;
  onChangeTripPlan: (tripPlanId: string) => TripPlanMutationResult;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => TripPlanMutationResult;
  onCreateTripPlan: (name: string) => TripPlanMutationResult;
  onRenameTripPlan: (tripPlanId: string, name: string) => TripPlanMutationResult;
  onSetMainTripPlan: (tripPlanId: string) => TripPlanMutationResult;
  onTogglePathFilter: (pathId: string) => void;
  selectedFilterLabel: string;
  selectedPathIds: string[];
  selectedTripPlanId: string;
  showAllPaths: boolean;
  startDate: string;
  subActivitiesCount: number;
  flexibleItemsCount: number;
  totalMinutes: number;
  tripName: string;
  tripPlanError: string | null;
  tripPlans: PlanVariant[];
  warningCount: number;
  onAddStop?: (day?: string) => void;
}

export function SmartItineraryTablePageHeader({
  canEdit,
  canManageTripPlans,
  endDate,
  filterOptions,
  groupsCount,
  isTripPlanBusy,
  itemsCount,
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
  selectedTripPlanId,
  showAllPaths,
  startDate,
  subActivitiesCount,
  flexibleItemsCount,
  totalMinutes,
  tripName,
  tripPlanError,
  tripPlans,
  warningCount,
  onAddStop,
}: SmartItineraryTablePageHeaderProps) {
  const { locale, t } = useI18n();

  return (
    <PageHeader
      allowOverflow
      title={t.itinerary.title}
      subtitle={tripName}
      meta={
          <SmartItineraryTableMeta
            groupsCount={groupsCount}
            itemsCount={itemsCount}
            locale={locale}
            startDate={startDate}
            endDate={endDate}
            tDates={t.dates}
            tItinerary={t.itinerary}
            totalMinutes={totalMinutes}
            warningCount={warningCount}
            subActivitiesCount={subActivitiesCount}
            flexibleItemsCount={flexibleItemsCount}
          />
      }
      aside={
        <div className="flex flex-wrap items-center gap-2">
          {onAddStop ? (
            <button
              type="button"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 py-1.5 text-xs font-extrabold text-(--color-text) hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
              onClick={() => onAddStop()}
              aria-label={t.itinerary.addStop}
            >
              <Icon name="plus" className="size-3.5" />
              <span>{t.itinerary.addStop}</span>
            </button>
          ) : null}
          <SmartItineraryTableHeaderControls
            canEdit={canEdit}
            canManageTripPlans={canManageTripPlans}
            filterOptions={filterOptions}
            itineraryLabels={t.itinerary}
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
            selectedPathIds={new Set(selectedPathIds)}
            selectedTripPlanId={selectedTripPlanId}
            showAllPaths={showAllPaths}
            tripPlanError={tripPlanError}
            tripPlans={tripPlans}
          />
        </div>
      }
    />
  );
}
