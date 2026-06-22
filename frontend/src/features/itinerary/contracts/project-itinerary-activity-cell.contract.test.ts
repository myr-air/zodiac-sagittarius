import { describe, expect, it } from "vitest";
import { readItineraryArchitectureSource } from "./project-itinerary-architecture.test-support";

describe("Sagittarius itinerary activity-cell architecture", () => {
  it("keeps ActivityCell split into render, model, meta, and typed props", () => {
    const activityCellBarrel = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell.ts",
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
    const activityCellModel = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/use-activity-cell-model.ts",
    );
    const activityCellTypes = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.types.ts",
    );

    expect(activityCellBarrel).toContain("./activity-cell/ActivityCell");
    expect(activityCell).toContain("./use-activity-cell-model");
    expect(activityCell).toContain("./ActivityCellBody");
    expect(activityCell).not.toContain("./ActivityCellMeta");
    expect(activityCell).not.toContain("./ActivityCellTitleLine");
    expect(activityCell).toContain("ActivityCellProps");
    expect(activityCell).not.toContain("useState");
    expect(activityCell).not.toContain("itemStatusLabel");
    expect(activityCellBody).toContain("export function ActivityCellBody");
    expect(activityCellBody).toContain("./ActivityCellMeta");
    expect(activityCellBody).toContain("./ActivityCellTitleLine");
    expect(activityCellBody).toContain("./ActivityCellActionGroup");
    expect(activityCellMeta).toContain("export function ActivityCellMeta");
    expect(activityCellModel).toContain("export function useActivityCellModel");
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
    const exports = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/components.tsx",
    );
    const button = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityTimeButton.tsx",
    );
    const modal = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/TimeEditModal.tsx",
    );
    const modalPortal = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/ActivityCellModalPortal.tsx",
    );
    const modalModel = readItineraryArchitectureSource(
      "src/features/itinerary/domain/time-edit-modal-model.ts",
    );
    const types = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/time-components.types.ts",
    );

    expect(activityCell).toContain("./ActivityTimeButton");
    expect(activityCell).not.toContain("TimeComponents");
    expect(subActivityList).toContain("./SubActivityItem");
    expect(subActivityList).not.toContain("./ActivityTimeButton");
    expect(subActivityItem).toContain("./ActivityTimeButton");
    expect(subActivityList).not.toContain("TimeComponents");
    expect(exports).toContain("./activity-cell/ActivityTimeButton");
    expect(exports).toContain("./activity-cell/TimeEditModal");
    expect(exports).not.toContain("TimeComponents");
    expect(button).toContain("export function ActivityTimeButton");
    expect(button).not.toContain("createPortal");
    expect(modal).toContain("export function TimeEditModal");
    expect(modal).toContain("./ActivityCellModalPortal");
    expect(modal).not.toContain("createPortal");
    expect(modal).not.toContain("@/src/shared/hooks/use-escape-to-close");
    expect(modal).toContain("@/src/features/itinerary/domain/time-edit-modal-model");
    expect(modal).not.toContain("formatDuration");
    expect(modal).not.toContain("parseTimeToMinutes");
    expect(modalModel).toContain("export function buildTimeEditModalModel");
    expect(modalModel).toContain("formatDuration");
    expect(modalModel).toContain("parseTimeToMinutes");
    expect(types).toContain("export interface ActivityTimeButtonProps");
    expect(modalPortal).toContain("export function ActivityCellModalPortal");
    expect(modalPortal).toContain("createPortal");
    expect(modalPortal).toContain("@/src/shared/hooks/use-escape-to-close");
  });

  it("keeps smart itinerary styles split by table, header, and activity cell responsibility", () => {
    const tableStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table.styles.ts",
    );
    const headerStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/smart-itinerary-table-header.styles.ts",
    );
    const activityCellStyles = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/activity-cell/activity-cell.styles.ts",
    );

    expect(tableStyles).toContain("./activity-cell/activity-cell.styles");
    expect(tableStyles).toContain("./smart-itinerary-table-header.styles");
    expect(tableStyles).not.toContain("const headerControlsPanelClassName");
    expect(tableStyles).not.toContain("const pathFilterPanelClassName");
    expect(tableStyles).not.toContain("const activityCellClassName");
    expect(tableStyles).not.toContain("const timeEditModalClassName");
    expect(tableStyles).not.toContain("const ticketModalClassName");
    expect(headerStyles).toContain("export const headerControlsPanelClassName");
    expect(headerStyles).toContain("export const pathFilterPanelClassName");
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
    const exports = readItineraryArchitectureSource(
      "src/features/itinerary/components/smart-itinerary-table/components.tsx",
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
    expect(exports).toContain("./activity-cell/SubActivityList");
    expect(exports).toContain("./activity-cell/SubActivityModal");
    expect(exports).not.toContain("SubActivityComponents");
    expect(list).toContain("export function SubActivityList");
    expect(list).toContain("./SubActivityItem");
    expect(list).not.toContain("InlineActivityField");
    expect(list).not.toContain("ItineraryBookingButton");
    expect(item).toContain("export function SubActivityItem");
    expect(item).toContain("InlineActivityField");
    expect(item).toContain("ItineraryBookingButton");
    expect(modal).toContain("export function SubActivityModal");
    expect(modal).toContain("./ActivityCellModalPortal");
    expect(modal).not.toContain("createPortal");
    expect(modal).not.toContain("@/src/shared/hooks/use-escape-to-close");
    expect(types).toContain("export interface SubActivitySharedProps");
  });
});
