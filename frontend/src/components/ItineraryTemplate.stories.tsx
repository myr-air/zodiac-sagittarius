import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { SmartItineraryTable } from "./SmartItineraryTable";

const noop = () => {};
const branchGraphItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "story-graph-main",
    day: "2026-06-19",
    startTime: "08:00",
    durationMinutes: 45,
    sortOrder: 100,
    activity: "Dim Sum morning",
    pathGroupId: "story-path-group-morning",
    pathRole: "main",
  },
  {
    ...tripFixture.planItems[1],
    id: "story-graph-rain",
    day: "2026-06-19",
    startTime: "08:20",
    durationMinutes: 80,
    sortOrder: 200,
    activity: "Rain museum",
    pathGroupId: "story-path-group-morning",
    pathId: "path-rain",
    pathName: "Rain plan",
    pathRole: "alternative",
  },
  {
    ...tripFixture.planItems[2],
    id: "story-graph-late",
    day: "2026-06-19",
    startTime: "09:45",
    durationMinutes: 45,
    sortOrder: 300,
    activity: "Late coffee",
    pathGroupId: "story-path-group-morning",
    pathId: "path-2026-06-19-sub-a",
    pathName: "Plan A",
    pathRole: "alternative",
  },
  {
    ...tripFixture.planItems[3],
    id: "story-graph-lunch",
    day: "2026-06-19",
    startTime: "11:15",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Central lunch",
    pathRole: "main",
  },
];
const planAExampleItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "story-plan-a-main-breakfast",
    day: "2026-06-19",
    startTime: "08:00",
    durationMinutes: 75,
    sortOrder: 100,
    activity: "Harbour breakfast",
    place: "Main checkpoint",
    pathRole: "main",
  },
  {
    ...tripFixture.planItems[1],
    id: "story-plan-a-museum",
    day: "2026-06-19",
    startTime: "08:15",
    durationMinutes: 60,
    sortOrder: 200,
    activity: "Plan A museum stop",
    place: "Plan A checkpoint",
    pathId: "path-2026-06-19-sub-a",
    pathName: "Plan A",
    pathRole: "alternative",
  },
  {
    ...tripFixture.planItems[2],
    id: "story-plan-a-cafe",
    day: "2026-06-19",
    startTime: "09:45",
    durationMinutes: 45,
    sortOrder: 300,
    activity: "Plan A cafe backup",
    place: "Plan A checkpoint",
    pathId: "path-2026-06-19-sub-a",
    pathName: "Plan A",
    pathRole: "alternative",
  },
  {
    ...tripFixture.planItems[3],
    id: "story-plan-a-main-lunch",
    day: "2026-06-19",
    startTime: "11:00",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Main lunch",
    place: "Main checkpoint",
    pathRole: "main",
  },
];
const planABAlternativeItems: ItineraryItem[] = [
  ["story-plan-ab-main-breakfast", "08:00", 60, 100, "Harbour breakfast", "Main", undefined, "main"],
  ["story-plan-ab-a-gallery", "10:00", 75, 200, "Plan A gallery route", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["story-plan-ab-b-harbour", "14:00", 90, 300, "Plan B harbour route", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["story-plan-ab-main-dinner", "18:00", 75, 400, "Main dinner meet-up", "Main", undefined, "main"],
].map(([id, startTime, durationMinutes, sortOrder, activity, pathName, pathId, pathRole]) => ({
  ...tripFixture.planItems[0],
  id: id as string,
  day: "2026-06-19",
  startTime: startTime as string,
  durationMinutes: durationMinutes as number,
  sortOrder: sortOrder as number,
  activity: activity as string,
  activityType: "experience",
  place: `${pathName} checkpoint`,
  pathGroupId: "story-plan-ab-clean-branch",
  pathId: pathId as string | undefined,
  pathName: pathId ? pathName as string : undefined,
  pathRole: pathRole as ItineraryItem["pathRole"],
}));
const requestedPlanExampleItems: ItineraryItem[] = [
  ["requested-main-0800", "08:00", 60, 100, "Main 08:00 block", undefined, undefined, "main"],
  ["requested-main-0900", "09:00", 120, 200, "Main 09:00 block", undefined, undefined, "main"],
  ["requested-plan-a-0900", "09:00", 30, 210, "Plan A 09:00 branch", "path-2026-06-19-sub-a", "Plan A", "alternative"],
  ["requested-plan-a-1000", "10:00", 60, 300, "Plan A 10:00 follow up", "path-2026-06-19-sub-a", "Plan A", "alternative"],
  ["requested-main-1100", "11:00", 60, 400, "Main 11:00 block", undefined, undefined, "main"],
  ["requested-main-1200", "12:00", 180, 500, "Main 12:00 block", undefined, undefined, "main"],
  ["requested-plan-a-1230", "12:30", 60, 510, "Plan A 12:30 branch", "path-2026-06-19-sub-a", "Plan A", "alternative"],
  ["requested-main-1600", "16:00", 60, 600, "Main 16:00 block", undefined, undefined, "main"],
].map(([id, startTime, durationMinutes, sortOrder, activity, pathId, pathName, pathRole]) => ({
  ...tripFixture.planItems[0],
  id: id as string,
  day: "2026-06-19",
  startTime: startTime as string,
  durationMinutes: durationMinutes as number,
  sortOrder: sortOrder as number,
  activity: activity as string,
  activityType: "experience",
  place: pathName ? `${pathName} checkpoint` : "Main checkpoint",
  pathId: pathId as string | undefined,
  pathName: pathName as string | undefined,
  pathRole: pathRole as ItineraryItem["pathRole"],
}));
const stressPathItems: ItineraryItem[] = [
  ["stress-0800-main", "08:00", 75, 100, "Harbour breakfast", "Main", undefined, "main"],
  ["stress-0805-a", "08:05", 90, 110, "Museum sprint", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["stress-0810-b", "08:10", 70, 120, "Market photo walk", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["stress-0815-c", "08:15", 85, 130, "Ferry slow route", "Plan C", "path-2026-06-19-sub-c", "alternative"],
  ["stress-1000-main", "10:00", 60, 200, "Peak tram queue", "Main", undefined, "main"],
  ["stress-1005-a", "10:05", 65, 210, "Indoor tram backup", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["stress-1010-b", "10:10", 80, 220, "Bus scenic route", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["stress-1015-c", "10:15", 55, 230, "Taxi direct route", "Plan C", "path-2026-06-19-sub-c", "alternative"],
  ["stress-1230-main", "12:30", 75, 300, "Central lunch", "Main", undefined, "main"],
  ["stress-1235-a", "12:35", 65, 310, "Dim sum backup", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["stress-1240-b", "12:40", 70, 320, "Noodle shop backup", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["stress-1245-c", "12:45", 80, 330, "Vegetarian backup", "Plan C", "path-2026-06-19-sub-c", "alternative"],
  ["stress-1500-main", "15:00", 50, 400, "Hotel recharge", "Main", undefined, "main"],
  ["stress-1505-a", "15:05", 60, 410, "Cafe work block", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["stress-1510-b", "15:10", 45, 420, "Souvenir window", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["stress-1515-c", "15:15", 55, 430, "Quiet park break", "Plan C", "path-2026-06-19-sub-c", "alternative"],
].map(([id, startTime, durationMinutes, sortOrder, activity, pathName, pathId, pathRole]) => ({
  ...tripFixture.planItems[0],
  id: id as string,
  day: "2026-06-19",
  startTime: startTime as string,
  durationMinutes: durationMinutes as number,
  sortOrder: sortOrder as number,
  activity: activity as string,
  activityType: "experience",
  place: `${pathName} checkpoint`,
  pathGroupId: `stress-group-${Math.floor((sortOrder as number) / 100)}`,
  pathId: pathId as string | undefined,
  pathName: pathId ? pathName as string : undefined,
  pathRole: pathRole as ItineraryItem["pathRole"],
}));

const hierarchyBlockItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "story-flight-block",
    activity: "Flight to Hong Kong",
    activityType: "travel",
    itemKind: "travel",
    isPlanBlock: true,
    parentItemId: null,
    day: "2026-06-19",
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
    day: "2026-06-19",
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
    day: "2026-06-19",
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
  args: {
    canRedo: false,
    canUndo: false,
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    tripPlans: tripFixture.trip.planVariants,
    selectedTripPlanId: tripFixture.trip.activePlanVariantId,
    mainTripPlanId: tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId,
    tripPlanError: null,
    isTripPlanBusy: false,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-plan-1", name: "Plan 1", scope: "trip" },
      { id: "path-rain", name: "Rain plan", scope: "day", day: "2026-06-19" },
    ],
    role: "owner",
    startDate: tripFixture.trip.startDate,
    selectedItemId: "item-dimdim",
    selectedTripPathId: "path-plan-1",
    dayPathOverrides: { "2026-06-19": "path-rain" },
    showAllPaths: false,
    tripName: tripFixture.trip.name,
    onAddStop: noop,
    onSelectItem: noop,
    onMoveItem: noop,
    onMoveItemIntoPlanBlock: noop,
    onMoveItemToDay: noop,
    onMoveItemToPath: noop,
    onExportItinerary: noop,
    onImportItinerary: noop,
    onChangeTripPlan: noop,
    onChangeTripPlanStatus: noop,
    onSetMainTripPlan: noop,
    onCreateTripPlan: noop,
    onChangeTripPath: noop,
    onChangeDayPath: noop,
    onClearDayPath: noop,
    onClearAllDayPaths: noop,
    onToggleShowAllPaths: noop,
    onRedo: noop,
    onToggleContextRail: noop,
    onUndo: noop,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Select stop Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /เลือกจุด Dim Dim Sum/i })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
    await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[1080px]");
  },
};

export const Viewer: Story = { args: { ...Owner.args, role: "viewer" } };
export const Traveler: Story = {
  args: { ...Owner.args, role: "traveler" },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i })[0]).toBeEnabled();
  },
};
export const Dense: Story = { args: { ...Owner.args, items: buildDenseTripFixture().itineraryItems } };
export const HierarchyBlocks: Story = {
  args: {
    ...Owner.args,
    items: hierarchyBlockItems,
    graphItems: hierarchyBlockItems,
    selectedItemId: "story-flight-block",
    selectedTripPathId: "main",
    dayPathOverrides: {},
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Structure for Flight to Hong Kong")).toBeVisible();
    await expect(canvas.getByLabelText("Structure for Check in")).toBeVisible();
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
        day: "2026-06-19",
        sortOrder: 100,
      },
      {
        ...tripFixture.planItems[1],
        id: "story-child-under-plain-parent",
        activity: "Child under plain parent",
        parentItemId: "story-plain-parent",
        day: "2026-06-19",
        sortOrder: 200,
      },
    ],
    selectedItemId: "story-child-under-plain-parent",
    selectedTripPathId: "main",
    dayPathOverrides: {},
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByText("Parent block")).toBeVisible();
    await waitFor(() => {
      expect(canvasElement.querySelector(".data-row--has-warning")).toBeInTheDocument();
    });
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
    await expect(canvasElement.querySelector(".smart-table")).toHaveClass("smart-table", "min-w-[1080px]");
  },
};
export const BranchGraph: Story = {
  args: {
    ...Owner.args,
    items: branchGraphItems,
    graphItems: branchGraphItems,
    selectedItemId: "story-graph-main",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-rain", name: "Rain plan", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getByRole("button", { name: /Dim Sum morning on Main/i })).toHaveClass("activity-path-graph-node--selected");
  },
};
export const PlanAExample: Story = {
  args: {
    ...Owner.args,
    items: planAExampleItems,
    graphItems: planAExampleItems,
    selectedItemId: "story-plan-a-main-breakfast",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A museum stop on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan A cafe backup on Plan A/i })).toBeInTheDocument();
  },
};
export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: planABAlternativeItems,
    graphItems: planABAlternativeItems,
    selectedItemId: "story-plan-ab-main-breakfast",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-b", name: "Plan B", scope: "day", day: "2026-06-19" },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A gallery route on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan B harbour route on Plan B/i })).toBeInTheDocument();
    await expect(canvasElement.querySelector(".data-row--path-overlap")).not.toBeInTheDocument();
  },
};
export const RequestedPlanExample: Story = {
  args: {
    ...Owner.args,
    items: requestedPlanExampleItems,
    graphItems: requestedPlanExampleItems,
    selectedItemId: "requested-main-0800",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Main 08:00 block on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A 09:00 branch on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan A 12:30 branch on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Main 16:00 block on Main/i })).toBeInTheDocument();
  },
};
export const StressPaths: Story = {
  args: {
    ...Owner.args,
    items: stressPathItems,
    graphItems: stressPathItems,
    selectedItemId: "stress-0800-main",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-b", name: "Plan B", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-c", name: "Plan C", scope: "day", day: "2026-06-19" },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Quiet park break on Plan C/i })).toBeInTheDocument();
  },
};
