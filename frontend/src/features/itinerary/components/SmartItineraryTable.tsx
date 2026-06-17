import type {
  BookingDoc,
  ItineraryItem,
  PlanStatus,
  PlanVariant,
  TripDailyBriefing,
  TripRole,
} from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  mainItineraryPathId,
  type ItineraryPathOption,
  type ItineraryView,
} from "@/src/trip/itinerary";
import { mainItineraryPathName } from "@/src/trip/itinerary-path-identifiers";
import { PageHeader } from "@/src/components/PageHeader";
import type { InlineItineraryItemPatch } from "../lib";
import { SmartItineraryTableHeaderControls } from "./smart-itinerary-table/SmartItineraryTableHeaderControls";
import { SmartItineraryTableMeta } from "./smart-itinerary-table/SmartItineraryTableMeta";
import { SmartItineraryTableBody } from "./smart-itinerary-table/SmartItineraryTableBody";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import { useSmartItineraryTableState } from "./smart-itinerary-table/hooks/useSmartItineraryTableState";

import { tablePanelClassName, tableScrollClassName } from "./smart-itinerary-table.styles";

interface SmartItineraryTableProps {
  canRestructure?: boolean;
  endDate: string;
  graphItems?: ItineraryItem[];
  items: ItineraryItem[];
  bookingDocs?: BookingDoc[];
  dailyBriefings?: TripDailyBriefing[];
  tripPlans: PlanVariant[];
  selectedTripPlanId: string;
  mainTripPlanId: string;
  tripPlanError: string | null;
  isTripPlanBusy: boolean;
  role: TripRole;
  startDate: string;
  itineraryView?: ItineraryView;
  pathOptions?: ItineraryPathOption[];
  selectedItemId: string;
  dayPathOverrides?: Record<string, string | undefined>;
  showAllPaths?: boolean;
  tripName: string;
  onAddBookingForItem?: (
    itemId: string,
    template?: ItineraryBookingTemplate,
  ) => string | void | Promise<string | void>;
  onSaveBookingForItem?: (
    input: ItineraryBookingTicketInput,
  ) => string | void | Promise<string | void>;
  onUnlinkBookingForItem?: (
    bookingDocId: string,
    itemId: string,
  ) => void | Promise<void>;
  onAddStop: (day?: string) => void;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onChangeTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => boolean | void | Promise<boolean | void>;
  onSetMainTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onCreateTripPlan: (name: string) => boolean | void | Promise<boolean | void>;
  onRenameTripPlan: (tripPlanId: string, name: string) => boolean | void | Promise<boolean | void>;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onToggleShowAllPaths?: (showAll: boolean) => void;
}

export function SmartItineraryTable({
  canRestructure = true,
  endDate,
  graphItems,
  itineraryView,
  items,
  dailyBriefings = [],
  tripPlans,
  selectedTripPlanId,
  mainTripPlanId,
  tripPlanError,
  isTripPlanBusy,
  pathOptions = [{ id: mainItineraryPathId, name: mainItineraryPathName, scope: "trip" }],
  role,
  startDate,
  selectedItemId,
  dayPathOverrides = {},
  showAllPaths = false,
  tripName,
  onAddStop,
  onAddSubActivity,
  onAddNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs = [],
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onSelectItem,
  onUpdateItemInline,
  onMoveItemToPath,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onSetMainTripPlan,
  onCreateTripPlan,
  onRenameTripPlan,
  onSaveDayTitle,
  onChangeDayPath,
  onClearDayPath,
  onToggleShowAllPaths,
}: SmartItineraryTableProps) {
  const { locale, t } = useI18n();
  const {
    canEdit,
    canManageTripPlans,
    canRestructureItems,
    collapsedDays,
    groups,
    graphItemsByDay,
    dailyBriefingsByDate,
    filterOptions,
    selectedPathIds,
    graphColumnWidth,
    warningCount,
    totalMinutes,
    toggleDay,
    togglePlanFilter,
    selectedFilterLabel,
    smartTableStyle,
  } = useSmartItineraryTableState({
    pathOptions,
    items,
    graphItems,
    role,
    startDate,
    endDate,
    dailyBriefings,
    itineraryView,
    selectedCountLabel: t.itinerary.filters.selectedCount,
    selectedNamesLabel: t.itinerary.filters.selectedNames,
    canRestructure,
  });

  return (
    <section
      className={tablePanelClassName}
      aria-label={t.itinerary.pageLabel}
      id="itinerary"
    >
      <PageHeader
        allowOverflow
        title={t.itinerary.title}
        subtitle={tripName}
        meta={
          <SmartItineraryTableMeta
            groupsCount={groups.length}
            itemsCount={items.length}
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
            selectedFilterLabel={selectedFilterLabel}
            selectedPathIds={new Set(selectedPathIds)}
            selectedTripPlanId={selectedTripPlanId}
            showAllPaths={showAllPaths}
            onChangeShowAllPaths={onToggleShowAllPaths}
            onTogglePathFilter={togglePlanFilter}
            onChangeTripPlan={onChangeTripPlan}
            onChangeTripPlanStatus={onChangeTripPlanStatus}
            onCreateTripPlan={onCreateTripPlan}
            onRenameTripPlan={onRenameTripPlan}
            onSetMainTripPlan={onSetMainTripPlan}
            tripPlans={tripPlans}
            mainTripPlanId={mainTripPlanId}
            tripPlanError={tripPlanError}
            isTripPlanBusy={isTripPlanBusy}
            itineraryLabels={t.itinerary}
          />
        }
      />
      <div
        className={tableScrollClassName}
        tabIndex={0}
        aria-label={t.itinerary.scrollLabel}
      >
        <SmartItineraryTableBody
          canRestructureItems={canRestructureItems}
          collapsedDays={collapsedDays}
          groups={groups}
          graphItemsByDay={graphItemsByDay}
          dailyBriefingsByDate={dailyBriefingsByDate}
          pathOptions={pathOptions}
          dayPathOverrides={dayPathOverrides}
          showAllPaths={showAllPaths}
          smartTableStyle={smartTableStyle}
          graphColumnWidth={graphColumnWidth}
          itineraryLabels={t.itinerary}
          locale={locale}
          startDate={startDate}
          selectedItemId={selectedItemId}
          bookingDocs={bookingDocs}
          bookingLinkItems={items}
          onAddStop={onAddStop}
          onAddSubActivity={onAddSubActivity}
          onAddNoteForItem={onAddNoteForItem}
          onAddBookingForItem={onAddBookingForItem}
          onSaveBookingForItem={onSaveBookingForItem}
          onUnlinkBookingForItem={onUnlinkBookingForItem}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
          onMoveItemToPath={onMoveItemToPath}
          onOpenItemDetails={onOpenItemDetails}
          onSelectItem={onSelectItem}
          onSaveDayTitle={onSaveDayTitle}
          onUpdateItemInline={onUpdateItemInline}
          onToggleDay={toggleDay}
          onChangeDayPath={onChangeDayPath}
          onClearDayPath={onClearDayPath}
          tHeaders={t.itinerary.headers}
        />
      </div>
    </section>
  );
}
