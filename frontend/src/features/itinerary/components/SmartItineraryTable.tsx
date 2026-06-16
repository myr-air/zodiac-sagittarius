import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import type {
  BookingDoc,
  ItineraryItem,
  PlanStatus,
  PlanVariant,
  TripDailyBriefing,
  TripRole,
} from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import {
  type ItineraryCommitmentSummary,
  formatDayLabel,
  getTripDates,
  groupItemsByDay,
  mainItineraryPathId,
  type ItineraryDayGroup,
  type ItineraryPathOption,
  type ItineraryView,
} from "@/src/trip/itinerary";
import { canTripRole } from "@/src/trip/auth";
import {
  formatSolarTime,
  formatWeatherTemp,
  weatherGraphicLabel,
  weatherIconForCondition,
} from "@/src/trip/weather-briefings";
import { itineraryItemPathId } from "@/src/trip/itinerary-path-identifiers";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/components/PageHeader";
import { dayRouteLabel, formatDuration, formatThaiDate } from "@/src/features/itinerary/lib";
import type { InlineItineraryItemPatch } from "../lib";
import { InlineOptionPicker } from "./inline-option-picker";
import { DayGroup } from "./smart-itinerary-table-components";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import {
  activityTypeOptions,
  bookingDocTypeForItemTemplate,
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
  bookingTitleForItem,
  buildActivitySubtypePatch,
  buildActivityTypePatch,
  endOffsetDaysBetweenTimes,
  formatBookingSummary,
  formatTimeRangeLabel,
  formatTimeTooltip,
  fromDateTimeLocalValue,
  itineraryDateTimeValue,
  parseTimeToMinutes,
  readItineraryDetailString,
  toDateTimeLocalValue,
  ticketModalCopy,
  ticketNotesForItem,
  travelSubtypeForItem,
  travelSubtypeOptions,
  toggleId,
  uniqueIds,
} from "./smart-itinerary-table-helpers";
import {
  dedupePathOptions,
  buildGraphColumnWidth,
  buildWeatherTooltip,
  formatSelectedPlanLabel,
  formatTripPlanOptionLabel,
  groupChildItemsByParent,
  groupGraphItemsByDay,
  groupTopLevelItems,
  itemStatusLabel,
  mergeTripDayGroups,
  tripPlanStatus,
} from "./smart-itinerary-table-utils";

