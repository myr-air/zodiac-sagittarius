import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary architecture contracts", () => {
  it("keeps itinerary day group header split from row body rendering", () => {
    const dayGroup = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-group.tsx");
    const dayGroupHeader = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/DayGroupHeader.tsx");
    const dayGroupTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-group.types.ts");

    expect(dayGroup).toContain("./DayGroupHeader");
    expect(dayGroup).toContain("./day-group.types");
    expect(dayGroup).not.toContain("DayTitleEditor");
    expect(dayGroup).not.toContain("DayPathControls");
    expect(dayGroupHeader).toContain("export function DayGroupHeader");
    expect(dayGroupHeader).toContain("DayTitleEditor");
    expect(dayGroupHeader).toContain("DayPathControls");
    expect(dayGroupTypes).toContain("export interface DayGroupProps");
  });

  it("keeps trip plan controls state split from control rendering", () => {
    const controls = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTableTripPlanControls.tsx");
    const controlsState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/use-trip-plan-controls-state.ts");
    const tripPlanControlsStory = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/storybook/SmartItineraryTableTripPlanControls.stories.tsx");
    const pathFiltersStory = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/storybook/SmartItineraryTablePathFilters.stories.tsx");

    expect(controls).toContain("./use-trip-plan-controls-state");
    expect(controls).not.toContain("useState");
    expect(controls).not.toContain("function submitNewTripPlan");
    expect(controls).not.toContain("tripPlanStatus(");
    expect(controlsState).toContain("export function useTripPlanControlsState");
    expect(controlsState).toContain("function submitNewTripPlan");
    expect(controlsState).toContain("tripPlanStatus(");
    expect(tripPlanControlsStory).toContain("SmartItineraryTableTripPlanControlsProps");
    expect(tripPlanControlsStory).not.toContain("ComponentProps<typeof SmartItineraryTableTripPlanControls>");
    expect(pathFiltersStory).toContain("SmartItineraryTablePathFiltersProps");
    expect(pathFiltersStory).not.toContain("ComponentProps<typeof SmartItineraryTablePathFilters>");
  });

  it("keeps smart itinerary item action prop contracts centralized", () => {
    const actionTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/itinerary-action.types.ts");
    const tableTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable.types.ts");
    const tableBody = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/SmartItineraryTableBody.tsx");
    const dayGroupTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-group.types.ts");
    const activityCellTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.types.ts");
    const subActivityTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/sub-activity.types.ts");

    expect(actionTypes).toContain("export interface ItineraryBookingActionProps");
    expect(actionTypes).toContain("export interface ItineraryNestedActivityActionProps");
    expect(actionTypes).toContain("export interface ItineraryItemInteractionProps");
    expect(actionTypes).toContain("export interface ItineraryInlineItemEditProps");
    [
      tableTypes,
      tableBody,
      dayGroupTypes,
      activityCellTypes,
      subActivityTypes,
    ].forEach((source) => {
      expect(source).toContain("ItineraryBookingActionProps");
      expect(source).toContain("ItineraryNestedActivityActionProps");
      expect(source).toContain("ItineraryInlineItemEditProps");
      expect(source).not.toContain("onAddBookingForItem?: (");
      expect(source).not.toContain("onAddSubActivity?: (parentItemId: string)");
      expect(source).not.toContain("onUpdateItemInline?: (");
    });
    [
      tableTypes,
      tableBody,
      dayGroupTypes,
      activityCellTypes,
    ].forEach((source) => expect(source).toContain("ItineraryItemInteractionProps"));
    expect(subActivityTypes).not.toContain("ItineraryItemInteractionProps");
  });

  it("keeps inline option picker menu rendering split from trigger state", () => {
    const picker = readItineraryArchitectureSource("src/shared/components/inline-option-picker/InlineOptionPicker.tsx");
    const pickerMenu = readItineraryArchitectureSource("src/shared/components/inline-option-picker/InlineOptionPickerMenu.tsx");
    const pickerPosition = readItineraryArchitectureSource("src/shared/components/inline-option-picker/model/inline-option-picker-position.ts");
    const pickerStory = readItineraryArchitectureSource("src/shared/components/inline-option-picker/storybook/InlineOptionPicker.stories.tsx");

    expect(picker).toContain("./InlineOptionPickerMenu");
    expect(picker).toContain("./model/inline-option-picker-position");
    expect(picker).not.toContain("createPortal");
    expect(picker).not.toContain("floatingOptionMenuClassName");
    expect(picker).not.toContain("window.innerHeight - rect.bottom");
    expect(pickerMenu).toContain("export function InlineOptionPickerMenu");
    expect(pickerMenu).toContain("createPortal");
    expect(pickerMenu).toContain("./model/inline-option-picker-position");
    expect(pickerMenu).not.toContain("function sideMenuFloatingLeft");
    expect(pickerPosition).toContain("export function inlineOptionPickerMenuPosition");
    expect(pickerPosition).toContain("export function inlineOptionPickerSideMenuPosition");
    expect(pickerStory).toContain("InlineOptionPickerProps");
    expect(pickerStory).not.toContain("ComponentProps<typeof InlineOptionPicker>");
  });

  it("keeps route map canvas rendering split from map page orchestration", () => {
    const mapView = readItineraryArchitectureSource("src/features/itinerary/components/route-map/RouteMapView.tsx");
    const mapCanvas = readItineraryArchitectureSource("src/features/itinerary/components/route-map/RouteMapCanvas.tsx");
    const routeMapTypes = readItineraryArchitectureSource("src/features/itinerary/components/route-map/route-map.types.ts");

    expect(mapView).toContain("./RouteMapCanvas");
    expect(mapView).not.toContain("routeMapCanvasClassName");
    expect(mapView).not.toContain("StaticRouteFallback");
    expect(mapCanvas).toContain("export function RouteMapCanvas");
    expect(mapCanvas).toContain("StaticRouteFallback");
    expect(mapCanvas).toContain("./route-map.types");
    expect(mapCanvas).not.toContain('type RouteMapCanvasCopy = Messages["map"]');
    expect(routeMapTypes).toContain('export type RouteMapCanvasCopy = Messages["map"]');
  });

  it("keeps context rail booking display labels in the itinerary booking domain", () => {
    const bookingDocItem = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailBookingDocItem.tsx");
    const bookingSection = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailBookingSection.tsx");
    const noteItem = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailNoteItem.tsx");
    const suggestionsSection = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/ContextRailSuggestionsSection.tsx");
    const contextRailUtils = readItineraryArchitectureSource("src/features/itinerary/components/context-rail/context-rail.utils.ts");
    const bookingDisplay = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-booking-display.ts");
    const contextRailDisplay = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-context-rail-display.ts");

    expect(bookingDocItem).toContain("@/src/features/itinerary/domain/itinerary-booking-display");
    [bookingDocItem, bookingSection, noteItem, suggestionsSection].forEach(
      (source) =>
        expect(source).toContain(
          "@/src/features/itinerary/domain/itinerary-context-rail-display",
        ),
    );
    expect(contextRailUtils).not.toContain("function formatBookingDocTypeLabel");
    expect(contextRailUtils).not.toContain("function suggestionLabel");
    expect(contextRailUtils).not.toContain("function memberDisplayName");
    expect(contextRailUtils).not.toContain("bookingDocTypeOptions");
    expect(contextRailUtils).not.toContain("taskKindLabel");
    expect(bookingDisplay).toContain("export function formatBookingDocTypeLabel");
    expect(contextRailDisplay).toContain("export const bookingDocTypeOptions");
    expect(contextRailDisplay).toContain("export function suggestionLabel");
    expect(contextRailDisplay).toContain("export function memberDisplayName");
    expect(contextRailDisplay).toContain("export { taskKindLabel }");
  });

  it("keeps itinerary ticket modal form state split from modal render", () => {
    const ticketModal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModal.tsx");
    const modalPortal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalPortal.tsx");
    const bookingButton = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryBookingButton.tsx");
    const exports = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/components.tsx");
    const ticketFooter = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalFooter.tsx");
    const ticketSections = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalSections.tsx");
    const existingTicketList = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ExistingTicketList.tsx");
    const ticketFieldGrid = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/TicketFieldGrid.tsx");
    const linkedActivitiesPicker = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/LinkedActivitiesPicker.tsx");
    const ticketModel = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-ticket-modal-model.ts");
    const ticketForm = readItineraryArchitectureSource("src/features/itinerary/domain/booking-ticket-form.ts");

    expect(ticketModal).toContain("./use-itinerary-ticket-modal-model");
    expect(bookingButton).toContain("export function ItineraryBookingButton");
    expect(bookingButton).toContain("./ItineraryTicketModal");
    expect(exports).toContain("./activity-cell/ItineraryBookingButton");
    expect(exports).toContain("./activity-cell/ItineraryTicketModal");
    expect(exports).not.toContain("BookingComponents");
    expect(ticketModal).toContain("./ItineraryTicketModalFooter");
    expect(ticketModal).toContain("./ItineraryTicketModalSections");
    expect(ticketModal).toContain("./ActivityCellModalPortal");
    expect(ticketModal).not.toContain("createPortal");
    expect(ticketModal).not.toContain("@/src/shared/hooks/use-escape-to-close");
    expect(ticketModal).not.toContain("useState");
    expect(ticketModal).not.toContain("buildTicketSubmitInput");
    expect(ticketModal).not.toContain("formatBookingSummary");
    expect(ticketModal).not.toContain("DateTimePickerField");
    expect(ticketFooter).toContain("export function ItineraryTicketModalFooter");
    expect(ticketSections).toContain("export { TicketModeToggle }");
    expect(ticketSections).toContain("export { TicketFieldGrid }");
    expect(ticketSections).toContain("export { LinkedActivitiesPicker }");
    expect(existingTicketList).toContain("export function ExistingTicketList");
    expect(existingTicketList).toContain("formatBookingSummary");
    expect(ticketFieldGrid).toContain("export function TicketFieldGrid");
    expect(ticketFieldGrid).toContain("DateTimePickerField");
    expect(linkedActivitiesPicker).toContain("export function LinkedActivitiesPicker");
    expect(linkedActivitiesPicker).toContain("toggleId");
    expect(ticketModel).toContain("export function useItineraryTicketModalModel");
    expect(ticketModel).toContain("@/src/features/itinerary/domain/booking-ticket-form");
    expect(ticketModel).toContain("type TicketFormValues");
    expect(ticketModel).toContain("const [formValues, setFormValues]");
    expect(ticketModel).toContain("function updateTicketField");
    expect(ticketModel).not.toContain("function buildTicketSubmitInput");
    expect(ticketModel).not.toContain("const [title, setTitle]");
    expect(ticketModel).not.toContain("const [providerName, setProviderName]");
    expect(ticketForm).toContain("export function buildTicketSubmitInput");
    expect(ticketForm).toContain("export interface TicketFormValues");
    expect(modalPortal).toContain("export function ActivityCellModalPortal");
    expect(modalPortal).toContain("createPortal");
    expect(modalPortal).toContain("@/src/shared/hooks/use-escape-to-close");
  });

  it("keeps activity cell title editing and actions split from shell layout", () => {
    const activityCell = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCell.tsx");
    const titleLine = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellTitleLine.tsx");
    const actionGroup = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellActionGroup.tsx");
    const actionButtons = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityActionButtons.tsx");
    const actionButton = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityActionButton.tsx");

    expect(activityCell).toContain("./ActivityCellTitleLine");
    expect(activityCell).toContain("./ActivityCellActionGroup");
    expect(activityCell).not.toContain("./InlineActivityField");
    expect(activityCell).not.toContain("./ActivityActionButtons");
    expect(titleLine).toContain("export function ActivityCellTitleLine");
    expect(titleLine).toContain("InlineActivityField");
    expect(actionGroup).toContain("export function ActivityCellActionGroup");
    expect(actionGroup).toContain("ActivityActionButtons");
    expect(actionButtons).toContain("./ActivityActionButton");
    expect(actionButtons).not.toContain("event.stopPropagation");
    expect(actionButton).toContain("export function ActivityActionButton");
    expect(actionButton).toContain("event.stopPropagation");
  });

  it("keeps itinerary table weather formatting split from path utilities", () => {
    const tableUtils = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-utils.ts");
    const tableGrouping = readItineraryArchitectureSource("src/features/itinerary/domain/itinerary-table-grouping.ts");
    const tableGraph = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-graph.ts");
    const tableLabels = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-labels.ts");
    const tableTripPlanLabels = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-trip-plan-labels.ts");
    const weatherSummary = readItineraryArchitectureSource("src/features/itinerary/domain/weather-summary.ts");
    const weatherChip = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-weather-chip.tsx");

    expect(tableUtils).not.toContain("TripDailyBriefing");
    expect(tableUtils).not.toContain("weather-briefings");
    expect(tableUtils).not.toContain("buildWeatherSummary");
    expect(tableUtils).not.toContain("buildWeatherTooltip");
    expect(tableUtils).toContain("@/src/features/itinerary/domain/itinerary-table-grouping");
    expect(tableUtils).toContain("./smart-itinerary-table-graph");
    expect(tableUtils).toContain("./smart-itinerary-table-labels");
    expect(tableUtils).toContain("./smart-itinerary-table-trip-plan-labels");
    expect(tableUtils).not.toContain("function mergeTripDayGroups");
    expect(tableUtils).not.toContain("function itemStatusLabel");
    expect(tableGrouping).toContain("export function mergeTripDayGroups");
    expect(tableGrouping).toContain("export function groupChildItemsByParent");
    expect(tableGraph).toContain("export function buildGraphColumnWidth");
    expect(tableLabels).toContain("export function itemStatusLabel");
    expect(tableLabels).toContain("export function formatSelectedPlanLabel");
    expect(tableTripPlanLabels).toContain("export function tripPlanStatus");
    expect(weatherSummary).toContain("export function buildWeatherSummary");
    expect(weatherSummary).toContain("export function buildWeatherTooltip");
    expect(weatherChip).toContain("@/src/features/itinerary/domain/weather-summary");
  });

  it("keeps smart itinerary path filter state split from table derived state", () => {
    const tableState = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/hooks/useSmartItineraryTableState.ts");
    const pathFilters = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/hooks/useSmartItineraryPathFilters.ts");

    expect(tableState).toContain("./useSmartItineraryPathFilters");
    expect(tableState).not.toContain("knownFilterIdsRef");
    expect(tableState).not.toContain("itineraryItemPathId");
    expect(pathFilters).toContain("export function useSmartItineraryPathFilters");
    expect(pathFilters).toContain("knownFilterIdsRef");
    expect(pathFilters).toContain("itineraryItemPathId");
  });

  it("keeps weather briefing drawer formatting split from render", () => {
    const drawer = readItineraryArchitectureSource("src/shared/components/weather/WeatherBriefingDrawer.tsx");
    const drawerModel = readItineraryArchitectureSource("src/shared/components/weather/model/weather-briefing-drawer-model.ts");

    expect(drawer).toContain("./model/weather-briefing-drawer-model");
    expect(drawer).not.toContain("function formatWeatherSummary");
    expect(drawer).not.toContain("function buildWeatherDetailLines");
    expect(drawer).not.toContain("function weatherDrawerCopy");
    expect(drawerModel).toContain("export function formatWeatherSummary");
    expect(drawerModel).toContain("export function buildWeatherDetailLines");
    expect(drawerModel).toContain("export function weatherDrawerCopy");
  });

  it("keeps StopDialog render split from form model state", () => {
    const stopDialog = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialog.tsx");
    const stopDialogFormFields = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialogFormFields.tsx");
    const stopDialogModel = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/use-stop-dialog-model.ts");
    const stopDialogTypes = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/stop-dialog.types.ts");

    expect(stopDialog).toContain("./use-stop-dialog-model");
    expect(stopDialog).toContain("./StopDialogFormFields");
    expect(stopDialog).not.toContain("useState");
    expect(stopDialog).not.toContain("interface StopDialogProps");
    expect(stopDialog).not.toContain("buildStopSubmitValues");
    expect(stopDialog).not.toContain("applyStopActivityInput");
    expect(stopDialog).not.toContain("StopDialogPrimaryFields");
    expect(stopDialogFormFields).toContain("export function StopDialogFormFields");
    expect(stopDialogFormFields).toContain("StopDialogPrimaryFields");
    expect(stopDialogFormFields).toContain("StopDialogPlaceResolution");
    expect(stopDialogModel).toContain("export function useStopDialogModel");
    expect(stopDialogModel).toContain("@/src/features/itinerary/domain/stop-form-model");
    expect(stopDialogModel).toContain("buildStopSubmitValues");
    expect(stopDialogModel).toContain("applyStopActivityInput");
    expect(stopDialogModel).not.toContain("./stop-dialog.form");
    expect(stopDialogTypes).toContain("export interface StopDialogProps");
  });

  it("keeps stop dialog detail serialization split from utility ids", () => {
    const stopDialogFieldIds = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/stop-dialog-field-ids.ts");
    const stopDialog = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialog.tsx");
    const stopDialogFormFields = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialogFormFields.tsx");
    const stopDetails = readItineraryArchitectureSource("src/features/itinerary/domain/stop-details.ts");
    const stopDetailDefinitions = readItineraryArchitectureSource("src/features/itinerary/domain/stop-detail-definitions.ts");

    expect(stopDialogFieldIds).toContain("export const stopDialogFieldIds");
    expect(stopDialogFieldIds).not.toContain("@/src/features/itinerary/domain/stop-details");
    expect(stopDialogFieldIds).not.toContain("buildStructuredStopDetails");
    expect(stopDialog).toContain("@/src/features/itinerary/domain/stop-details");
    expect(stopDialogFormFields).toContain("@/src/features/itinerary/domain/stop-details");
    expect(stopDetails).toContain("./stop-detail-definitions");
    expect(stopDetails).toContain("export function buildStructuredStopDetails");
    expect(stopDetails).toContain("function trimmedStopDetailValues");
    expect(stopDetails).not.toContain("export function stopDetailLabels");
    expect(stopDetails).not.toContain("export const emptyStopDetailValues");
    expect(stopDetailDefinitions).toContain("export function stopDetailLabels");
    expect(stopDetailDefinitions).toContain("export const emptyStopDetailValues");
  });

  it("keeps expenses page state split from page composition", () => {
    const expensesPage = readItineraryArchitectureSource("src/features/workspace/pages/expenses/TripExpensesPage.tsx");
    const expensesState = readItineraryArchitectureSource("src/features/workspace/pages/expenses/use-trip-expenses-page-state.ts");
    const expenseActions = readItineraryArchitectureSource("src/features/workspace/pages/expenses/model/expense-page-actions.ts");
    const expenseFilters = readItineraryArchitectureSource("src/features/workspace/pages/expenses/model/expense-page-filters.ts");
    const expenseLedgerActions = readItineraryArchitectureSource("src/features/workspace/pages/expenses/hooks/useExpenseLedgerActions.ts");
    const expenseDialog = readItineraryArchitectureSource("src/features/workspace/pages/expenses/ExpenseDialog.tsx");
    const expenseDialogState = readItineraryArchitectureSource("src/features/workspace/pages/expenses/hooks/useExpenseDialogState.ts");

    expect(expensesPage).toContain("./use-trip-expenses-page-state");
    expect(expensesPage).not.toContain("useState");
    expect(expensesPage).not.toContain("useMemo");
    expect(expensesPage).not.toContain("buildExpenseCsv");
    expect(expensesPage).not.toContain("refundSplits");
    expect(expensesPage).not.toContain("function recordRefund");
    expect(expensesState).toContain("./model/expense-page-filters");
    expect(expensesState).toContain("./model/expense-page-actions");
    expect(expensesState).toContain("./hooks/useExpenseLedgerActions");
    expect(expensesState).toContain("export function useTripExpensesPageState");
    expect(expensesState).not.toContain("buildExpenseCsv");
    expect(expensesState).not.toContain("function filterExpenses");
    expect(expensesState).not.toContain("refundSplits");
    expect(expensesState).not.toContain("sumShares");
    expect(expenseFilters).toContain("export function filterExpenses");
    expect(expenseFilters).toContain("export function expenseCategorySpend");
    expect(expenseFilters).toContain("export function inferredScopeExpenses");
    expect(expenseActions).toContain("export function buildSettlementExpenseInput");
    expect(expenseActions).toContain("export function buildRefundExpenseInput");
    expect(expenseActions).toContain("refundSplits");
    expect(expenseActions).toContain("sumShares");
    expect(expenseLedgerActions).toContain("export function useExpenseLedgerActions");
    expect(expenseLedgerActions).toContain("buildExpenseCsv");
    expect(expenseLedgerActions).toContain("buildPaybackReminder");
    expect(expensesState).toContain("function recordRefund");
    expect(expenseDialog).toContain("./hooks/useExpenseDialogState");
    expect(expenseDialog).not.toContain("useState");
    expect(expenseDialog).not.toContain("calculateExpenseDialogState");
    expect(expenseDialog).not.toContain("function submitExpense");
    expect(expenseDialogState).toContain("export function useExpenseDialogState");
    expect(expenseDialogState).toContain("useExpenseSplitEditor");
    expect(expenseDialogState).toContain("function submitExpense");
  });
});
