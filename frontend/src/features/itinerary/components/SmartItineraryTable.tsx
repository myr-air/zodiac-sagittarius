import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
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
import { ActivityPathGraphDay } from "./ActivityPathGraphDay";
import { DateTimePickerField } from "@/src/components/DateTimePickers";
import type { InlineItineraryItemPatch } from "../lib";
import { InlineOptionPicker } from "./inline-option-picker";
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

function DayGroup({
  graphColumnWidth,
  graphItems,
  group,
  dailyBriefing,
  hasTopSpacer,
  itineraryLabels,
  locale,
  startDate,
  pathOptions,
  dayPathOverride,
  showAllPaths,
  selectedItemId,
  canEdit,
  collapsed,
  onAddStop,
  onAddSubActivity,
  onAddNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onChangeDayPath,
  onClearDayPath,
  onDeleteItem,
  onEditItem,
  onMoveItemToPath,
  onOpenItemDetails,
  onSelectItem,
  onSaveDayTitle,
  onUpdateItemInline,
  onToggleDay,
}: {
  graphColumnWidth: number;
  graphItems: ItineraryItem[];
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  dailyBriefing: TripDailyBriefing | null;
  hasTopSpacer: boolean;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  startDate: string;
  pathOptions: ItineraryPathOption[];
  dayPathOverride?: string;
  showAllPaths: boolean;
  selectedItemId: string;
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  canEdit: boolean;
  collapsed: boolean;
  onAddStop?: (day?: string) => void;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
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
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
  onToggleDay: (day: string) => void;
}) {
  const dayLabel = formatDayLabel(group.day, startDate, locale);
  const dayA11yLabel = formatDayLabel(group.day, startDate, "en");
  const defaultDayTitle = dayRouteLabel(group.day, locale);
  const dayTitle = dailyBriefing?.manualOverrides.dayTitle?.trim() || defaultDayTitle;
  const dayPathOptions = pathOptions.filter(
    (option) =>
      option.id === mainItineraryPathId ||
      option.scope === "trip" ||
      option.day === group.day,
  );
  const hasAlternativePathOptions = dayPathOptions.some(
    (option) => option.id !== mainItineraryPathId,
  );
  const visibleItems = groupTopLevelItems(group.items);
  const visibleGraphItems = groupTopLevelItems(graphItems);
  const childItemsByParentId = groupChildItemsByParent(group.items);
  const showGraph =
    !collapsed && (visibleGraphItems.length > 0 || visibleItems.length > 0);

  return (
    <tbody
      className={dayGroupClassName}
      data-state={collapsed ? "closed" : "open"}
    >
      {hasTopSpacer ? (
        <tr className={daySpacerRowClassName} aria-hidden="true">
          <td colSpan={2} />
        </tr>
      ) : null}
      <tr className={dayRowClassName}>
        {showGraph ? (
          <td
            className={graphCellClassName}
            rowSpan={Math.max(2, visibleItems.length + 2)}
          >
            <ActivityPathGraphDay
              canEdit={canEdit}
              day={group.day}
              dayLabel={dayA11yLabel}
              graphItems={visibleGraphItems}
              graphWidth={graphColumnWidth}
              pathOptions={pathOptions}
              rowItems={visibleItems}
              selectedItemId={selectedItemId}
              onMoveItemToPath={onMoveItemToPath}
              onSelectItem={onSelectItem}
            />
          </td>
        ) : null}
        <th colSpan={showGraph ? 1 : 2}>
          <div className={dayRowContentClassName}>
            <button
              type="button"
              className={dayToggleClassName}
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? itineraryLabels.dayToggle.expand({ day: dayLabel })
                  : itineraryLabels.dayToggle.collapse({ day: dayLabel })
              }
              onClick={() => onToggleDay(group.day)}
            >
              <Icon name="chevronRight" />
              <strong className={dayOrdinalClassName}>{dayLabel}</strong>
            </button>
            <span className={dayDateClassName}>
              <span>·</span>
              <span>{formatThaiDate(group.day, locale)}</span>
            </span>
            <span className={dayRouteClassName}>
              <DayTitleEditor
                canEdit={canEdit && Boolean(dailyBriefing && onSaveDayTitle)}
                date={group.day}
                defaultTitle={defaultDayTitle}
                dayLabel={dayA11yLabel}
                key={`${group.day}:${dailyBriefing?.version ?? 1}:${dayTitle}`}
                title={dayTitle}
                version={dailyBriefing?.version ?? 1}
                onSaveDayTitle={onSaveDayTitle}
              />
            </span>
            <DayWeatherChip briefing={dailyBriefing} dayLabel={dayA11yLabel} />
            {hasAlternativePathOptions ? (
              <span className={dayPathControlsClassName}>
                <InlineOptionPicker
                  buttonClassName={dayPathPickerClassName}
                  ariaLabel={`Path for ${dayA11yLabel}`}
                  value={dayPathOverride || mainItineraryPathId}
                  disabled={!canEdit || showAllPaths}
                  options={dayPathOptions.map((option) => ({
                    value: option.id,
                    label: option.name,
                  }))}
                  onCommit={(pathId) =>
                    onChangeDayPath?.(group.day, pathId)
                  }
                />
                <button
                  type="button"
                  className={dayClearPathButtonClassName}
                  aria-label={`Clear path override for ${dayA11yLabel}`}
                  disabled={!canEdit || showAllPaths || !dayPathOverride}
                  onClick={() => onClearDayPath?.(group.day)}
                >
                  Clear
                </button>
              </span>
            ) : null}
          </div>
        </th>
      </tr>
      {!collapsed
        ? visibleItems.map((item) => (
            <tr
              aria-label={itineraryLabels.row.openDetails({
                activity: item.activity,
              })}
              className={itemPlaceholderRowClassName}
              data-item-id={item.id}
              data-hierarchy-level={1}
              key={item.id}
            >
              <td className={itemPlaceholderCellClassName}>
                <ActivityCell
                  canEdit={canEdit}
                  item={item}
                  itineraryLabels={itineraryLabels}
                  locale={locale}
                  selected={selectedItemId === item.id}
                  subItems={childItemsByParentId.get(item.id) ?? []}
                  onAddSubActivity={onAddSubActivity}
                  onAddNoteForItem={onAddNoteForItem}
                  onAddBookingForItem={onAddBookingForItem}
                  onSaveBookingForItem={onSaveBookingForItem}
                  onUnlinkBookingForItem={onUnlinkBookingForItem}
                  bookingDocs={bookingDocs}
                  bookingLinkItems={bookingLinkItems}
                  onDeleteItem={onDeleteItem}
                  onEditItem={onEditItem}
                  onOpenItemDetails={onOpenItemDetails}
                  onSelectItem={onSelectItem}
                  onUpdateItemInline={onUpdateItemInline}
                />
              </td>
            </tr>
          ))
        : null}
      {!collapsed ? (
        <tr className={addStopRowClassName} data-day-drop={group.day}>
          <td colSpan={showGraph ? 1 : 2}>
            {canEdit && onAddStop ? (
              <button
                type="button"
                className={addStopInlineButtonClassName}
                onClick={() => onAddStop(group.day)}
              >
                <Icon name="plus" />
                <span>{itineraryLabels.addStop}</span>
              </button>
            ) : null}
          </td>
        </tr>
      ) : null}
    </tbody>
  );
}

