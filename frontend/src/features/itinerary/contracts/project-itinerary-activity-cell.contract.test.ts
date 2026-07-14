import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary activity-cell architecture", () => {
  it("keeps ActivityCell split into render, model, meta, and typed props", () => {
    const dayGroupActivityRows = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/DayGroupActivityRows.tsx",
    );
    const activityCell = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCell.tsx",
    );
    const activityCellMeta = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellMeta.tsx",
    );
    const activityCellBody = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellBody.tsx",
    );
    const activityCellRails = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellRails.tsx",
    );
    const activityCellModel = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/use-activity-cell-model.ts",
    );
    const activityActionLabels = readItineraryArchitectureSource(
      "src/features/itinerary/domain/itinerary-activity-actions.ts",
    );
    const activityCellUiState = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell-ui-state.ts",
    );
    const activityCellTypes = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.types.ts",
    );

    expect(dayGroupActivityRows).toContain("./activity-cell/ActivityCell");
    expect(activityCell).toContain("./use-activity-cell-model");
    expect(activityCell).toContain("./ActivityCellBody");
    expect(activityCell).toContain("./ActivityCellRails");
    expect(activityCell).not.toContain("./ActivityCellMeta");
    expect(activityCell).not.toContain("./ActivityCellTitleLine");
    expect(activityCell).not.toContain("./ActivityTimeButton");
    expect(activityCell).not.toContain("./ActivityTypePicker");
    expect(activityCell).toContain("ActivityCellProps");
    expect(activityCell).not.toContain("useState");
    expect(activityCell).not.toContain("itemStatusLabel");
    expect(activityCellBody).toContain("export function ActivityCellBody");
    expect(activityCellBody).toContain("./ActivityCellMeta");
    expect(activityCellBody).toContain("./ActivityIdentityLine");
    expect(activityCellBody).toContain("./ActivityCellActionGroup");
    expect(activityCellRails).toContain("export function ActivityCellRails");
    expect(activityCellRails).toContain("./ActivityTimeButton");
    expect(activityCellRails).toContain("./ActivityTypePicker");
    expect(activityCellMeta).toContain("export function ActivityCellMeta");
    expect(activityCellModel).toContain("export function useActivityCellModel");
    expect(activityCellModel).toContain("@/src/features/itinerary/domain/itinerary-activity-actions");
    expect(activityCellModel).not.toContain('locale === "th"');
    expect(activityActionLabels).toContain("export function activityActionMenuLabel");
    expect(activityCellModel).toContain("initialActivityCellUiState");
    expect(activityCellModel).toContain("const [uiState, setUiState]");
    expect(activityCellModel).not.toContain("const [subActivityModalOpen, setSubActivityModalOpen]");
    expect(activityCellModel).not.toContain("const [subActivitiesExpanded, setSubActivitiesExpanded]");
    expect(activityCellModel).not.toContain("const [actionsExpanded, setActionsExpanded]");
    expect(activityCellUiState).toContain("export interface ActivityCellUiState");
    expect(activityCellUiState).toContain("initialActivityCellUiState");
    expect(activityCellTypes).toContain("export interface ActivityCellProps");
  });

  it("keeps activity time controls split into direct modules", () => {
    const activityCell = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCell.tsx",
    );
    const subActivityList = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityList.tsx",
    );
    const subActivityItem = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityItem.tsx",
    );
    const button = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityTimeButton.tsx",
    );
    const modal = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/TimeEditModal.tsx",
    );
    const hook = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/use-time-edit-modal-model.ts",
    );
    const actions = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/use-time-edit-modal-actions.ts",
    );
    const modalPortal = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalPortal.tsx",
    );
    const modalHeader = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalHeader.tsx",
    );
    const modalActions = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalActions.tsx",
    );
    const modalModel = readItineraryArchitectureSource(
      "src/features/itinerary/domain/time-edit-modal-model.ts",
    );
    const timeEditState = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/time-edit-modal-state.ts",
    );
    const types = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/time-components.types.ts",
    );

    expect(activityCell).toContain("./ActivityCellRails");
    expect(activityCell).not.toContain("./ActivityTimeButton");
    expect(activityCell).not.toContain("./ActivityTypePicker");
    expect(activityCell).not.toContain("TimeComponents");
    expect(subActivityList).toContain("./SubActivityItem");
    expect(subActivityList).not.toContain("./ActivityTimeButton");
    expect(subActivityItem).toContain("./ActivityTimeButton");
    expect(subActivityList).not.toContain("TimeComponents");
    expect(button).toContain("export function ActivityTimeButton");
    expect(button).not.toContain("createPortal");
    expect(modal).toContain("export function TimeEditModal");
    expect(modal).toContain("./ActivityCellModalActions");
    expect(modal).toContain("./ActivityCellModalHeader");
    expect(modal).toContain("./use-time-edit-modal-model");
    expect(modal).toContain("./ActivityCellModalPortal");
    expect(modal).not.toContain("createPortal");
    expect(modal).not.toContain("useState");
    expect(modal).not.toContain("endOffsetDaysBetweenTimes");
    expect(modal).not.toContain("@/src/shared/hooks/use-escape-to-close");
    expect(modal).not.toContain("Close time editor");
    expect(modal).not.toContain("next day end");
    expect(modal).not.toContain("Display preview");
    expect(modal).not.toContain('locale === "th"');
    expect(hook).toContain("export function useTimeEditModalModel");
    expect(hook).toContain("@/src/features/itinerary/domain/time-edit-modal-model");
    expect(hook).toContain("./time-edit-modal-state");
    expect(hook).toContain("./use-time-edit-modal-actions");
    expect(hook).toContain("const [state, setState]");
    expect(hook).toContain("const actions = useTimeEditModalActions");
    expect(hook).not.toContain("async function save");
    expect(hook).not.toContain("const [startTime, setStartTime]");
    expect(hook).not.toContain("const [endTime, setEndTime]");
    expect(hook).not.toContain("const [endOffsetDays, setEndOffsetDays]");
    expect(actions).toContain("export function useTimeEditModalActions");
    expect(actions).toContain("export function buildTimeEditModalSavePatch");
    expect(actions).toContain("async function save");
    expect(timeEditState).toContain("export interface TimeEditModalFormState");
    expect(timeEditState).toContain("initialTimeEditModalFormState");
    expect(timeEditState).toContain("endOffsetDaysBetweenTimes");
    expect(modal).not.toContain("formatDuration");
    expect(modal).not.toContain("parseTimeToMinutes");
    expect(modalModel).toContain("export function buildTimeEditModalModel");
    expect(modalModel).toContain("getMessages");
    expect(modalModel).toContain("row.timeEdit");
    expect(modalModel).toContain("nextDayEndLabel");
    expect(modalModel).toContain("formatDuration");
    expect(modalModel).toContain("parseTimeToMinutes");
    expect(types).toContain("export interface ActivityTimeButtonProps");
    expect(modalPortal).toContain("export function ActivityCellModalPortal");
    expect(modalPortal).toContain("createPortal");
    expect(modalPortal).toContain("@/src/shared/hooks/use-escape-to-close");
    expect(modalHeader).toContain("export function ActivityCellModalHeader");
    expect(modalHeader).toContain("subActivityModalCloseClassName");
    expect(modalActions).toContain("export function ActivityCellModalActions");
    expect(modalActions).toContain("saveIconName");
  });

  it("keeps smart itinerary styles split by table, header, and activity cell responsibility", () => {
    const tableStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table.styles.ts",
    );
    const tableLayoutStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-layout.styles.ts",
    );
    const dayGroupStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/day-group.styles.ts",
    );
    const headerStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-header.styles.ts",
    );
    const activityCellStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.styles.ts",
    );

    expect(tableStyles).toContain("./activity-cell/activity-cell.styles");
    expect(tableStyles).toContain("./smart-itinerary-table-header.styles");
    expect(tableStyles).toContain("./smart-itinerary-table-layout.styles");
    expect(tableStyles).toContain("./day-group.styles");
    expect(tableStyles).not.toContain("const tablePanelClassName");
    expect(tableStyles).not.toContain("const dayGroupClassName");
    expect(tableStyles).not.toContain("const headerControlsPanelClassName");
    expect(tableStyles).not.toContain("const pathFilterPanelClassName");
    expect(tableStyles).not.toContain("const activityCellClassName");
    expect(tableStyles).not.toContain("const timeEditModalClassName");
    expect(tableStyles).not.toContain("const ticketModalClassName");
    expect(headerStyles).toContain("export const headerControlsPanelClassName");
    expect(headerStyles).toContain("export const pathFilterPanelClassName");
    expect(tableLayoutStyles).toContain("export const tablePanelClassName");
    expect(tableLayoutStyles).toContain("export const smartTableClassName");
    expect(dayGroupStyles).toContain("export const dayGroupClassName");
    expect(dayGroupStyles).toContain("export const dayTitleInputClassName");
    expect(activityCellStyles).toContain("export const activityCellClassName");
    expect(activityCellStyles).toContain("export const timeEditModalClassName");
    expect(activityCellStyles).toContain("export const ticketModalClassName");
  });

  it("keeps sub-activity components split into direct modules", () => {
    const activityCell = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCell.tsx",
    );
    const overlays = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellOverlays.tsx",
    );
    const list = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityList.tsx",
    );
    const item = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityItem.tsx",
    );
    const modal = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/SubActivityModal.tsx",
    );
    const types = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/sub-activity.types.ts",
    );

    expect(activityCell).toContain("./ActivityCellOverlays");
    expect(activityCell).not.toContain("./SubActivityList");
    expect(activityCell).not.toContain("./SubActivityModal");
    expect(overlays).toContain("./SubActivityList");
    expect(overlays).toContain("./SubActivityModal");
    expect(activityCell).not.toContain("SubActivityComponents");
    expect(list).toContain("export function SubActivityList");
    expect(list).toContain("./SubActivityItem");
    expect(list).not.toContain("InlineActivityField");
    expect(list).not.toContain("ItineraryBookingButton");
    expect(item).toContain("export function SubActivityItem");
    expect(item).toContain("InlineActivityField");
    expect(item).toContain("ItineraryBookingButton");
    expect(modal).toContain("export function SubActivityModal");
    expect(modal).toContain("./ActivityCellModalHeader");
    expect(modal).toContain("./ActivityCellModalPortal");
    expect(modal).not.toContain("createPortal");
    expect(modal).not.toContain("@/src/shared/hooks/use-escape-to-close");
    expect(types).toContain("export interface SubActivitySharedProps");
  });
});
