import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary architecture contracts", () => {
  it("keeps ActivityCell split into render, model, meta, and typed props", () => {
    const activityCell = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell.tsx");
    const activityCellMeta = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellMeta.tsx");
    const activityCellModel = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-activity-cell-model.ts");
    const activityCellTypes = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.types.ts");

    expect(activityCell).toContain("./activity-cell/use-activity-cell-model");
    expect(activityCell).toContain("./activity-cell/ActivityCellMeta");
    expect(activityCell).toContain("ActivityCellProps");
    expect(activityCell).not.toContain("useState");
    expect(activityCell).not.toContain("itemStatusLabel");
    expect(activityCellMeta).toContain("export function ActivityCellMeta");
    expect(activityCellModel).toContain("export function useActivityCellModel");
    expect(activityCellTypes).toContain("export interface ActivityCellProps");
  });

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

    expect(controls).toContain("./use-trip-plan-controls-state");
    expect(controls).not.toContain("useState");
    expect(controls).not.toContain("function submitNewTripPlan");
    expect(controls).not.toContain("tripPlanStatus(");
    expect(controlsState).toContain("export function useTripPlanControlsState");
    expect(controlsState).toContain("function submitNewTripPlan");
    expect(controlsState).toContain("tripPlanStatus(");
  });

  it("keeps inline option picker menu rendering split from trigger state", () => {
    const picker = readItineraryArchitectureSource("src/features/itinerary/components/inline-option-picker.tsx");
    const pickerMenu = readItineraryArchitectureSource("src/features/itinerary/components/inline-option-picker-menu.tsx");

    expect(picker).toContain("./inline-option-picker-menu");
    expect(picker).not.toContain("createPortal");
    expect(picker).not.toContain("floatingOptionMenuClassName");
    expect(picker).not.toContain("sideMenuFloatingLeft");
    expect(pickerMenu).toContain("export function InlineOptionPickerMenu");
    expect(pickerMenu).toContain("createPortal");
    expect(pickerMenu).toContain("sideMenuFloatingLeft");
  });

  it("keeps itinerary ticket modal form state split from modal render", () => {
    const ticketModal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModal.tsx");
    const bookingButton = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryBookingButton.tsx");
    const exports = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/components.tsx");
    const ticketFooter = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalFooter.tsx");
    const ticketSections = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ItineraryTicketModalSections.tsx");
    const ticketModel = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/use-itinerary-ticket-modal-model.ts");

    expect(ticketModal).toContain("./use-itinerary-ticket-modal-model");
    expect(bookingButton).toContain("export function ItineraryBookingButton");
    expect(bookingButton).toContain("./ItineraryTicketModal");
    expect(exports).toContain("./activity-cell/ItineraryBookingButton");
    expect(exports).toContain("./activity-cell/ItineraryTicketModal");
    expect(exports).not.toContain("BookingComponents");
    expect(ticketModal).toContain("./ItineraryTicketModalFooter");
    expect(ticketModal).toContain("./ItineraryTicketModalSections");
    expect(ticketModal).not.toContain("useState");
    expect(ticketModal).not.toContain("buildTicketSubmitInput");
    expect(ticketModal).not.toContain("formatBookingSummary");
    expect(ticketModal).not.toContain("DateTimePickerField");
    expect(ticketFooter).toContain("export function ItineraryTicketModalFooter");
    expect(ticketSections).toContain("export function TicketModeToggle");
    expect(ticketSections).toContain("export function TicketFieldGrid");
    expect(ticketSections).toContain("export function LinkedActivitiesPicker");
    expect(ticketModel).toContain("export function useItineraryTicketModalModel");
    expect(ticketModel).toContain("buildTicketSubmitInput");
  });

  it("keeps activity time controls split into direct modules", () => {
    const activityCell = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell.tsx");
    const subActivityList = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityList.tsx");
    const exports = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/components.tsx");
    const button = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityTimeButton.tsx");
    const modal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/TimeEditModal.tsx");
    const types = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/time-components.types.ts");

    expect(activityCell).toContain("./activity-cell/ActivityTimeButton");
    expect(activityCell).not.toContain("TimeComponents");
    expect(subActivityList).toContain("./ActivityTimeButton");
    expect(subActivityList).not.toContain("TimeComponents");
    expect(exports).toContain("./activity-cell/ActivityTimeButton");
    expect(exports).toContain("./activity-cell/TimeEditModal");
    expect(exports).not.toContain("TimeComponents");
    expect(button).toContain("export function ActivityTimeButton");
    expect(button).not.toContain("createPortal");
    expect(modal).toContain("export function TimeEditModal");
    expect(types).toContain("export interface ActivityTimeButtonProps");
  });

  it("keeps activity-cell styles split from table-level styles", () => {
    const tableStyles = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table.styles.ts");
    const activityCellStyles = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.styles.ts");

    expect(tableStyles).toContain("./activity-cell/activity-cell.styles");
    expect(tableStyles).not.toContain("const activityCellClassName");
    expect(tableStyles).not.toContain("const timeEditModalClassName");
    expect(tableStyles).not.toContain("const ticketModalClassName");
    expect(activityCellStyles).toContain("export const activityCellClassName");
    expect(activityCellStyles).toContain("export const timeEditModalClassName");
    expect(activityCellStyles).toContain("export const ticketModalClassName");
  });

  it("keeps sub-activity components split into direct modules", () => {
    const activityCell = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell.tsx");
    const exports = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/components.tsx");
    const list = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityList.tsx");
    const modal = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityModal.tsx");
    const types = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/activity-cell/sub-activity.types.ts");

    expect(activityCell).toContain("./activity-cell/SubActivityList");
    expect(activityCell).toContain("./activity-cell/SubActivityModal");
    expect(activityCell).not.toContain("SubActivityComponents");
    expect(exports).toContain("./activity-cell/SubActivityList");
    expect(exports).toContain("./activity-cell/SubActivityModal");
    expect(exports).not.toContain("SubActivityComponents");
    expect(list).toContain("export function SubActivityList");
    expect(modal).toContain("export function SubActivityModal");
    expect(types).toContain("export interface SubActivitySharedProps");
  });

  it("keeps itinerary table weather formatting split from path utilities", () => {
    const tableUtils = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-utils.ts");
    const weatherSummary = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/weather-summary.ts");
    const weatherChip = readItineraryArchitectureSource("src/features/itinerary/components/smart-itinerary-table/day-weather-chip.tsx");

    expect(tableUtils).not.toContain("TripDailyBriefing");
    expect(tableUtils).not.toContain("weather-briefings");
    expect(tableUtils).not.toContain("buildWeatherSummary");
    expect(tableUtils).not.toContain("buildWeatherTooltip");
    expect(weatherSummary).toContain("export function buildWeatherSummary");
    expect(weatherSummary).toContain("export function buildWeatherTooltip");
    expect(weatherChip).toContain("./weather-summary");
  });

  it("keeps weather briefing drawer formatting split from render", () => {
    const drawer = readItineraryArchitectureSource("src/shared/components/weather/WeatherBriefingDrawer.tsx");
    const drawerModel = readItineraryArchitectureSource("src/shared/components/weather/weather-briefing-drawer-model.ts");

    expect(drawer).toContain("./weather-briefing-drawer-model");
    expect(drawer).not.toContain("function formatWeatherSummary");
    expect(drawer).not.toContain("function buildWeatherDetailLines");
    expect(drawer).not.toContain("function weatherDrawerCopy");
    expect(drawerModel).toContain("export function formatWeatherSummary");
    expect(drawerModel).toContain("export function buildWeatherDetailLines");
    expect(drawerModel).toContain("export function weatherDrawerCopy");
  });

  it("keeps StopDialog render split from form model state", () => {
    const stopDialog = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/StopDialog.tsx");
    const stopDialogModel = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/use-stop-dialog-model.ts");

    expect(stopDialog).toContain("./use-stop-dialog-model");
    expect(stopDialog).not.toContain("useState");
    expect(stopDialog).not.toContain("buildStopSubmitValues");
    expect(stopDialog).not.toContain("applyStopActivityInput");
    expect(stopDialogModel).toContain("export function useStopDialogModel");
    expect(stopDialogModel).toContain("buildStopSubmitValues");
    expect(stopDialogModel).toContain("applyStopActivityInput");
  });

  it("keeps stop dialog detail serialization split from utility ids", () => {
    const stopDialogUtils = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/stop-dialog.utils.ts");
    const stopDialogDetails = readItineraryArchitectureSource("src/features/itinerary/components/stop-dialog/stop-dialog-details.ts");

    expect(stopDialogUtils).toContain("./stop-dialog-details");
    expect(stopDialogUtils).toContain("export const stopDialogFieldIds");
    expect(stopDialogUtils).not.toContain("export function buildStructuredStopDetails");
    expect(stopDialogUtils).not.toContain("function trimmedStopDetailValues");
    expect(stopDialogDetails).toContain("export function buildStructuredStopDetails");
    expect(stopDialogDetails).toContain("function trimmedStopDetailValues");
  });

  it("keeps overview role panels split by reusable panel responsibility", () => {
    const managerRolePanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/ManagerOverviewPanels.tsx");
    const travelerRolePanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/TravelerOverviewPanels.tsx");
    const viewerRolePanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/ViewerOverviewPanels.tsx");
    const managerChecklist = readItineraryArchitectureSource("src/features/itinerary/components/overview/ManagerChecklistPanel.tsx");
    const snapshotPanels = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewSnapshotPanels.tsx");
    const rolePanelTypes = readItineraryArchitectureSource("src/features/itinerary/components/overview/overview-role-panels.types.ts");

    expect(managerRolePanels).toContain("./ManagerChecklistPanel");
    expect(managerRolePanels).toContain("./overview-role-panels.types");
    expect(travelerRolePanels).toContain("./TravelerChecklistPanel");
    expect(travelerRolePanels).toContain("./OverviewSnapshotPanels");
    expect(viewerRolePanels).toContain("./OverviewSnapshotPanels");
    expect(managerRolePanels).not.toContain("SegmentedControl");
    expect(travelerRolePanels).not.toContain("interface TravelerOverviewPanelsProps");
    expect(viewerRolePanels).not.toContain("interface ViewerOverviewPanelsProps");
    expect(managerChecklist).toContain("export function ManagerTaskChecklistPanel");
    expect(snapshotPanels).toContain("export function OverviewHighlightsPanel");
    expect(rolePanelTypes).toContain("export interface ManagerOverviewPanelsProps");
  });

  it("keeps overview cockpit cards split from shared overview sections", () => {
    const overviewSections = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewSections.tsx");
    const cockpit = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewCockpit.tsx");
    const cockpitCard = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewCockpitCard.tsx");
    const overviewBarrel = readItineraryArchitectureSource("src/features/itinerary/components/overview/index.ts");

    expect(cockpit).toContain("./OverviewCockpitCard");
    expect(overviewBarrel).toContain('export { CockpitCard } from "./OverviewCockpitCard"');
    expect(overviewSections).not.toContain("export function CockpitCard");
    expect(overviewSections).not.toContain("cockpitCardButtonClassName");
    expect(cockpitCard).toContain("export function CockpitCard");
    expect(cockpitCard).toContain("cockpitCardButtonClassName");
  });

  it("keeps overview task state split from page composition", () => {
    const overviewPage = readItineraryArchitectureSource("src/features/itinerary/components/overview/OverviewPage.tsx");
    const overviewTaskState = readItineraryArchitectureSource("src/features/itinerary/components/overview/use-overview-task-state.ts");

    expect(overviewPage).toContain("./use-overview-task-state");
    expect(overviewPage).not.toContain("useState");
    expect(overviewPage).not.toContain("useMemo");
    expect(overviewPage).not.toContain("function submitTask");
    expect(overviewPage).not.toContain("isMyTask");
    expect(overviewTaskState).toContain("export function useOverviewTaskState");
    expect(overviewTaskState).toContain("function submitTask");
    expect(overviewTaskState).toContain("isMyTask");
    expect(overviewTaskState).toContain("myOpenTasks");
    expect(overviewTaskState).toContain("sharedOpenTasks");
  });

  it("keeps expenses page state split from page composition", () => {
    const expensesPage = readItineraryArchitectureSource("src/features/workspace/pages/expenses/TripExpensesPage.tsx");
    const expensesState = readItineraryArchitectureSource("src/features/workspace/pages/expenses/use-trip-expenses-page-state.ts");
    const expenseDialog = readItineraryArchitectureSource("src/features/workspace/pages/expenses/ExpenseDialog.tsx");
    const expenseDialogState = readItineraryArchitectureSource("src/features/workspace/pages/expenses/hooks/useExpenseDialogState.ts");

    expect(expensesPage).toContain("./use-trip-expenses-page-state");
    expect(expensesPage).not.toContain("useState");
    expect(expensesPage).not.toContain("useMemo");
    expect(expensesPage).not.toContain("buildExpenseCsv");
    expect(expensesPage).not.toContain("refundSplits");
    expect(expensesPage).not.toContain("function recordRefund");
    expect(expensesState).toContain("export function useTripExpensesPageState");
    expect(expensesState).toContain("buildExpenseCsv");
    expect(expensesState).toContain("refundSplits");
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
