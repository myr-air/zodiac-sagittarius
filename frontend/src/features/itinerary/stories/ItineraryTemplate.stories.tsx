import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  buildOwnerStoryArgs,
  branchGraphPathOptions,
  planABPathOptions,
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
  planAPathOptions,
  stressPathOptions,
} from "./itinerary-story-fixtures";
import {
  branchGraphItems,
  buildTemplateOverflowItems,
  hierarchyBlockItems,
  hierarchyWarningItems,
  planABAlternativeItems,
  planAExampleItems,
  requestedPlanExampleItems,
  stressPathItems,
} from "./ItineraryTemplate.stories.support";
import { expectItineraryResponsiveContract } from "./itinerary-story-assertions";

const meta = {
  title: "Templates/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: buildOwnerStoryArgs(),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Trip Plan controls" })).toBeEnabled();
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i }).length).toBeGreaterThan(0);
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
    await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[520px]");
  },
};

export const Viewer: Story = { args: { ...Owner.args, role: "viewer" } };
export const Traveler: Story = {
  args: { ...Owner.args, role: "traveler" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Trip Plan controls" })).toBeEnabled();
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i }).length).toBeGreaterThan(0);
  },
};
export const Dense: Story = { args: { ...Owner.args, items: buildDenseTripFixture().itineraryItems } };
export const HierarchyBlocks: Story = {
  args: {
    ...Owner.args,
    items: hierarchyBlockItems,
    graphItems: hierarchyBlockItems,
    selectedItemId: "story-flight-block",
    dayPathOverrides: {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: new RegExp(`Flight to Hong Kong on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.queryByLabelText("Structure for Flight to Hong Kong")).toBeNull();
  },
};

export const HierarchyWarnings: Story = {
  args: {
    ...Owner.args,
    items: hierarchyWarningItems,
    selectedItemId: "story-child-under-plain-parent",
    dayPathOverrides: {},
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector(".item-placeholder-cell")).toBeInTheDocument();
    await expect(canvas.queryByText("Parent block")).toBeNull();
    await expect(canvas.queryByRole("button", { name: /Fix structure/i })).toBeNull();
  },
};
export const TableOverflow: Story = {
  args: {
    ...Owner.args,
    items: buildTemplateOverflowItems(),
    graphItems: stressPathItems,
    selectedItemId: "overflow-stress-0800-main",
    showAllPaths: true,
  },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
  },
};
export const BranchGraph: Story = {
  args: {
    ...Owner.args,
    items: branchGraphItems,
    graphItems: branchGraphItems,
    selectedItemId: "story-graph-main",
    showAllPaths: true,
    pathOptions: branchGraphPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getByRole("button", { name: new RegExp(`Dim Sum morning on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
  },
};
export const PlanAExample: Story = {
  args: {
    ...Owner.args,
    items: planAExampleItems,
    graphItems: planAExampleItems,
    selectedItemId: "story-plan-a-main-breakfast",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: new RegExp(`Harbour breakfast on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} museum stop on ${pathNamePlanA}`) })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} cafe backup on ${pathNamePlanA}`) })).toBeInTheDocument();
  },
};
export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: planABAlternativeItems,
    graphItems: planABAlternativeItems,
    selectedItemId: "story-plan-ab-main-breakfast",
    showAllPaths: true,
    pathOptions: planABPathOptions,
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("button", { name: new RegExp(`Harbour breakfast on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} gallery route on ${pathNamePlanA}`) })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanB} harbour route on ${pathNamePlanB}`) })).toBeInTheDocument();
    await expect(canvasElement.querySelector(".data-row--path-overlap")).not.toBeInTheDocument();
  },
};
export const RequestedPlanExample: Story = {
  args: {
    ...Owner.args,
    items: requestedPlanExampleItems,
    graphItems: requestedPlanExampleItems,
    selectedItemId: "story-requested-main-0800",
    showAllPaths: true,
    pathOptions: planAPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNameMain} 08:00 block on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} 09:00 branch on ${pathNamePlanA}`) })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNamePlanA} 12:30 branch on ${pathNamePlanA}`) })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: new RegExp(`${pathNameMain} 16:00 block on ${pathNameMain}`) })).toBeInTheDocument();
  },
};
export const StressPaths: Story = {
  args: {
    ...Owner.args,
    items: stressPathItems,
    graphItems: stressPathItems,
    selectedItemId: "story-stress-0800-main",
    showAllPaths: true,
    pathOptions: stressPathOptions,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: new RegExp(`Harbour breakfast on ${pathNameMain}`) })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: new RegExp(`Quiet park break on ${pathNamePlanC}`) })).toBeInTheDocument();
  },
};
