import type { PlanStatus, PlanVariant } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { PageHeader } from "@/src/shared/components/page-header";
import { SmartItineraryTableHeaderControls } from "./SmartItineraryTableHeaderControls";
import { SmartItineraryTableMeta } from "./SmartItineraryTableMeta";

interface SmartItineraryTablePageHeaderProps {
  canEdit: boolean;
  canManageTripPlans: boolean;
  endDate: string;
  filterOptions: { id: string; name: string }[];
  groupsCount: number;
  isTripPlanBusy: boolean;
  itemsCount: number;
  mainTripPlanId: string;
  onChangeShowAllPaths?: (showAll: boolean) => void;
  onChangeTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => boolean | void | Promise<boolean | void>;
  onCreateTripPlan: (name: string) => boolean | void | Promise<boolean | void>;
  onRenameTripPlan: (tripPlanId: string, name: string) => boolean | void | Promise<boolean | void>;
  onSetMainTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onTogglePathFilter: (pathId: string) => void;
  selectedFilterLabel: string;
  selectedPathIds: string[];
  selectedTripPlanId: string;
  showAllPaths: boolean;
  startDate: string;
  totalMinutes: number;
  tripName: string;
  tripPlanError: string | null;
  tripPlans: PlanVariant[];
  warningCount: number;
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
  totalMinutes,
  tripName,
  tripPlanError,
  tripPlans,
  warningCount,
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
        />
      }
      aside={
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
      }
    />
  );
}
