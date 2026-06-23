import { expect, userEvent, within } from "storybook/test";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import { pathIdStoryPlanA, pathIdStoryPlanB } from "@/src/features/itinerary/testing";
import {
  itineraryStoryDay,
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
} from "./support/itinerary-story-fixtures";
import {
  onStoryChangeDayPath,
  onStoryInlineQuickEdit,
  onStoryMoveItemToPath,
  onStoryToggleShowAllPaths,
} from "./ItineraryPage.stories.support";
import {
  expectAddStopActionsAvailable,
  expectDayActivityPathGraph,
  expectItineraryResponsiveContract,
  expectPathGraphNode,
  expectSelectedPathGraphNode,
  expectTripPlanControlsEnabled,
  getTripPlanControlsButton,
} from "./support/itinerary-story-assertions";
import type { StoryPlay } from "./support/story-play-types";

type ItineraryPagePlay = StoryPlay<typeof SmartItineraryTable>;

export const ownerPlay: ItineraryPagePlay = async ({ canvas, canvasElement }) => {
  await expectItineraryResponsiveContract(canvasElement);
  await expectTripPlanControlsEnabled(canvas);
  await expect(canvas.queryByRole("button", { name: /^Import$/i })).toBeNull();
  await expect(canvas.queryByRole("button", { name: /^Export$/i })).toBeNull();
  await expectAddStopActionsAvailable(canvas);
  await expect(canvas.queryAllByRole("button", { name: /Edit Dim Dim Sum/i })).toHaveLength(0);
};

export const inlineQuickEditPlay: ItineraryPagePlay = async ({ canvas, canvasElement }) => {
  onStoryInlineQuickEdit.mockClear();
  await expectItineraryResponsiveContract(canvasElement);
  await expect(canvas.getByRole("textbox", { name: /Edit activity Dim Dim Sum/i })).toHaveValue(
    "Dim Dim Sum ที่ Tim Ho Wan",
  );
  await expect(onStoryInlineQuickEdit).not.toHaveBeenCalled();
};

export const ownerThaiPlay: ItineraryPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
  await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
  await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[520px]");
};

export const viewerPlay: ItineraryPagePlay = async ({ canvas }) => {
  await expect(canvas.getByText(/Editing requires organizer access/i)).toBeVisible();
  await expect(canvas.queryByRole("button", { name: /^Import$/i })).toBeNull();
  await expect(canvas.queryByRole("button", { name: /^Export$/i })).toBeNull();
  await expect(canvas.queryByRole("button", { name: /Add stop or activity/i })).toBeNull();
  await expect(canvas.queryByRole("button", { name: /Edit Dim Dim Sum/i })).toBeNull();
};

export const travelerPlay: ItineraryPagePlay = async ({ canvas }) => {
  await expect(canvas.queryByText(/Editing requires organizer access/i)).toBeNull();
  await expectTripPlanControlsEnabled(canvas);
  await expectAddStopActionsAvailable(canvas);
  await expect(canvas.queryAllByRole("button", { name: /Edit Dim Dim Sum/i })).toHaveLength(0);
};

export const overlapConflictWarningPlay: ItineraryPagePlay = async ({ canvas, canvasElement }) => {
  await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
  await expect(canvas.queryByRole("button", { name: /Auto fix overlaps/i })).toBeNull();
};

export const planAExamplePlay: ItineraryPagePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /Itinerary table/i })).toHaveClass("table-panel", "grid");
  await expectDayActivityPathGraph(canvas);
  await expectSelectedPathGraphNode(canvas, new RegExp(`Harbour breakfast on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} museum stop on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} cafe backup on ${pathNamePlanA}`));
};

export const planABAlternativesPlay: ItineraryPagePlay = async ({ canvas, canvasElement }) => {
  await expectDayActivityPathGraph(canvas);
  await expectSelectedPathGraphNode(canvas, new RegExp(`Harbour breakfast on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} gallery route on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanB} harbour route on ${pathNamePlanB}`));
  await expect(canvasElement.querySelector(".data-row--path-overlap")).not.toBeInTheDocument();
};

export const pathAndDurationInteractionsPlay: ItineraryPagePlay = async ({ canvas, canvasElement }) => {
  const documentCanvas = within(canvasElement.ownerDocument.body);
  const dayToggle = canvas.getByRole("button", { name: /Collapse Day 2/i });
  await userEvent.click(dayToggle);
  await expect(dayToggle).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(dayToggle);
  await expect(dayToggle).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(canvas.getByRole("button", { name: /Path for Day 2/i }));
  const dayPathMenu = documentCanvas.getByRole("listbox", { name: /Path for Day 2/i });
  await userEvent.click(within(dayPathMenu).getByRole("option", { name: pathNamePlanB }));
  await expect(onStoryChangeDayPath).toHaveBeenCalledWith(itineraryStoryDay, pathIdStoryPlanB);

  await userEvent.click(getTripPlanControlsButton(canvas));
  await userEvent.click(canvas.getByRole("checkbox", { name: /Show all paths/i }));
  await expect(onStoryToggleShowAllPaths).toHaveBeenCalledWith(true);

  await userEvent.selectOptions(canvas.getByRole("combobox", { name: /Move Harbour breakfast to path/i }), pathIdStoryPlanA);
  await expect(onStoryMoveItemToPath).toHaveBeenCalledWith("page-plan-ab-main-breakfast", pathIdStoryPlanA);

  await expect(canvas.queryByRole("button", { name: /Edit duration Harbour breakfast/i })).not.toBeInTheDocument();
};

export const branchGraphPlay: ItineraryPagePlay = async ({ canvas }) => {
  await expectDayActivityPathGraph(canvas);
  await expectSelectedPathGraphNode(canvas, new RegExp(`Dim Sum morning on ${pathNameMain}`));
  await expectPathGraphNode(canvas, /Rain museum on Rain plan/i);
  await expectPathGraphNode(canvas, new RegExp(`Late coffee on ${pathNamePlanA}`));
};

export const requestedPlanExamplePlay: ItineraryPagePlay = async ({ canvas }) => {
  await expectSelectedPathGraphNode(canvas, new RegExp(`${pathNameMain} 08:00 block on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} 09:00 branch on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} 12:30 branch on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNameMain} 16:00 block on ${pathNameMain}`));
};

export const stressPathsPlay: ItineraryPagePlay = async ({ canvas }) => {
  await expectSelectedPathGraphNode(canvas, new RegExp(`Harbour breakfast on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`Taxi direct route on ${pathNamePlanC}`));
};

export const tableOverflowPlay: ItineraryPagePlay = async ({ canvasElement }) => {
  await expectItineraryResponsiveContract(canvasElement);
  await expect(canvasElement.querySelector(".activity-path-graph")).toBeInTheDocument();
};

export const responsivePlay: ItineraryPagePlay = async ({ canvasElement }) => {
  await expectItineraryResponsiveContract(canvasElement);
};

export const mobilePlay: ItineraryPagePlay = async ({ canvasElement }) => {
  await expectItineraryResponsiveContract(canvasElement);
  await expect(canvasElement.querySelector(".mobile-itinerary-inspector")).toBeNull();
};

export const mobileInspectorQuickEditPlay: ItineraryPagePlay = async ({ canvasElement }) => {
  onStoryInlineQuickEdit.mockClear();
  await expectItineraryResponsiveContract(canvasElement);
  await expect(canvasElement.querySelector(".mobile-itinerary-inspector")).toBeNull();
  await expect(onStoryInlineQuickEdit).not.toHaveBeenCalled();
};