import {
  addStopInlineButtonClassName,
  addStopRowClassName,
  addSubActivityButtonClassName,
  activityActionClusterClassName,
  activityActionsClassName,
  activityBodyClassName,
  activityBookingButtonClassName,
  activityBookingButtonEmptyClassName,
  activityBookingButtonLinkedClassName,
  activityCellClassName,
  activityHeaderActivityClassName,
  activityHeaderGridClassName,
  activityIconButtonClassName,
  activityMainLineClassName,
  activityMetaClassName,
  activityMetaStatusClassName,
  activityMobileLineClassName,
  activityMobilePlaceInputClassName,
  activityMobileStatusClassName,
  activityPillClassName,
  activityPlaceInputClassName,
  activityPlaceLineClassName,
  activityRouteLabelClassName,
  activityRouteLineClassName,
  activitySentenceClassName,
  activityTimeButtonClassName,
  activityTimeEndClassName,
  activityTimeRailClassName,
  activityTimeStartClassName,
  activityTitleInputClassName,
  activityTypePickerClassName,
  activityTypeRailClassName,
  activityMobileTypePickerClassName,
  dayClearPathButtonClassName,
  dayDateClassName,
  dayGroupClassName,
  dayOrdinalClassName,
  dayPathControlsClassName,
  dayPathPickerClassName,
  dayRouteClassName,
  daySpacerRowClassName,
  dayTitleInputClassName,
  dayRowClassName,
  dayRowContentClassName,
  dayTitleMaxLength,
  dayTitleMinWidthCh,
  dayToggleClassName,
  dayWeatherChipClassName,
  dayWeatherSolarClassName,
  graphCellClassName,
  graphColumnLaneGap,
  graphColumnMinWidth,
  graphColumnSidePadding,
  headerControlsButtonClassName,
  headerControlsContentClassName,
  headerControlsGridClassName,
  headerControlsPanelClassName,
  headerControlsSectionClassName,
  headerControlsSectionHeaderClassName,
  headerControlsTitleBarClassName,
  headerControlsTitleClassName,
  itemPlaceholderCellClassName,
  itemPlaceholderRowClassName,
  pageHeaderActionsClassName,
  pageHeaderNoteClassName,
  pathFilterOptionClassName,
  pathFilterPanelClassName,
  pathFilterSummaryClassName,
  showAllPathsToggleClassName,
  smartTableClassName,
  subActivityActionsClassName,
  subActivityLineClassName,
  subActivityListClassName,
  subActivityModalBackdropClassName,
  subActivityModalBodyClassName,
  subActivityModalClassName,
  subActivityModalCloseClassName,
  subActivityModalHeaderClassName,
  subActivityModalTitleClassName,
  subActivityModalListClassName,
  subActivityTextClassName,
  subActivityTitleInputClassName,
  subActivityToggleButtonClassName,
  tablePanelClassName,
  tableScrollClassName,
  ticketExistingGridClassName,
  ticketExistingOptionClassName,
  ticketFieldClassName,
  ticketFieldGridClassName,
  ticketLinkedItemsClassName,
  ticketLinkedOptionClassName,
  ticketModeButtonClassName,
  ticketModeToggleClassName,
  ticketModalBackdropClassName,
  ticketModalBodyClassName,
  ticketModalClassName,
  ticketModalFooterClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
  timeEditFieldsClassName,
  timeEditFieldClassName,
  timeEditHelperClassName,
  timeEditInputClassName,
  timeEditModalBackdropClassName,
  timeEditModalBodyClassName,
  timeEditModalClassName,
  timeEditModalFooterClassName,
  timeEditModalHeaderClassName,
  timeEditModalTitleClassName,
  timeEditNextDayClassName,
  timeEditPreviewClassName,
  timeEditPreviewValueClassName,
  tripPlanActionsClassName,
  tripPlanButtonClassName,
  tripPlanCreateFormClassName,
  tripPlanFieldClassName,
  tripPlanNameFieldClassName,
  tripPlanNameInputClassName,
  tripPlanSecondaryButtonClassName,
  tripPlanSelectClassName,
  activityTabletActionsClassName,
  activityTabletActionLayerClassName,
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
  const allDisplayItems = graphItems ?? items;
  const filterOptions = dedupePathOptions(pathOptions, allDisplayItems);
  const canEdit = role === "owner" || role === "organizer" || role === "traveler";
  const canManageTripPlans = canTripRole(role, "manageTripPlans");
  const canRestructureItems = canEdit && canRestructure;
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>(() =>
    filterOptions.map((option) => option.id),
  );
  const [headerControlsExpanded, setHeaderControlsExpanded] = useState(false);
  const [renderHeaderControls, setRenderHeaderControls] = useState(false);
  const [isCreatingTripPlan, setIsCreatingTripPlan] = useState(false);
  const [newTripPlanName, setNewTripPlanName] = useState("");
  const [editedTripPlanNameDraft, setEditedTripPlanNameDraft] = useState<{
    name: string;
    planId: string;
  } | null>(null);
  const [newTripPlanError, setNewTripPlanError] = useState<string | null>(
    null,
  );
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const headerControlsRef = useRef<HTMLDivElement>(null);
  const headerControlsButtonRef = useRef<HTMLButtonElement>(null);
  const knownFilterIdsRef = useRef<string[]>(
    filterOptions.map((option) => option.id),
  );
  const selectedPathIdSet = new Set(selectedPathIds);
  const displayItems = allDisplayItems.filter((item) =>
    selectedPathIdSet.has(itineraryItemPathId(item)),
  );
  const selectedFilterLabel = formatSelectedPlanLabel(
    filterOptions,
    selectedPathIds,
    t.itinerary.filters.selectedCount,
    t.itinerary.filters.selectedNames,
  );
  const displayDayGroups = groupItemsByDay(displayItems);
  const groups = mergeTripDayGroups(
    displayDayGroups,
    startDate,
    endDate,
    getTripDates(startDate, endDate),
  );
  const dailyBriefingsByDate = useMemo(
    () => new Map(dailyBriefings.map((briefing) => [briefing.date, briefing])),
    [dailyBriefings],
  );
  const graphItemsByDay = groupGraphItemsByDay(displayItems);
  const warningCount =
    itineraryView?.warningCount ??
    displayDayGroups.reduce((total, group) => total + group.warningCount, 0);
  const totalMinutes = displayItems.reduce(
    (total, item) => total + (item.durationMinutes ?? 0),
    0,
  );
  const graphColumnWidth = buildGraphColumnWidth(
    displayItems,
    graphColumnMinWidth,
    graphColumnSidePadding,
    graphColumnLaneGap,
  );
  const smartTableStyle = {
    "--graph-column-width": `${graphColumnWidth}px`,
  } as CSSProperties;
  const selectedTripPlanIdForControl = tripPlans.some(
    (plan) => plan.id === selectedTripPlanId,
  )
    ? selectedTripPlanId
    : (tripPlans[0]?.id ?? "");
  const selectedTripPlan =
    tripPlans.find((plan) => plan.id === selectedTripPlanIdForControl) ?? null;
  const selectedTripPlanStatus = selectedTripPlan ? tripPlanStatus(selectedTripPlan) : "draft";
  const editedTripPlanName =
    editedTripPlanNameDraft &&
    selectedTripPlan &&
    editedTripPlanNameDraft.planId === selectedTripPlan.id
      ? editedTripPlanNameDraft.name
      : (selectedTripPlan?.name ?? "");
  const selectedTripPlanIsMain =
    Boolean(selectedTripPlanIdForControl) && selectedTripPlanIdForControl === mainTripPlanId;
  const tripPlanSelectorDisabled = isTripPlanBusy || tripPlans.length === 0;
  const tripPlanControlsDisabled = !canManageTripPlans || tripPlanSelectorDisabled;
  const tripPlanStatusDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const setMainTripPlanDisabled =
    tripPlanControlsDisabled || !selectedTripPlan || selectedTripPlanIsMain;
  const renameTripPlanDisabled =
    tripPlanControlsDisabled ||
    !selectedTripPlan ||
    !editedTripPlanName.trim() ||
    editedTripPlanName.trim() === selectedTripPlan.name;
  const tripPlanMessage = newTripPlanError ?? tripPlanError;

  useEffect(() => {
    setSelectedPathIds((current) => {
      const optionIds = filterOptions.map((option) => option.id);
      const previousOptionIds = knownFilterIdsRef.current;
      const nextIds = optionIds.filter(
        (id) => current.includes(id) || !previousOptionIds.includes(id),
      );
      knownFilterIdsRef.current = optionIds;
      return nextIds.length === current.length &&
        nextIds.every((id, index) => id === current[index])
        ? current
        : nextIds;
    });
  }, [filterOptions]);

  useEffect(() => {
    if (headerControlsExpanded || !renderHeaderControls) return;

    const timeoutId = window.setTimeout(() => {
      setRenderHeaderControls(false);
    }, 170);
    return () => window.clearTimeout(timeoutId);
  }, [headerControlsExpanded, renderHeaderControls]);

  useEffect(() => {
    if (!headerControlsExpanded) return;

    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (headerControlsRef.current?.contains(target)) return;
      setHeaderControlsExpanded(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setHeaderControlsExpanded(false);
      headerControlsButtonRef.current?.focus();
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [headerControlsExpanded]);

  function toggleDay(day: string) {
    setCollapsedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  function togglePlanFilter(pathId: string) {
    setSelectedPathIds((current) =>
      current.includes(pathId)
        ? current.filter((item) => item !== pathId)
        : [...current, pathId],
    );
  }

  async function submitNewTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans) return;
    const name = newTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(t.itinerary.tripPlans.emptyName);
      return;
    }
    setNewTripPlanError(null);
    const created = await onCreateTripPlan(name);
    if (created === false) return;
    setNewTripPlanName("");
    setIsCreatingTripPlan(false);
  }

  async function submitRenameTripPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isTripPlanBusy || !canManageTripPlans || !selectedTripPlan) return;
    const name = editedTripPlanName.trim();
    if (!name) {
      setNewTripPlanError(t.itinerary.tripPlans.emptyName);
      return;
    }
    if (name === selectedTripPlan.name) return;
    setNewTripPlanError(null);
    const renamed = await onRenameTripPlan(selectedTripPlan.id, name);
    if (renamed === false) return;
    setEditedTripPlanNameDraft({ name, planId: selectedTripPlan.id });
  }

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
          <div
            ref={headerControlsRef}
            className={pageHeaderActionsClassName}
            role="group"
            aria-label={t.itinerary.actionsLabel}
          >
            <button
              ref={headerControlsButtonRef}
              type="button"
              className={headerControlsButtonClassName}
              aria-label={`${t.itinerary.tripPlans.selectorLabel} controls`}
              aria-controls="itinerary-header-controls"
              aria-expanded={headerControlsExpanded}
              onClick={() => {
                if (!headerControlsExpanded) setRenderHeaderControls(true);
                setHeaderControlsExpanded((current) => !current);
              }}
            >
              <Icon name="settings" />
              <span className="min-w-0 truncate">
                {selectedTripPlan?.name ?? t.itinerary.tripPlans.selectorLabel}
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
                {t.itinerary.editRequiresOrganizer}
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
                    <strong>{t.itinerary.tripPlans.selectorLabel}</strong>
                    {isTripPlanBusy ? (
                      <span className={pathFilterSummaryClassName}>
                        {t.itinerary.tripPlans.busy}
                      </span>
                    ) : tripPlanMessage ? (
                      <span className={pathFilterSummaryClassName}>
                        {tripPlanMessage}
                      </span>
                    ) : null}
                  </div>
                  <span className={pathFilterSummaryClassName}>
                    {selectedTripPlan?.name ?? t.itinerary.tripPlans.selectorLabel}
                  </span>
                </div>
                <div className={headerControlsContentClassName}>
                  <div className={headerControlsSectionClassName}>
                    <form
                      className={headerControlsGridClassName}
                      onSubmit={submitRenameTripPlan}
                    >
                      <label className={tripPlanFieldClassName}>
                        <span>{t.itinerary.tripPlans.selectorLabel}</span>
                        <Select
                          className={tripPlanSelectClassName}
                          value={selectedTripPlanIdForControl}
                          disabled={tripPlanSelectorDisabled}
                          onChange={(event) => {
                            setNewTripPlanError(null);
                            setEditedTripPlanNameDraft(null);
                            onChangeTripPlan(event.target.value);
                          }}
                        >
                          {tripPlans.map((plan) => (
                            <option value={plan.id} key={plan.id}>
                              {formatTripPlanOptionLabel(
                                plan,
                                t.itinerary.tripPlans.status,
                              )}
                            </option>
                          ))}
                        </Select>
                      </label>
                      <label className={tripPlanFieldClassName}>
                        <span>{t.itinerary.tripPlans.statusLabel}</span>
                        <Select
                          className={tripPlanSelectClassName}
                          value={selectedTripPlanStatus}
                          disabled={tripPlanStatusDisabled}
                          onChange={(event) =>
                            onChangeTripPlanStatus(
                              selectedTripPlanIdForControl,
                              event.target.value as Exclude<PlanStatus, "main">,
                            )
                          }
                        >
                          <option value="main" disabled>
                            {t.itinerary.tripPlans.status.main}
                          </option>
                          <option value="draft">
                            {t.itinerary.tripPlans.status.draft}
                          </option>
                          <option value="backup">
                            {t.itinerary.tripPlans.status.backup}
                          </option>
                          <option value="proposal">
                            {t.itinerary.tripPlans.status.proposal}
                          </option>
                        </Select>
                      </label>
                      <label className={tripPlanFieldClassName}>
                        <span>{t.itinerary.tripPlans.nameLabel}</span>
                        <input
                          className={tripPlanNameInputClassName}
                          value={editedTripPlanName}
                          disabled={tripPlanControlsDisabled || !selectedTripPlan}
                          onChange={(event) => {
                            if (!selectedTripPlan) return;
                            setEditedTripPlanNameDraft({
                              name: event.target.value,
                              planId: selectedTripPlan.id,
                            });
                            setNewTripPlanError(null);
                          }}
                        />
                      </label>
                      <Button
                        type="submit"
                        disabled={renameTripPlanDisabled}
                        className={tripPlanButtonClassName}
                      >
                        {t.itinerary.tripPlans.saveName}
                      </Button>
                    </form>
                    {canManageTripPlans ? (
                      <div className={tripPlanActionsClassName}>
                        <Button
                          type="button"
                          disabled={setMainTripPlanDisabled}
                          className={tripPlanButtonClassName}
                          onClick={() =>
                            onSetMainTripPlan(selectedTripPlanIdForControl)
                          }
                        >
                          {t.itinerary.tripPlans.setMain}
                        </Button>
                        {isCreatingTripPlan ? (
                          <form
                            className={tripPlanCreateFormClassName}
                            onSubmit={submitNewTripPlan}
                          >
                            <label className={tripPlanNameFieldClassName}>
                              <span>{t.itinerary.tripPlans.nameLabel}</span>
                              <input
                                className={tripPlanNameInputClassName}
                                value={newTripPlanName}
                                disabled={isTripPlanBusy}
                                placeholder={t.itinerary.tripPlans.namePlaceholder}
                                onChange={(event) => {
                                  setNewTripPlanName(event.target.value);
                                  setNewTripPlanError(null);
                                }}
                              />
                            </label>
                            <Button
                              type="submit"
                              disabled={isTripPlanBusy}
                              className={tripPlanButtonClassName}
                            >
                              {t.itinerary.tripPlans.createConfirm}
                            </Button>
                            <button
                              type="button"
                              className={tripPlanSecondaryButtonClassName}
                              disabled={isTripPlanBusy}
                              onClick={() => {
                                setIsCreatingTripPlan(false);
                                setNewTripPlanName("");
                                setNewTripPlanError(null);
                              }}
                            >
                              {t.itinerary.tripPlans.createCancel}
                            </button>
                          </form>
                        ) : (
                          <Button
                            type="button"
                            disabled={isTripPlanBusy}
                            className={tripPlanButtonClassName}
                            onClick={() => setIsCreatingTripPlan(true)}
                          >
                            {t.itinerary.tripPlans.create}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className={headerControlsSectionClassName}>
                    <div className={headerControlsSectionHeaderClassName}>
                      <strong>{t.itinerary.filters.panelLabel}</strong>
                      <span className={pathFilterSummaryClassName}>
                        {selectedFilterLabel}
                      </span>
                    </div>
                    <label className={showAllPathsToggleClassName}>
                      <input
                        type="checkbox"
                        checked={showAllPaths}
                        disabled={!onToggleShowAllPaths}
                        onChange={(event) =>
                          onToggleShowAllPaths?.(event.target.checked)
                        }
                      />
                      <span>{t.itinerary.filters.showAllPaths}</span>
                    </label>
                    <div
                      className={pathFilterPanelClassName}
                      id="itinerary-plan-filters"
                      role="region"
                      aria-label={t.itinerary.filters.panelLabel}
                    >
                      {filterOptions.map((option) => (
                        <label
                          className={pathFilterOptionClassName}
                          key={option.id}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPathIdSet.has(option.id)}
                            onChange={() => togglePlanFilter(option.id)}
                          />
                          <span>{option.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
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
          <thead>
            <tr>
              <th>
                <span className="sr-only">Path graph</span>
              </th>
              <th>
                <span className="sr-only">Activity</span>
                <div className={activityHeaderGridClassName} aria-hidden="true">
                  <span>{t.itinerary.headers.time}</span>
                  <span>{t.itinerary.headers.type}</span>
                  <span className={activityHeaderActivityClassName}>
                    <span>{t.itinerary.headers.activity}</span>
                    <span>{t.itinerary.headers.actions}</span>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          {groups.map((group, groupIndex) => (
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