function DayTitleEditor({
  canEdit,
  date,
  dayLabel,
  defaultTitle,
  onSaveDayTitle,
  title,
  version,
}: {
  canEdit: boolean;
  date: string;
  dayLabel: string;
  defaultTitle: string;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  title: string;
  version: number;
}) {
  const [draft, setDraft] = useState(title.slice(0, dayTitleMaxLength));
  const [sourceTitle, setSourceTitle] = useState(title.slice(0, dayTitleMaxLength));
  const [saving, setSaving] = useState(false);
  const dynamicWidthCh = Math.max(
    dayTitleMinWidthCh,
    Math.min(dayTitleMaxLength, draft.length || defaultTitle.length) + 1,
  );

  async function commit(nextValue: string) {
    if (!canEdit || !onSaveDayTitle || saving) return;
    const trimmed = nextValue.trim();
    const normalizedTitle = trimmed || defaultTitle;
    if (normalizedTitle === sourceTitle) {
      setDraft(sourceTitle);
      return;
    }
    setSaving(true);
    try {
      await onSaveDayTitle(date, version, trimmed ? normalizedTitle : null);
      setSourceTitle(normalizedTitle);
      setDraft(normalizedTitle);
    } finally {
      setSaving(false);
    }
  }

  return (
    <input
      aria-label={`Trip day title for ${dayLabel}`}
      data-day-label={dayLabel}
      className={dayTitleInputClassName}
      disabled={!canEdit || saving}
      maxLength={dayTitleMaxLength}
      style={{ width: `${dynamicWidthCh}ch` }}
      title={`${draft.length}/${dayTitleMaxLength}`}
      value={draft}
      onBlur={() => void commit(draft)}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(sourceTitle);
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function ActivityCell({
  canEdit,
  item,
  itineraryLabels,
  locale,
  selected,
  subItems,
  onAddSubActivity,
  onAddNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onDeleteItem,
  onEditItem,
  onOpenItemDetails,
  onSelectItem,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  selected: boolean;
  subItems: ItineraryItem[];
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
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
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const status = item.status ? itemStatusLabel(item.status, locale) : null;
  const [subActivityModalOpen, setSubActivityModalOpen] = useState(false);
  const [subActivitiesExpanded, setSubActivitiesExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [noteTarget, setNoteTarget] = useState<ItineraryItem | null>(null);
  const showSubActivityToggle =
    Boolean(onAddSubActivity) || subItems.length > 0;
  const actionMenuLabel =
    locale === "th"
      ? `จัดการกิจกรรม ${item.activity}`
      : `Activity actions for ${item.activity}`;
  function openNoteModal(target: ItineraryItem, compact = false) {
    if (compact) {
      setActionsExpanded(false);
    }
    setNoteTarget(target);
  }

  const renderSubActivityButton = (compact = false) =>
    showSubActivityToggle ? (
      <button
        type="button"
        className={subActivityToggleButtonClassName}
        aria-label={`Sub-activities for ${item.activity}`}
        aria-expanded={subActivitiesExpanded}
        title={`Sub-activities for ${item.activity}`}
        onClick={(event) => {
          event.stopPropagation();
          if (compact) {
            setActionsExpanded(false);
          }
          if (
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(max-width: 640px)").matches
          ) {
            setSubActivityModalOpen(true);
            return;
          }
          setSubActivitiesExpanded((current) => !current);
        }}
      >
        <Icon name="list" />
      </button>
    ) : null;
  const renderActivityActions = (compact = false) => (
    <>
      {item.mapLink ? (
        <a
          className={activityIconButtonClassName}
          href={item.mapLink}
          target="_blank"
          rel="noreferrer"
          aria-label={`${itineraryLabels.row.mapFallback}: ${item.place || item.activity}`}
          title={`${itineraryLabels.row.mapFallback}: ${item.place || item.activity}`}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
          }}
        >
          <Icon name="map" />
        </a>
      ) : null}
      {onAddNoteForItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={locale === "th" ? `เพิ่มโน้ต ${item.activity}` : `Add note for ${item.activity}`}
          title={locale === "th" ? `เพิ่มโน้ต ${item.activity}` : `Add note for ${item.activity}`}
          onClick={(event) => {
            event.stopPropagation();
            openNoteModal(item, compact);
          }}
        >
          <Icon name="note" />
        </button>
      ) : null}
      <button
        type="button"
        className={activityIconButtonClassName}
        aria-label={itineraryLabels.row.openDetails({
          activity: item.activity,
        })}
        title={itineraryLabels.row.openDetails({
          activity: item.activity,
        })}
        onClick={(event) => {
          event.stopPropagation();
          if (compact) {
            setActionsExpanded(false);
          }
          onOpenItemDetails(item.id);
        }}
      >
        <Icon name="panel" />
      </button>
      {onEditItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          title={itineraryLabels.row.edit({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
            onEditItem(item.id);
          }}
        >
          <Icon name="edit" />
        </button>
      ) : null}
      {onDeleteItem ? (
        <button
          type="button"
          className={activityIconButtonClassName}
          aria-label={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          title={itineraryLabels.row.delete({
            activity: item.activity,
          })}
          onClick={(event) => {
            event.stopPropagation();
            if (compact) {
              setActionsExpanded(false);
            }
            onDeleteItem(item.id);
          }}
        >
          <Icon name="trash" />
        </button>
      ) : null}
    </>
  );

  return (
    <div
      className={activityCellClassName}
      data-selected={selected ? "true" : undefined}
      onClick={() => onSelectItem(item.id)}
    >
      <div className={activityTimeRailClassName}>
        <ActivityTimeButton
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onSave={(patch) => onUpdateItemInline?.(item.id, patch)}
        />
        <ActivityTypePicker
          buttonClassName={activityMobileTypePickerClassName}
          disabled={!editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onUpdateItemInline={onUpdateItemInline}
        />
      </div>
      <div className={activityTypeRailClassName}>
        <ActivityTypePicker
          buttonClassName={activityTypePickerClassName}
          disabled={!editable}
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onUpdateItemInline={onUpdateItemInline}
        />
      </div>
      <div className={activityBodyClassName}>
        <div className={activityMainLineClassName}>
          <div className={activitySentenceClassName}>
            <InlineActivityField
              ariaLabel={itineraryLabels.row.inlineActivity({
                activity: item.activity,
              })}
              autoSize
              className={activityTitleInputClassName}
              disabled={!editable}
              key={`${item.id}:activity:${item.activity}`}
              maxLength={90}
              placeholder="Activity"
              value={item.activity}
              onCommit={(activity) =>
                onUpdateItemInline?.(item.id, { activity: activity || item.activity })
              }
            />
          </div>
        </div>
        <ActivityLocationLine
          editable={editable}
          item={item}
          itineraryLabels={itineraryLabels}
          onUpdateItemInline={onUpdateItemInline}
        />
        <div className={activityMobileLineClassName}>
          {status ? <span className={activityMobileStatusClassName}>{status}</span> : null}
          <ItineraryBookingButton
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            onAddBookingForItem={onAddBookingForItem}
            onSaveBookingForItem={onSaveBookingForItem}
            onUnlinkBookingForItem={onUnlinkBookingForItem}
            bookingDocs={bookingDocs}
            bookingLinkItems={bookingLinkItems}
          />
          <span className={activityActionClusterClassName}>
            {renderSubActivityButton(true)}
            <button
              type="button"
              className={activityTabletActionsClassName}
              aria-label={actionMenuLabel}
              aria-expanded={actionsExpanded}
              title={actionMenuLabel}
              onClick={(event) => {
                event.stopPropagation();
                setActionsExpanded((current) => !current);
              }}
            >
              <Icon name="dots" />
            </button>
          </span>
        </div>
        <div className={activityMetaClassName}>
          <div className={activityMetaStatusClassName}>
            {status ? <span className={activityPillClassName}>{status}</span> : null}
            <ItineraryBookingButton
              item={item}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onAddBookingForItem={onAddBookingForItem}
              onSaveBookingForItem={onSaveBookingForItem}
              onUnlinkBookingForItem={onUnlinkBookingForItem}
              bookingDocs={bookingDocs}
              bookingLinkItems={bookingLinkItems}
            />
            {item.durationMinutes ? (
              <span className={activityPillClassName}>
                <Icon name="clock" className="size-3.5" />
                {formatDuration(item.durationMinutes, locale)}
              </span>
            ) : null}
            {item.transportation ? (
              <span className="min-w-0 truncate">
                {item.transportation}
              </span>
            ) : null}
          </div>
          <div className={activityActionClusterClassName}>
            <span className={activityActionsClassName}>
              {renderActivityActions()}
            </span>
            {renderSubActivityButton()}
            <button
              type="button"
              className={activityTabletActionsClassName}
              aria-label={actionMenuLabel}
              aria-expanded={actionsExpanded}
              title={actionMenuLabel}
              onClick={(event) => {
                event.stopPropagation();
                setActionsExpanded((current) => !current);
              }}
            >
              <Icon name="dots" />
            </button>
          </div>
        </div>
        {actionsExpanded ? (
          <div
            className={activityTabletActionLayerClassName}
            aria-label={actionMenuLabel}
            onClick={(event) => event.stopPropagation()}
          >
            {renderActivityActions(true)}
          </div>
        ) : null}
        {subActivityModalOpen ? (
          <SubActivityModal
            canEdit={canEdit}
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            subItems={subItems}
            onAddSubActivity={onAddSubActivity}
            onAddNoteForItem={onAddNoteForItem}
            onOpenNoteForItem={openNoteModal}
            onClose={() => setSubActivityModalOpen(false)}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onAddBookingForItem={onAddBookingForItem}
            onSaveBookingForItem={onSaveBookingForItem}
            onUnlinkBookingForItem={onUnlinkBookingForItem}
            bookingDocs={bookingDocs}
            bookingLinkItems={bookingLinkItems}
            onUpdateItemInline={onUpdateItemInline}
          />
        ) : null}
      </div>
      <SubActivityList
        canEdit={canEdit}
        item={item}
        itineraryLabels={itineraryLabels}
        locale={locale}
        selected={selected}
        subItems={subItems}
        onAddSubActivity={onAddSubActivity}
        onAddNoteForItem={onAddNoteForItem}
        onOpenNoteForItem={openNoteModal}
        onAddBookingForItem={onAddBookingForItem}
        onSaveBookingForItem={onSaveBookingForItem}
        onUnlinkBookingForItem={onUnlinkBookingForItem}
        bookingDocs={bookingDocs}
        bookingLinkItems={bookingLinkItems}
        onDeleteItem={onDeleteItem}
        onEditItem={onEditItem}
        onUpdateItemInline={onUpdateItemInline}
        visible={subActivitiesExpanded || (selected && subItems.length === 0)}
      />
      {noteTarget && onAddNoteForItem ? (
        <ItineraryNoteModal
          item={noteTarget}
          locale={locale}
          onClose={() => setNoteTarget(null)}
          onSave={async (body) => {
            await onAddNoteForItem(noteTarget.id, body);
            setNoteTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ItineraryNoteModal({
  item,
  locale,
  onClose,
  onSave,
}: {
  item: ItineraryItem;
  locale: Locale;
  onClose: () => void;
  onSave: (body: string) => void | Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const title = locale === "th" ? `โน้ตสำหรับ ${item.activity}` : `Note for ${item.activity}`;
  const subtitle = locale === "th" ? "เก็บรายละเอียดสั้น ๆ ที่เกี่ยวกับ activity นี้" : "Capture a short note tied to this activity.";
  const placeholder = locale === "th" ? "เช่น นัดเจอกันที่ทางออก A, เตรียมพาสปอร์ต" : "Example: Meet at exit A, keep passports ready";

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={ticketModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <form
        className={cn(ticketModalClassName, "max-w-[480px]")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void submit(event)}
      >
        <header className={ticketModalHeaderClassName}>
          <strong className={ticketModalTitleClassName}>
            <span>{title}</span>
            <small>{subtitle}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label={locale === "th" ? "ปิด modal โน้ต" : "Close note modal"}
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={ticketModalBodyClassName}>
          <label className={cn(ticketFieldClassName, "col-span-full")}>
            <span>{locale === "th" ? "โน้ต" : "Note"}</span>
            <textarea
              autoFocus
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={placeholder}
            />
          </label>
        </div>
        <footer className={ticketModalFooterClassName}>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
            onClick={onClose}
          >
            {locale === "th" ? "ยกเลิก" : "Cancel"}
          </button>
          <button
            type="submit"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-primary-border) bg-(--color-primary) px-3 text-xs font-extrabold text-white hover:bg-(--color-primary-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || !body.trim()}
          >
            <Icon name="note" />
            {locale === "th" ? "บันทึกโน้ต" : "Save note"}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

function ActivityTypePicker({
  buttonClassName,
  disabled,
  item,
  itineraryLabels,
  locale,
  onUpdateItemInline,
}: {
  buttonClassName?: string;
  disabled?: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const subtype = travelSubtypeForItem(item);
  return (
    <InlineOptionPicker
      ariaLabel={itineraryLabels.row.inlineType({
        activity: item.activity,
      })}
      buttonClassName={buttonClassName}
      disabled={disabled}
      options={activityTypeOptions(locale)}
      optionKeyPrefix={`activity-type-${item.id}`}
      selectedSubValue={subtype ?? undefined}
      subOptionsByValue={{ travel: travelSubtypeOptions(locale) }}
      value={item.activityType}
      onCommit={(activityType) =>
        onUpdateItemInline?.(item.id, buildActivityTypePatch(item, activityType))
      }
      onCommitSubOption={(activityType, mode) =>
        onUpdateItemInline?.(
          item.id,
          buildActivitySubtypePatch(
            item,
            activityType as ItineraryItem["activityType"],
            mode,
          ),
        )
      }
    />
  );
}

function ActivityLocationLine({
  editable,
  item,
  itineraryLabels,
  onUpdateItemInline,
}: {
  editable: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  if (item.activityType === "travel") {
    const from = readItineraryDetailString(item.details, "from");
    const to = readItineraryDetailString(item.details, "to") || item.place;
    return (
      <div className={activityRouteLineClassName}>
        <span className={activityRouteLabelClassName}>From</span>
        <InlineActivityField
          ariaLabel={`Edit origin ${item.activity}`}
          autoSize
          className={activityPlaceInputClassName}
          disabled={!editable}
          key={`${item.id}:from:${from}`}
          maxLength={90}
          placeholder=""
          value={from}
          onCommit={(nextFrom) =>
            onUpdateItemInline?.(item.id, {
              details: {
                ...(item.details ?? {}),
                from: nextFrom,
              },
            })
          }
        />
        <span className={cn(activityRouteLabelClassName, "max-[520px]:col-start-1")}>To</span>
        <InlineActivityField
          ariaLabel={itineraryLabels.row.inlinePlace({
            activity: item.activity,
          })}
          autoSize
          className={activityPlaceInputClassName}
          disabled={!editable}
          key={`${item.id}:to:${to}`}
          maxLength={90}
          placeholder=""
          value={to}
          onCommit={(nextTo) =>
            onUpdateItemInline?.(item.id, {
              place: nextTo,
              details: {
                ...(item.details ?? {}),
                to: nextTo,
              },
            })
          }
        />
      </div>
    );
  }

  return (
    <div className={activityPlaceLineClassName}>
      <span className={activityRouteLabelClassName}>Place</span>
      <InlineActivityField
        ariaLabel={itineraryLabels.row.inlinePlace({
          activity: item.activity,
        })}
        className={cn(activityMobilePlaceInputClassName, "max-[520px]:block")}
        disabled={!editable}
        key={`${item.id}:place:${item.place}`}
        maxLength={90}
        placeholder=""
        value={item.place}
        onCommit={(place) => onUpdateItemInline?.(item.id, { place })}
      />
    </div>
  );
}

function ItineraryBookingButton({
  bookingDocs,
  bookingLinkItems,
  item,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
}: {
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
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
}) {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  if (!onAddBookingForItem && !onSaveBookingForItem) return null;
  const icon = bookingIconForItem(item);
  const linkedBooking = bookingDocs.find((booking) =>
    booking.relatedItineraryItemIds.includes(item.id),
  );
  const label = itineraryLabels.row.createBookingDraft({
    activity: item.activity,
    template: bookingTemplateLabel(item, locale),
  });
  return (
    <>
      <button
        type="button"
        className={cn(
          activityBookingButtonClassName,
          linkedBooking
            ? activityBookingButtonLinkedClassName
            : activityBookingButtonEmptyClassName,
        )}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          if (onSaveBookingForItem) {
            setTicketModalOpen(true);
            return;
          }
          void onAddBookingForItem?.(item.id, bookingTemplateForItem(item));
        }}
      >
        <Icon name={icon} />
        <span className="min-w-0 truncate">{bookingTemplateLabel(item, locale)}</span>
      </button>
      {ticketModalOpen && onSaveBookingForItem ? (
        <ItineraryTicketModal
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          item={item}
          locale={locale}
          onClose={() => setTicketModalOpen(false)}
          onUnlink={
            onUnlinkBookingForItem
              ? async (bookingDocId) => {
                  await onUnlinkBookingForItem(bookingDocId, item.id);
                  setTicketModalOpen(false);
                }
              : undefined
          }
          onSave={async (input) => {
            await onSaveBookingForItem(input);
            setTicketModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function ItineraryTicketModal({
  bookingDocs,
  bookingLinkItems,
  item,
  locale,
  onClose,
  onSave,
  onUnlink,
}: {
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  item: ItineraryItem;
  locale: Locale;
  onClose: () => void;
  onSave: (input: ItineraryBookingTicketInput) => void | Promise<void>;
  onUnlink?: (bookingDocId: string) => void | Promise<void>;
}) {
  const template = bookingTemplateForItem(item);
  const type = bookingDocTypeForItemTemplate(item, template);
  const existingCandidates = bookingDocs.filter(
    (booking) =>
      booking.relatedItineraryItemIds.includes(item.id) ||
      booking.type === type ||
      (type === "public_transport" &&
        ["flight", "train", "public_transport"].includes(booking.type)),
  );
  const initiallyLinked =
    existingCandidates.find((booking) =>
      booking.relatedItineraryItemIds.includes(item.id),
    ) ?? null;
  const currentLinkedBooking =
    bookingDocs.find((booking) =>
      booking.relatedItineraryItemIds.includes(item.id),
    ) ?? null;
  const defaultTitle = bookingTitleForItem(item, type);
  const [mode, setMode] = useState<"existing" | "new">(
    initiallyLinked ? "existing" : "new",
  );
  const [selectedBookingId, setSelectedBookingId] = useState(
    initiallyLinked?.id ?? existingCandidates[0]?.id ?? "",
  );
  const selectedBooking =
    existingCandidates.find((booking) => booking.id === selectedBookingId) ??
    null;
  const initialTicket = mode === "existing" ? selectedBooking : null;
  const [title, setTitle] = useState(initialTicket?.title ?? defaultTitle);
  const [providerName, setProviderName] = useState(
    initialTicket?.providerName ??
      readItineraryDetailString(item.details, "provider") ??
      "",
  );
  const [confirmationCode, setConfirmationCode] = useState(
    initialTicket?.confirmationCode ??
      readItineraryDetailString(item.details, "bookingRef") ??
      readItineraryDetailString(item.details, "ticketRef") ??
      "",
  );
  const [startsAt, setStartsAt] = useState(
    toDateTimeLocalValue(initialTicket?.startsAt ?? itineraryDateTimeValue(item.day, item.startTime)),
  );
  const [endsAt, setEndsAt] = useState(
    toDateTimeLocalValue(initialTicket?.endsAt ?? itineraryDateTimeValue(item.day, item.endTime ?? "")),
  );
  const [notes, setNotes] = useState(
    initialTicket?.notes ?? ticketNotesForItem(item, locale),
  );
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(() =>
    uniqueIds([...(initialTicket?.relatedItineraryItemIds ?? []), item.id]),
  );
  const [saving, setSaving] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const copy = ticketModalCopy(locale);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function hydrateTicketFields(booking: BookingDoc | null) {
    setTitle(booking?.title ?? defaultTitle);
    setProviderName(
      booking?.providerName ??
        readItineraryDetailString(item.details, "provider") ??
        "",
    );
    setConfirmationCode(
      booking?.confirmationCode ??
        readItineraryDetailString(item.details, "bookingRef") ??
        readItineraryDetailString(item.details, "ticketRef") ??
        "",
    );
    setStartsAt(toDateTimeLocalValue(booking?.startsAt ?? itineraryDateTimeValue(item.day, item.startTime)));
    setEndsAt(toDateTimeLocalValue(booking?.endsAt ?? itineraryDateTimeValue(item.day, item.endTime ?? "")));
    setNotes(booking?.notes ?? ticketNotesForItem(item, locale));
    setRelatedItineraryItemIds(uniqueIds([...(booking?.relatedItineraryItemIds ?? []), item.id]));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (saving || unlinking || !trimmedTitle) return;
    setSaving(true);
    try {
      await onSave({
        bookingDocId: mode === "existing" ? selectedBookingId : null,
        itemId: item.id,
        template,
        type: selectedBooking?.type ?? type,
        title: trimmedTitle,
        status: selectedBooking?.status ?? "draft",
        visibility: selectedBooking?.visibility ?? "shared",
        providerName: providerName.trim() || null,
        confirmationCode: confirmationCode.trim() || null,
        startsAt: fromDateTimeLocalValue(startsAt),
        endsAt: fromDateTimeLocalValue(endsAt),
        travelerIds: selectedBooking?.travelerIds ?? [],
        relatedItineraryItemIds: uniqueIds([...relatedItineraryItemIds, item.id]),
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  async function unlinkCurrentBooking() {
    if (!currentLinkedBooking || !onUnlink || saving || unlinking) return;
    setUnlinking(true);
    try {
      await onUnlink(currentLinkedBooking.id);
    } finally {
      setUnlinking(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={ticketModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <form
        className={ticketModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title(item.activity)}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void submit(event)}
      >
        <header className={ticketModalHeaderClassName}>
          <strong className={ticketModalTitleClassName}>
            <span>{copy.title(item.activity)}</span>
            <small>{copy.subtitle}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label={copy.close}
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={ticketModalBodyClassName}>
          <div className={ticketModeToggleClassName}>
            <button
              type="button"
              className={ticketModeButtonClassName}
              aria-pressed={mode === "new"}
              onClick={() => {
                setMode("new");
                hydrateTicketFields(null);
              }}
            >
              <Icon name="plus" /> {copy.newTicket}
            </button>
            <button
              type="button"
              className={ticketModeButtonClassName}
              aria-pressed={mode === "existing"}
              disabled={!existingCandidates.length}
              onClick={() => {
                const booking = selectedBooking ?? existingCandidates[0] ?? null;
                setMode("existing");
                setSelectedBookingId(booking?.id ?? "");
                hydrateTicketFields(booking);
              }}
            >
              <Icon name="ticket" /> {copy.useExisting}
            </button>
          </div>
          {mode === "existing" ? (
            <div className={ticketExistingGridClassName} role="radiogroup" aria-label={copy.existingTickets}>
              {existingCandidates.map((booking) => (
                <label className={ticketExistingOptionClassName} key={booking.id}>
                  <input
                    type="radio"
                    checked={selectedBookingId === booking.id}
                    onChange={() => {
                      setSelectedBookingId(booking.id);
                      hydrateTicketFields(booking);
                    }}
                  />
                  <span>
                    <strong>{booking.title}</strong>
                    <span>
                      {formatBookingSummary(booking, bookingLinkItems)}
                    </span>
                  </span>
                </label>
              ))}
              {!existingCandidates.length ? (
                <p className="m-0 text-xs font-bold text-(--color-text-muted)">
                  {copy.noExisting}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className={ticketFieldGridClassName}>
            <label className={ticketFieldClassName}>
              <span>{copy.ticketTitle}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.provider}</span>
              <input value={providerName} onChange={(event) => setProviderName(event.target.value)} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.confirmation}</span>
              <input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.startsAt}</span>
              <DateTimePickerField value={startsAt} onChange={setStartsAt} />
            </label>
            <label className={ticketFieldClassName}>
              <span>{copy.endsAt}</span>
              <DateTimePickerField value={endsAt} onChange={setEndsAt} />
            </label>
            <label className={cn(ticketFieldClassName, "col-span-full")}>
              <span>{copy.notes}</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </div>
          <section className="grid gap-1.5" aria-label={copy.linkedActivities}>
            <strong className="text-xs font-extrabold text-(--color-text-muted)">
              {copy.linkedActivities}
            </strong>
            <div className={ticketLinkedItemsClassName}>
              {bookingLinkItems.map((candidate) => (
                <label className={ticketLinkedOptionClassName} key={candidate.id}>
                  <input
                    type="checkbox"
                    checked={relatedItineraryItemIds.includes(candidate.id)}
                    disabled={candidate.id === item.id}
                    onChange={() =>
                      setRelatedItineraryItemIds((current) =>
                        toggleId(current, candidate.id),
                      )
                    }
                  />
                  <span>{candidate.day} · {candidate.activity}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
        <footer className={ticketModalFooterClassName}>
          <div className="mr-auto min-w-0">
            {currentLinkedBooking && onUnlink ? (
              <button
                type="button"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:border-(--color-danger-border) hover:bg-(--color-danger-soft) hover:text-(--color-danger) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving || unlinking}
                onClick={() => void unlinkCurrentBooking()}
              >
                <Icon name="x" />
                {unlinking ? copy.unlinking : copy.unlink}
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
              disabled={unlinking}
              onClick={onClose}
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route) px-3 text-xs font-extrabold text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving || unlinking || !title.trim() || (mode === "existing" && !selectedBookingId)}
            >
              <Icon name="ticket" />
              {copy.save}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

function ActivityTimeButton({
  editable,
  item,
  itineraryLabels,
  locale,
  onSave,
}: {
  editable: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onSave: (patch: InlineItineraryItemPatch) => void | Promise<void>;
}) {
  const [timeEditOpen, setTimeEditOpen] = useState(false);
  const timeTooltip = formatTimeTooltip(item, locale);
  const startLabel = item.startTime?.trim() || "--:--";
  const endLabel = item.endTime?.trim()
    ? `${item.endTime.trim()}${item.endOffsetDays ? ` +${item.endOffsetDays}` : ""}`
    : "--:--";

  return (
    <>
      <button
        type="button"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        className={activityTimeButtonClassName}
        disabled={!editable}
        title={timeTooltip}
        onClick={(event) => {
          event.stopPropagation();
          setTimeEditOpen(true);
        }}
      >
        <span className={activityTimeStartClassName}>{startLabel}</span>
        <span className={activityTimeEndClassName}>{endLabel}</span>
      </button>
      {timeEditOpen ? (
        <TimeEditModal
          item={item}
          itineraryLabels={itineraryLabels}
          locale={locale}
          onClose={() => setTimeEditOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}

function TimeEditModal({
  item,
  itineraryLabels,
  locale,
  onClose,
  onSave,
}: {
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onClose: () => void;
  onSave: (patch: InlineItineraryItemPatch) => void | Promise<void>;
}) {
  const [startTime, setStartTime] = useState(item.startTime ?? "");
  const [endTime, setEndTime] = useState(item.endTime ?? "");
  const [endOffsetDays, setEndOffsetDays] = useState(
    item.endTime ? item.endOffsetDays ?? 0 : 0,
  );
  const [saving, setSaving] = useState(false);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = endTime ? parseTimeToMinutes(endTime) : null;
  const hasValidStart = !startTime || startMinutes !== null;
  const hasValidEnd = !endTime || endMinutes !== null;
  const needsStartForEnd = Boolean(endTime && !startTime.trim());
  const derivedDuration =
    startMinutes !== null && endMinutes !== null
      ? Math.max(1, endMinutes + endOffsetDays * 24 * 60 - startMinutes)
      : null;
  const timeFormatHint =
    locale === "th"
      ? "ใช้รูปแบบ 24 ชั่วโมง เช่น 08:30"
      : "Use 24-hour time, for example 08:30.";
  const optionalEndHint =
    locale === "th"
      ? "เวลาจบไม่บังคับ ถ้าเว้นว่างจะไม่แสดง duration"
      : "End time is optional. Leave it blank to hide duration.";
  const errorMessage =
    !hasValidStart || !hasValidEnd
      ? locale === "th"
        ? "เวลาใช้รูปแบบ HH:MM เช่น 09:30"
        : "Use HH:MM time, for example 09:30."
      : needsStartForEnd
        ? locale === "th"
          ? "ใส่เวลาเริ่มก่อนใส่เวลาจบ"
          : "Add a start time before adding an end time."
      : null;
  const previewWindow =
    startTime && endTime && derivedDuration
      ? formatTimeRangeLabel(startTime, endTime, endOffsetDays)
      : startTime || "--:--";

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function updateStartTime(nextStartTime: string) {
    setStartTime(nextStartTime);
    if (!endTime) return;
    const nextOffset = endOffsetDaysBetweenTimes(nextStartTime, endTime);
    setEndOffsetDays(nextOffset);
  }

  function updateEndTime(nextEndTime: string) {
    setEndTime(nextEndTime);
    setEndOffsetDays(nextEndTime ? endOffsetDaysBetweenTimes(startTime, nextEndTime) : 0);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || errorMessage) return;
    setSaving(true);
    try {
      await onSave({
        startTime: startTime.trim(),
        endTime: endTime.trim() || null,
        endOffsetDays: endTime.trim() ? endOffsetDays : 0,
        durationMinutes: endTime.trim() ? derivedDuration : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={timeEditModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <form
        className={timeEditModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={itineraryLabels.row.inlineTime({ activity: item.activity })}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => void save(event)}
      >
        <header className={timeEditModalHeaderClassName}>
          <strong className={timeEditModalTitleClassName}>
            <span>{item.activity}</span>
            <small>{itineraryLabels.row.inlineTime({ activity: item.activity })}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label="Close time editor"
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={timeEditModalBodyClassName}>
          <div className={timeEditFieldsClassName}>
            <label className={timeEditFieldClassName}>
              <span>{locale === "th" ? "เวลาเริ่ม" : "Start time"}</span>
              <input
                className={timeEditInputClassName}
                inputMode="numeric"
                maxLength={5}
                placeholder="08:30"
                title={timeFormatHint}
                value={startTime}
                onChange={(event) => updateStartTime(event.target.value)}
              />
            </label>
            <label className={timeEditFieldClassName}>
              <span>{locale === "th" ? "เวลาจบ" : "End time"}</span>
              <input
                className={timeEditInputClassName}
                inputMode="numeric"
                maxLength={5}
                placeholder="10:00"
                title={`${timeFormatHint} ${optionalEndHint}`}
                value={endTime}
                onChange={(event) => updateEndTime(event.target.value)}
              />
            </label>
          </div>
          <p className={timeEditHelperClassName}>
            {timeFormatHint} {optionalEndHint}
          </p>
          <button
            type="button"
            className={timeEditNextDayClassName}
            aria-pressed={endOffsetDays > 0}
            disabled={!endTime}
            onClick={() => setEndOffsetDays((current) => (current > 0 ? 0 : 1))}
          >
            +1 {locale === "th" ? "จบวันถัดไป" : "next day end"}
          </button>
          <div className={timeEditPreviewClassName}>
            <span>{locale === "th" ? "ตัวอย่างที่จะแสดง" : "Display preview"}</span>
            <strong className={timeEditPreviewValueClassName}>
              {previewWindow}
            </strong>
            {derivedDuration ? (
              <span>
                {locale === "th" ? "ระยะเวลา" : "Duration"}:{" "}
                {formatDuration(derivedDuration, locale)}
              </span>
            ) : (
              <span>{locale === "th" ? "ไม่แสดง duration" : "Duration hidden"}</span>
            )}
          </div>
          {errorMessage ? (
            <p className="text-xs font-bold text-(--color-danger)" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <footer className={timeEditModalFooterClassName}>
          <button
            type="button"
            className="inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)"
            onClick={onClose}
          >
            {itineraryLabels.row.durationCancel}
          </button>
          <button
            type="submit"
            className="inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route) px-3 text-xs font-extrabold text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || Boolean(errorMessage)}
          >
            {itineraryLabels.row.durationSave}
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

function SubActivityModal({
  canEdit,
  item,
  itineraryLabels,
  locale,
  onAddSubActivity,
  onAddNoteForItem,
  onOpenNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onClose,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
  subItems,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  subItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
  onOpenNoteForItem?: (item: ItineraryItem, compact?: boolean) => void;
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
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onClose: () => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={subActivityModalBackdropClassName}
      role="presentation"
      onClick={onClose}
    >
      <section
        className={subActivityModalClassName}
        role="dialog"
        aria-modal="true"
        aria-label={`Sub-activities for ${item.activity}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={subActivityModalHeaderClassName}>
          <strong className={subActivityModalTitleClassName}>
            <span>{item.activity}</span>
            <small>{itineraryLabels.row.subItemQuick}</small>
          </strong>
          <button
            type="button"
            className={subActivityModalCloseClassName}
            aria-label="Close sub-activities"
            onClick={onClose}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className={subActivityModalBodyClassName}>
          <SubActivityList
            canEdit={canEdit}
            item={item}
            itineraryLabels={itineraryLabels}
            locale={locale}
            presentation="modal"
            selected
            subItems={subItems}
            onAddSubActivity={onAddSubActivity}
            onAddNoteForItem={onAddNoteForItem}
            onOpenNoteForItem={onOpenNoteForItem}
            onAddBookingForItem={onAddBookingForItem}
            onSaveBookingForItem={onSaveBookingForItem}
            onUnlinkBookingForItem={onUnlinkBookingForItem}
            bookingDocs={bookingDocs}
            bookingLinkItems={bookingLinkItems}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onUpdateItemInline={onUpdateItemInline}
          />
        </div>
      </section>
    </div>,
    document.body,
  );
}

function SubActivityList({
  canEdit,
  item,
  itineraryLabels,
  locale,
  presentation = "inline",
  selected,
  subItems,
  visible = true,
  onAddSubActivity,
  onAddNoteForItem,
  onOpenNoteForItem,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
  bookingDocs,
  bookingLinkItems,
  onDeleteItem,
  onEditItem,
  onUpdateItemInline,
}: {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  presentation?: "inline" | "modal";
  selected: boolean;
  subItems: ItineraryItem[];
  visible?: boolean;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
  onOpenNoteForItem?: (item: ItineraryItem, compact?: boolean) => void;
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
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
}) {
  const editable = canEdit && Boolean(onUpdateItemInline);
  const showAddSubActivity =
    Boolean(onAddSubActivity) &&
    (presentation === "modal" || visible || selected || subItems.length > 0);

  if (presentation === "inline" && !visible) return null;
  if (subItems.length === 0 && !showAddSubActivity) return null;

  return (
    <div
      className={
        presentation === "modal"
          ? subActivityModalListClassName
          : subActivityListClassName
      }
    >
      {subItems.map((subItem) => (
        <div
          className={subActivityLineClassName}
          data-sub-item-id={subItem.id}
          key={subItem.id}
        >
          <span className="max-[760px]:hidden">
            <ActivityTimeButton
              editable={editable}
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onSave={(patch) => onUpdateItemInline?.(subItem.id, patch)}
            />
          </span>
          <div className={subActivityTextClassName}>
            <InlineActivityField
              ariaLabel={itineraryLabels.row.inlineActivity({
                activity: subItem.activity,
              })}
              autoSize
              className={subActivityTitleInputClassName}
              disabled={!editable}
              key={`${subItem.id}:activity:${subItem.activity}`}
              maxLength={80}
              placeholder="Sub-activity"
              value={subItem.activity}
              onCommit={(activity) =>
                onUpdateItemInline?.(subItem.id, {
                  activity: activity || subItem.activity,
                })
              }
            />
            <ActivityLocationLine
              editable={editable}
              item={subItem}
              itineraryLabels={itineraryLabels}
              onUpdateItemInline={onUpdateItemInline}
            />
          </div>
          <div className={subActivityActionsClassName}>
            {subItem.mapLink ? (
              <a
                className={activityIconButtonClassName}
                href={subItem.mapLink}
                target="_blank"
                rel="noreferrer"
                aria-label={`${itineraryLabels.row.mapFallback}: ${subItem.place || subItem.activity}`}
                onClick={(event) => event.stopPropagation()}
              >
                <Icon name="map" className="size-4" />
              </a>
            ) : null}
            <ItineraryBookingButton
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onAddBookingForItem={onAddBookingForItem}
              onSaveBookingForItem={onSaveBookingForItem}
              onUnlinkBookingForItem={onUnlinkBookingForItem}
              bookingDocs={bookingDocs}
              bookingLinkItems={bookingLinkItems}
            />
            <ActivityTypePicker
              buttonClassName={cn(activityMobileTypePickerClassName, "!inline-flex !w-7 max-[520px]:!inline-flex")}
              disabled={!editable}
              item={subItem}
              itineraryLabels={itineraryLabels}
              locale={locale}
              onUpdateItemInline={onUpdateItemInline}
            />
            {onAddNoteForItem && onOpenNoteForItem ? (
              <button
                type="button"
                className={activityIconButtonClassName}
                aria-label={locale === "th" ? `เพิ่มโน้ต ${subItem.activity}` : `Add note for ${subItem.activity}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenNoteForItem(subItem);
                }}
              >
                <Icon name="note" className="size-4" />
              </button>
            ) : null}
            {onEditItem ? (
              <button
                type="button"
                className={activityIconButtonClassName}
                aria-label={itineraryLabels.row.edit({
                  activity: subItem.activity,
                })}
                onClick={(event) => {
                  event.stopPropagation();
                  onEditItem(subItem.id);
                }}
              >
                <Icon name="edit" className="size-4" />
              </button>
            ) : null}
            {onDeleteItem ? (
              <button
                type="button"
                className={activityIconButtonClassName}
                aria-label={itineraryLabels.row.delete({
                  activity: subItem.activity,
                })}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteItem(subItem.id);
                }}
              >
                <Icon name="trash" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {showAddSubActivity ? (
        <button
          type="button"
          className={addSubActivityButtonClassName}
          disabled={!canEdit}
          onClick={(event) => {
            event.stopPropagation();
            void onAddSubActivity?.(item.id);
          }}
        >
          <Icon name="plus" className="size-4" />
          {itineraryLabels.row.subItemQuick}
        </button>
      ) : null}
    </div>
  );
}

function InlineActivityField({
  ariaLabel,
  autoSize = false,
  className,
  disabled,
  inputMode,
  maxLength,
  onCommit,
  placeholder,
  value,
}: {
  ariaLabel: string;
  autoSize?: boolean;
  className: string;
  disabled: boolean;
  inputMode?: "numeric" | "text";
  maxLength: number;
  onCommit: (value: string) => void | Promise<void>;
  placeholder: string;
  value: string;
}) {
  const [draft, setDraft] = useState(value);
  const [source, setSource] = useState(value);

  function reset() {
    setDraft(source);
  }

  async function commit(nextValue: string) {
    const trimmed = nextValue.trim();
    if (disabled || trimmed === source) {
      setDraft(source);
      return;
    }
    await onCommit(trimmed);
    setSource(trimmed);
    setDraft(trimmed);
  }

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      inputMode={inputMode}
      maxLength={maxLength}
      placeholder={placeholder}
      size={
        autoSize
          ? Math.max(1, Math.min(maxLength, draft.length || placeholder.length || 1))
          : undefined
      }
      value={draft}
      onBlur={() => void commit(draft)}
      onChange={(event) => setDraft(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onFocus={(event) => event.currentTarget.select()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          reset();
          event.currentTarget.blur();
        }
      }}
    />
  );
}



function DayWeatherChip({
  briefing,
  dayLabel,
}: {
  briefing: TripDailyBriefing | null;
  dayLabel: string;
}) {
  if (!briefing) return null;
  const weather = briefing.weather;
  const condition = weatherGraphicLabel(weather?.conditionCode);
  const high = weather?.temperatureMaxCelsius;
  const low = weather?.temperatureMinCelsius;
  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);
  const hasForecastTemps = typeof high === "number" && typeof low === "number";
  const hasSolarTimes = Boolean(sunrise && sunset);
  if (!hasForecastTemps && !hasSolarTimes) return null;
  const hasCondition = Boolean(weather?.conditionCode && weather.conditionCode !== "unavailable");
  const solarLabel = sunrise && sunset ? `sunrise ${sunrise} sunset ${sunset}` : "";
  const weatherLabel = [
    hasForecastTemps
      ? `${condition} ${formatWeatherTemp(high)} ${formatWeatherTemp(low)}`
      : hasCondition
        ? condition
        : "",
    solarLabel,
  ].filter(Boolean).join(" ");
  const tooltipLabel = buildWeatherTooltip(weather, weatherLabel, sunrise, sunset);

  return (
    <span
      className={dayWeatherChipClassName}
      aria-label={`Weather for ${dayLabel}: ${tooltipLabel.replace(/\n/g, ", ")}`}
      title={tooltipLabel}
    >
      <span aria-hidden="true">
        <Icon name={weatherIconForCondition(weather?.conditionCode)} />
      </span>{" "}
      {hasForecastTemps ? (
        <>
          <strong>{formatWeatherTemp(high)}</strong>{" "}
          <span>{formatWeatherTemp(low)}</span>
        </>
      ) : hasCondition ? <span>{condition}</span> : null}
      {hasSolarTimes ? (
        <>
          <span className={dayWeatherSolarClassName}>
            <Icon name="sunrise" />
            {sunrise}
          </span>
          <span className={dayWeatherSolarClassName}>
            <Icon name="sunset" />
            {sunset}
          </span>
        </>
      ) : null}
    </span>
  );
}
