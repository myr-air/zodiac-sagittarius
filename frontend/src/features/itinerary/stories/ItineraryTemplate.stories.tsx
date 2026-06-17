import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  buildOwnerStoryArgs,
  itineraryStoryDay,
  branchGraphItemsBase,
  branchGraphPathOptions,
  planAExampleItemsBase,
  planABAlternativeItemsBase,
  planABPathOptions,
  requestedPlanExampleItemsBase,
  stressPathItemsBase,
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
  planAPathOptions,
  stressPathOptions,
  withStoryPrefix,
} from "./itinerary-story-fixtures";

const branchGraphItems: ItineraryItem[] = withStoryPrefix(branchGraphItemsBase, "story");
const planAExampleItems: ItineraryItem[] = withStoryPrefix(planAExampleItemsBase, "story");
const planABAlternativeItems: ItineraryItem[] = withStoryPrefix(planABAlternativeItemsBase, "story");
const requestedPlanExampleItems: ItineraryItem[] = withStoryPrefix(requestedPlanExampleItemsBase, "story");
const stressPathItems: ItineraryItem[] = withStoryPrefix(stressPathItemsBase, "story");

const hierarchyBlockItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "story-flight-block",
    activity: "Flight to Hong Kong",
    activityType: "travel",
    itemKind: "travel",
    isPlanBlock: true,
    parentItemId: null,
    day: itineraryStoryDay,
    startTime: "04:00",
    endTime: "13:00",
    durationMinutes: 540,
    status: "confirmed",
    priority: "must",
    sortOrder: 100,
  },
  {
    ...tripFixture.planItems[1],
    id: "story-flight-checkin",
    activity: "Check in",
    activityType: "travel",
    itemKind: "preparation",
    parentItemId: "story-flight-block",
    day: itineraryStoryDay,
    startTime: "06:00",
    endTime: "06:45",
    durationMinutes: 45,
    status: "planned",
    priority: "normal",
    sortOrder: 200,
  },
  {
    ...tripFixture.planItems[2],
    id: "story-flight-immigration",
    activity: "Immigration",
    activityType: "travel",
    itemKind: "preparation",
    parentItemId: "story-flight-block",
    day: itineraryStoryDay,
    startTime: "11:15",
    endTime: "12:15",
    durationMinutes: 60,
    status: "planned",
    priority: "high",
    sortOrder: 300,
  },
];

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
    items: [
      {
        ...tripFixture.planItems[0],
        id: "story-plain-parent",
        activity: "Plain parent",
        isPlanBlock: false,
        parentItemId: null,
        day: itineraryStoryDay,
        startTime: "09:00",
        endTime: "10:00",
        durationMinutes: 60,
        sortOrder: 100,
      },
      {
        ...tripFixture.planItems[1],
        id: "story-child-under-plain-parent",
        activity: "Child under plain parent",
        parentItemId: "story-plain-parent",
        day: itineraryStoryDay,
        startTime: "09:15",
        endTime: "09:45",
        durationMinutes: 30,
        sortOrder: 200,
      },
      {
        ...tripFixture.planItems[2],
        id: "story-window-block",
        activity: "Window block",
        isPlanBlock: true,
        parentItemId: null,
        day: itineraryStoryDay,
        startTime: "10:00",
        endTime: "11:00",
        durationMinutes: 60,
        sortOrder: 300,
      },
      {
        ...tripFixture.planItems[3],
        id: "story-child-outside-window",
        activity: "Child outside window",
        parentItemId: "story-window-block",
        day: itineraryStoryDay,
        startTime: "09:30",
        endTime: "11:30",
        durationMinutes: 120,
        sortOrder: 400,
      },
    ],
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
    items: stressPathItems.map((item, index) => ({
      ...item,
      id: `overflow-${item.id}`,
      activity: `${item.activity} with long operational copy for table overflow validation ${index + 1}`,
      place: `${item.place} · gate notes, booking reference, and meet-up details`,
      transport: "Airport Express transfer with luggage coordination",
    })),
    graphItems: stressPathItems,
    selectedItemId: "overflow-stress-0800-main",
    showAllPaths: true,
  },
  parameters: {
    viewport: { defaultViewport: "mobile320" },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".table-scroll")).toHaveClass("table-scroll", "overflow-x-auto", "max-w-full");
    await expect(canvasElement.querySelector(".smart-table")).toHaveClass("smart-table", "min-w-[520px]");
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
