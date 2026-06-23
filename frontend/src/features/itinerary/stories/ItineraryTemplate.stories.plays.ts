import { expect } from "storybook/test";
import type { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
} from "./support/itinerary-story-fixtures";
import {
  expectAddStopActionsAvailable,
  expectDayActivityPathGraph,
  expectItineraryResponsiveContract,
  expectPathGraphNode,
  expectSelectedPathGraphNode,
  expectTripPlanControlsEnabled,
} from "./support/itinerary-story-assertions";
import type { StoryPlay } from "./support/story-play-types";

type ItineraryTemplatePlay = StoryPlay<typeof SmartItineraryTable>;

export const ownerPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expectTripPlanControlsEnabled(canvas);
  await expectDayActivityPathGraph(canvas);
  await expectAddStopActionsAvailable(canvas);
};

export const ownerThaiPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
  await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
  await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[520px]");
};

export const travelerPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expectTripPlanControlsEnabled(canvas);
  await expectAddStopActionsAvailable(canvas);
};

export const hierarchyBlocksPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expectSelectedPathGraphNode(canvas, new RegExp(`Flight to Hong Kong on ${pathNameMain}`));
  await expect(canvas.queryByLabelText("Structure for Flight to Hong Kong")).toBeNull();
};

export const hierarchyWarningsPlay: ItineraryTemplatePlay = async ({ canvas, canvasElement }) => {
  await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
  await expect(canvas.queryByText("Parent block")).toBeNull();
  await expect(canvas.queryByRole("button", { name: /Fix structure/i })).toBeNull();
};

export const tableOverflowPlay: ItineraryTemplatePlay = async ({ canvasElement }) => {
  await expectItineraryResponsiveContract(canvasElement);
};

export const branchGraphPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expectDayActivityPathGraph(canvas);
  await expectSelectedPathGraphNode(canvas, new RegExp(`Dim Sum morning on ${pathNameMain}`));
};

export const planAExamplePlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expectSelectedPathGraphNode(canvas, new RegExp(`Harbour breakfast on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} museum stop on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} cafe backup on ${pathNamePlanA}`));
};

export const planABAlternativesPlay: ItineraryTemplatePlay = async ({ canvas, canvasElement }) => {
  await expectSelectedPathGraphNode(canvas, new RegExp(`Harbour breakfast on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} gallery route on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanB} harbour route on ${pathNamePlanB}`));
  await expect(canvasElement.querySelector(".data-row--path-overlap")).not.toBeInTheDocument();
};

export const requestedPlanExamplePlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expectSelectedPathGraphNode(canvas, new RegExp(`${pathNameMain} 08:00 block on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} 09:00 branch on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNamePlanA} 12:30 branch on ${pathNamePlanA}`));
  await expectPathGraphNode(canvas, new RegExp(`${pathNameMain} 16:00 block on ${pathNameMain}`));
};

export const stressPathsPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expectSelectedPathGraphNode(canvas, new RegExp(`Harbour breakfast on ${pathNameMain}`));
  await expectPathGraphNode(canvas, new RegExp(`Quiet park break on ${pathNamePlanC}`));
};
