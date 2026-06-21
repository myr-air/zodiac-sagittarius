import type { StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import type { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
} from "./support/itinerary-story-fixtures";
import { expectItineraryResponsiveContract } from "./support/itinerary-story-assertions";

type ItineraryTemplatePlay = NonNullable<StoryObj<typeof SmartItineraryTable>["play"]>;

export const ownerPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: "Trip Plan controls" })).toBeEnabled();
  await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
  await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i }).length).toBeGreaterThan(0);
};

export const ownerThaiPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
  await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
  await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[520px]");
};

export const travelerPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: "Trip Plan controls" })).toBeEnabled();
  await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i }).length).toBeGreaterThan(0);
};

export const hierarchyBlocksPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: new RegExp(`Flight to Hong Kong on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
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
  await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
  await expect(canvas.getByRole("button", { name: new RegExp(`Dim Sum morning on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
};

export const planAExamplePlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: new RegExp(`Harbour breakfast on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} museum stop on ${pathNamePlanA}`) })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} cafe backup on ${pathNamePlanA}`) })).toBeInTheDocument();
};

export const planABAlternativesPlay: ItineraryTemplatePlay = async ({ canvas, canvasElement }) => {
  await expect(canvas.getByRole("button", { name: new RegExp(`Harbour breakfast on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} gallery route on ${pathNamePlanA}`) })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanB} harbour route on ${pathNamePlanB}`) })).toBeInTheDocument();
  await expect(canvasElement.querySelector(".data-row--path-overlap")).not.toBeInTheDocument();
};

export const requestedPlanExamplePlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNameMain} 08:00 block on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} 09:00 branch on ${pathNamePlanA}`) })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} 12:30 branch on ${pathNamePlanA}`) })).toBeInTheDocument();
  await expect(canvas.getByRole("button", { name: new RegExp(`${pathNameMain} 16:00 block on ${pathNameMain}`) })).toBeInTheDocument();
};

export const stressPathsPlay: ItineraryTemplatePlay = async ({ canvas }) => {
  await expect(canvas.getByRole("button", { name: new RegExp(`Harbour breakfast on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
  await expect(canvas.getByRole("button", { name: new RegExp(`Quiet park break on ${pathNamePlanC}`) })).toBeInTheDocument();
};
