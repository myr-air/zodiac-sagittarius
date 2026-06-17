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
  type ItineraryCommitmentSummary,
  mainItineraryPathId,
  type ItineraryPathOption,
  type ItineraryView,
  type ItineraryDayGroup,
} from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/components/PageHeader";
import { formatDuration } from "@/src/features/itinerary/lib";
import type { InlineItineraryItemPatch } from "../lib";
import { DayGroup } from "./smart-itinerary-table/day-group";
import { SmartItineraryTableHeaderControls } from "./smart-itinerary-table/SmartItineraryTableHeaderControls";
import { SmartItineraryTableHead } from "./smart-itinerary-table/SmartItineraryTableHead";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import { useSmartItineraryTableState } from "./smart-itinerary-table/hooks/useSmartItineraryTableState";

import {
  smartTableClassName,
  tablePanelClassName,
  tableScrollClassName,
} from "./smart-itinerary-table.styles";

interface SmartItineraryTableProps {
  canRedo: boolean;
  canRestructure?: boolean;
  canUndo: boolean;
  commitmentsByItemId?: Record<string, ItineraryCommitmentSummary>;
  contextRailOpen: boolean;
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
  selectedTripPathId?: string;
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
  onAddTaskForItem?: (itemId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onMoveItem: (draggedItemId: string, targetItemId: string) => void;
  onMoveItemIntoPlanBlock: (draggedItemId: string, planBlockItemId: string) => void;
  onMoveItemToDay: (draggedItemId: string, targetDay: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onExportItinerary: () => void;
  onImportItinerary: (file: File) => void;
  onImportItineraryText?: (content: string, sourceName: string) => void | Promise<void>;
  onChangeTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => boolean | void | Promise<boolean | void>;
  onSetMainTripPlan: (tripPlanId: string) => boolean | void | Promise<boolean | void>;
  onCreateTripPlan: (name: string) => boolean | void | Promise<boolean | void>;
  onRenameTripPlan: (tripPlanId: string, name: string) => boolean | void | Promise<boolean | void>;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  onChangeTripPath?: (pathId: string) => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onClearAllDayPaths?: () => void;
  onToggleShowAllPaths?: (showAll: boolean) => void;
  onRedo: () => void;
  onToggleContextRail: () => void;
  onUndo: () => void;
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
  pathOptions = [{ id: mainItineraryPathId, name: "Main", scope: "trip" }],
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
          <>
            <span>
              <Icon name="calendar" />{" "}
              {formatTripRange(startDate, endDate, locale)}
            </span>
            <span>
              <Icon name="route" />{" "}
              {t.itinerary.dayItems({
                days: groups.length,
                stops: items.length,
              })}
            </span>
            <span>
              <Icon name="warning" />{" "}
              {t.dates.warningCount({ count: warningCount })}
            </span>
            <span>
              <Icon name="clock" /> {formatDuration(totalMinutes, locale)}{" "}
              {t.dates.planned}
            </span>
          </>
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
        <table className={smartTableClassName} style={smartTableStyle}>
          <caption className="sr-only">{t.itinerary.caption}</caption>
          <colgroup>
            <col style={{ width: graphColumnWidth }} />
            <col />
          </colgroup>
          <SmartItineraryTableHead labels={t.itinerary.headers}
          />
          {groups.map((group: ItineraryDayGroup, groupIndex: number) => (
            <DayGroup
              canEdit={canRestructureItems}
              collapsed={collapsedDays.includes(group.day)}
              graphColumnWidth={graphColumnWidth}
              graphItems={graphItemsByDay.get(group.day) ?? []}
              group={group}
              hasTopSpacer={groupIndex > 0}
              itineraryLabels={t.itinerary}
              locale={locale}
              key={group.day}
              dailyBriefing={dailyBriefingsByDate.get(group.day) ?? null}
              selectedItemId={selectedItemId}
              startDate={startDate}
              pathOptions={pathOptions}
              dayPathOverride={dayPathOverrides[group.day]}
              showAllPaths={showAllPaths}
              onChangeDayPath={onChangeDayPath}
              onClearDayPath={onClearDayPath}
              onAddStop={onAddStop}
              onAddSubActivity={onAddSubActivity}
              onAddNoteForItem={onAddNoteForItem}
              onAddBookingForItem={onAddBookingForItem}
              onSaveBookingForItem={onSaveBookingForItem}
              onUnlinkBookingForItem={onUnlinkBookingForItem}
              bookingDocs={bookingDocs}
              bookingLinkItems={items}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              onMoveItemToPath={onMoveItemToPath}
              onOpenItemDetails={onOpenItemDetails}
              onSelectItem={onSelectItem}
              onSaveDayTitle={onSaveDayTitle}
              onUpdateItemInline={onUpdateItemInline}
              onToggleDay={toggleDay}
            />
          ))}
        </table>
      </div>
    </section>
  );
}
