import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { SmartItineraryTable } from "./SmartItineraryTable";

const noop = () => {};
const onStoryChangeDayPath = fn();
const onStoryMoveItemToPath = fn();
const onStoryToggleShowAllPaths = fn();
const onStoryUpdateItemInline = fn();
const onStoryInlineQuickEdit = fn();
const pageBranchGraphItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "page-graph-main",
    day: "2026-06-19",
    startTime: "08:00",
    durationMinutes: 45,
    sortOrder: 100,
    activity: "Dim Sum morning",
    pathGroupId: "page-path-group-morning",
    pathRole: "main",
  },
  {
    ...tripFixture.planItems[1],
    id: "page-graph-rain",
    day: "2026-06-19",
    startTime: "08:20",
    durationMinutes: 80,
    sortOrder: 200,
    activity: "Rain museum",
    pathGroupId: "page-path-group-morning",
    pathId: "path-rain",
    pathName: "Rain plan",
    pathRole: "alternative",
  },
  {
    ...tripFixture.planItems[2],
    id: "page-graph-late",
    day: "2026-06-19",
    startTime: "09:45",
    durationMinutes: 45,
    sortOrder: 300,
    activity: "Late coffee",
    pathGroupId: "page-path-group-morning",
    pathId: "path-2026-06-19-sub-a",
    pathName: "Plan A",
    pathRole: "alternative",
  },
  {
    ...tripFixture.planItems[3],
    id: "page-graph-lunch",
    day: "2026-06-19",
    startTime: "11:15",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Central lunch",
    pathRole: "main",
  },
];
const pagePlanAExampleItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "page-plan-a-main-breakfast",
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
    id: "page-plan-a-museum",
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
    id: "page-plan-a-cafe",
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
    id: "page-plan-a-main-lunch",
    day: "2026-06-19",
    startTime: "11:00",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Main lunch",
    place: "Main checkpoint",
    pathRole: "main",
  },
];
const pageWindowOnlyDurationItems: ItineraryItem[] = [
  {
    ...tripFixture.planItems[0],
    id: "page-window-only-duration",
    day: "2026-06-19",
    startTime: "09:00",
    endTime: "10:45",
    endOffsetDays: 0,
    durationMinutes: null,
    sortOrder: 100,
    activity: "Window only duration",
    place: "Main checkpoint",
    pathRole: "main",
  },
];
const pagePlanABAlternativeItems: ItineraryItem[] = [
  ["page-plan-ab-main-breakfast", "08:00", 60, 100, "Harbour breakfast", "Main", undefined, "main"],
  ["page-plan-ab-a-gallery", "10:00", 75, 200, "Plan A gallery route", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["page-plan-ab-b-harbour", "14:00", 90, 300, "Plan B harbour route", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["page-plan-ab-main-dinner", "18:00", 75, 400, "Main dinner meet-up", "Main", undefined, "main"],
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
  pathGroupId: "page-plan-ab-clean-branch",
  pathId: pathId as string | undefined,
  pathName: pathId ? pathName as string : undefined,
  pathRole: pathRole as ItineraryItem["pathRole"],
}));
const pageRequestedPlanExampleItems: ItineraryItem[] = [
  ["page-requested-main-0800", "08:00", 60, 100, "Main 08:00 block", undefined, undefined, "main"],
  ["page-requested-main-0900", "09:00", 120, 200, "Main 09:00 block", undefined, undefined, "main"],
  ["page-requested-plan-a-0900", "09:00", 30, 210, "Plan A 09:00 branch", "path-2026-06-19-sub-a", "Plan A", "alternative"],
  ["page-requested-plan-a-1000", "10:00", 60, 300, "Plan A 10:00 follow up", "path-2026-06-19-sub-a", "Plan A", "alternative"],
  ["page-requested-main-1100", "11:00", 60, 400, "Main 11:00 block", undefined, undefined, "main"],
  ["page-requested-main-1200", "12:00", 180, 500, "Main 12:00 block", undefined, undefined, "main"],
  ["page-requested-plan-a-1230", "12:30", 60, 510, "Plan A 12:30 branch", "path-2026-06-19-sub-a", "Plan A", "alternative"],
  ["page-requested-main-1600", "16:00", 60, 600, "Main 16:00 block", undefined, undefined, "main"],
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
const pageStressPathItems: ItineraryItem[] = [
  ["page-stress-0800-main", "08:00", 75, 100, "Harbour breakfast", "Main", undefined, "main"],
  ["page-stress-0805-a", "08:05", 90, 110, "Museum sprint", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["page-stress-0810-b", "08:10", 70, 120, "Market photo walk", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["page-stress-0815-c", "08:15", 85, 130, "Ferry slow route", "Plan C", "path-2026-06-19-sub-c", "alternative"],
  ["page-stress-1000-main", "10:00", 60, 200, "Peak tram queue", "Main", undefined, "main"],
  ["page-stress-1005-a", "10:05", 65, 210, "Indoor tram backup", "Plan A", "path-2026-06-19-sub-a", "alternative"],
  ["page-stress-1010-b", "10:10", 80, 220, "Bus scenic route", "Plan B", "path-2026-06-19-sub-b", "alternative"],
  ["page-stress-1015-c", "10:15", 55, 230, "Taxi direct route", "Plan C", "path-2026-06-19-sub-c", "alternative"],
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
  pathGroupId: `page-stress-group-${Math.floor((sortOrder as number) / 100)}`,
  pathId: pathId as string | undefined,
  pathName: pathId ? pathName as string : undefined,
  pathRole: pathRole as ItineraryItem["pathRole"],
}));

const meta = {
  title: "Pages/Itinerary",
  component: SmartItineraryTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SmartItineraryTable>;

export default meta;

type Story = StoryObj<typeof meta>;

async function expectItineraryResponsiveContract(canvasElement: HTMLElement) {
  await expect(canvasElement.querySelector(".table-scroll")).toHaveClass("table-scroll", "overflow-x-auto", "max-w-full");
  await expect(canvasElement.querySelector(".smart-table")).toHaveClass("smart-table", "min-w-[1080px]");
}

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
  play: async ({ canvas, canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvas.getByRole("button", { name: /^Import$/i })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /^New plan$/i })).toBeEnabled();
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i })[0]).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /Edit Dim Dim Sum/i })).toBeEnabled();
  },
};

export const InlineQuickEdit: Story = {
  args: {
    ...Owner.args,
    onUpdateItemInline: onStoryInlineQuickEdit,
  },
  play: async ({ canvas, canvasElement }) => {
    onStoryInlineQuickEdit.mockClear();
    await expectItineraryResponsiveContract(canvasElement);
    const documentCanvas = within(canvasElement.ownerDocument.body);
    const row = canvas.getByRole("row", { name: /Dim Dim Sum/i });
    const rowCanvas = within(row);

    const activity = rowCanvas.getByRole("textbox", {
      name: /Edit activity Dim Dim Sum/i,
    });
    await userEvent.clear(activity);
    await userEvent.type(activity, "Browser QA brunch{Enter}");

    const place = rowCanvas.getByRole("textbox", {
      name: /Edit place Dim Dim Sum/i,
    });
    await userEvent.clear(place);
    await userEvent.type(place, "Central Pier{Enter}");

    const startTime = rowCanvas.getByLabelText(/Edit time Dim Dim Sum/i);
    await userEvent.clear(startTime);
    await userEvent.type(startTime, "10:15{Enter}");

    const endTime = rowCanvas.getByLabelText(/Edit end time Dim Dim Sum/i);
    await userEvent.clear(endTime);
    await userEvent.type(endTime, "11:45");
    await userEvent.tab();

    await userEvent.click(rowCanvas.getByRole("button", { name: /Edit type Dim Dim Sum/i }));
    const typeMenu = documentCanvas.getByRole("listbox", { name: /Edit type Dim Dim Sum/i });
    await userEvent.click(within(typeMenu).getByRole("option", { name: /Experience/i }));

    const transportation = rowCanvas.getByRole("textbox", {
      name: /Edit transportation Dim Dim Sum/i,
    });
    await userEvent.clear(transportation);
    await userEvent.type(transportation, "Walk{Enter}");

    await expect(rowCanvas.getByLabelText(/Duration Dim Dim Sum/i)).toHaveTextContent("1 h");
    await expect(rowCanvas.queryByRole("button", { name: /Edit duration Dim Dim Sum/i })).toBeNull();
    await expect(onStoryInlineQuickEdit).toHaveBeenCalledWith("item-dimdim", {
      activity: "Browser QA brunch",
    });
    await expect(onStoryInlineQuickEdit).toHaveBeenCalledWith("item-dimdim", {
      place: "Central Pier",
    });
    await expect(onStoryInlineQuickEdit).toHaveBeenCalledWith("item-dimdim", {
      startTime: "10:15",
    });
    await expect(onStoryInlineQuickEdit).toHaveBeenCalledWith("item-dimdim", {
      endTime: "11:45",
      endOffsetDays: 0,
    });
    await expect(onStoryInlineQuickEdit).toHaveBeenCalledWith("item-dimdim", {
      activityType: "experience",
    });
    await expect(onStoryInlineQuickEdit).toHaveBeenCalledWith("item-dimdim", {
      transportation: "Walk",
    });
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /ตารางแผนการเดินทาง/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByLabelText(/รายการแผนการเดินทางแบบเลื่อนได้/i)).toHaveClass("table-scroll", "overflow-x-auto");
    await expect(canvas.getByRole("table", { name: /รายการแผนการเดินทาง แยกตามวัน/i })).toHaveClass("smart-table", "min-w-[1080px]");
  },
};

export const TimeWindowDuration: Story = {
  args: {
    ...Owner.args,
    items: pageWindowOnlyDurationItems,
    selectedItemId: "page-window-only-duration",
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    role: "viewer",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Editing requires organizer access/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /^Import$/i })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: /^New plan$/i })).toBeNull();
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i })[0]).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /Edit Dim Dim Sum/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: /Delete Dim Dim Sum/i })).toBeDisabled();
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    role: "traveler",
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Editing requires organizer access/i)).toBeNull();
    await expect(canvas.queryByRole("button", { name: /^New plan$/i })).toBeNull();
    await expect(canvas.getAllByRole("button", { name: /Add stop or activity/i })[0]).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /Edit Dim Dim Sum/i })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /Delete Dim Dim Sum/i })).toBeEnabled();
  },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: buildDenseTripFixture().itineraryItems,
    selectedItemId: "",
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    items: buildEmptyTripFixture().itineraryItems,
    selectedItemId: "",
  },
};

export const OverlapConflictWarning: Story = {
  args: {
    ...Owner.args,
    selectedItemId: "overlap-dim-sum",
    items: [
      {
        ...tripFixture.planItems[0],
        id: "overlap-peak-tram",
        day: tripFixture.trip.startDate,
        startTime: "09:00",
        durationMinutes: 120,
        sortOrder: 10,
        pathId: "main",
        pathName: "Main",
        pathRole: "main",
      },
      {
        ...tripFixture.planItems[1],
        id: "overlap-dim-sum",
        day: tripFixture.trip.startDate,
        startTime: "09:30",
        durationMinutes: 90,
        sortOrder: 20,
        pathId: "main",
        pathName: "Main",
        pathRole: "main",
      },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelector(".data-row--path-overlap")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /Auto fix overlaps/i })).toBeNull();
  },
};

export const PlanAExample: Story = {
  args: {
    ...Owner.args,
    items: pagePlanAExampleItems,
    graphItems: pagePlanAExampleItems,
    selectedItemId: "page-plan-a-main-breakfast",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /Itinerary table/i })).toHaveClass("table-panel", "grid");
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A museum stop on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan A cafe backup on Plan A/i })).toBeInTheDocument();
  },
};

export const PlanABAlternatives: Story = {
  args: {
    ...Owner.args,
    items: pagePlanABAlternativeItems,
    graphItems: pagePlanABAlternativeItems,
    selectedItemId: "page-plan-ab-main-breakfast",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-b", name: "Plan B", scope: "day", day: "2026-06-19" },
    ],
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("group", { name: /Activity path graph for Day 2/i })).toHaveClass("activity-path-graph");
    await expect(canvas.getByRole("button", { name: /Harbour breakfast on Main/i })).toHaveClass("activity-path-graph-node--selected");
    await expect(canvas.getByRole("button", { name: /Plan A gallery route on Plan A/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Plan B harbour route on Plan B/i })).toBeInTheDocument();
    await expect(canvasElement.querySelector(".data-row--path-overlap")).not.toBeInTheDocument();
  },
};

export const PathAndDurationInteractions: Story = {
  args: {
    ...Owner.args,
    items: pagePlanABAlternativeItems,
    graphItems: pagePlanABAlternativeItems,
    selectedItemId: "page-plan-ab-main-breakfast",
    showAllPaths: false,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-b", name: "Plan B", scope: "day", day: "2026-06-19" },
    ],
    onChangeDayPath: onStoryChangeDayPath,
    onMoveItemToPath: onStoryMoveItemToPath,
    onToggleShowAllPaths: onStoryToggleShowAllPaths,
    onUpdateItemInline: onStoryUpdateItemInline,
  },
  play: async ({ canvas, canvasElement }) => {
    const documentCanvas = within(canvasElement.ownerDocument.body);
    const dayToggle = canvas.getByRole("button", { name: /Collapse Day 2/i });
    await userEvent.click(dayToggle);
    await expect(dayToggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(dayToggle);
    await expect(dayToggle).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(canvas.getByRole("button", { name: /Path for Day 2/i }));
    const dayPathMenu = documentCanvas.getByRole("listbox", { name: /Path for Day 2/i });
    await userEvent.click(within(dayPathMenu).getByRole("option", { name: "Plan B" }));
    await expect(onStoryChangeDayPath).toHaveBeenCalledWith("2026-06-19", "path-2026-06-19-sub-b");

    await userEvent.click(canvas.getByRole("checkbox", { name: /Show all paths/i }));
    await expect(onStoryToggleShowAllPaths).toHaveBeenCalledWith(true);

    await userEvent.selectOptions(canvas.getByRole("combobox", { name: /Move Harbour breakfast to path/i }), "path-2026-06-19-sub-a");
    await expect(onStoryMoveItemToPath).toHaveBeenCalledWith("page-plan-ab-main-breakfast", "path-2026-06-19-sub-a");

    await expect(canvas.getByLabelText(/Duration Harbour breakfast/i)).toHaveTextContent("1 h");
    await expect(canvas.queryByRole("button", { name: /Edit duration Harbour breakfast/i })).not.toBeInTheDocument();
  },
};

export const BranchGraph: Story = {
  args: {
    ...Owner.args,
    items: pageBranchGraphItems,
    graphItems: pageBranchGraphItems,
    selectedItemId: "page-graph-main",
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
    await expect(canvas.getByRole("button", { name: /Rain museum on Rain plan/i })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Late coffee on Plan A/i })).toBeInTheDocument();
  },
};

export const RequestedPlanExample: Story = {
  args: {
    ...Owner.args,
    items: pageRequestedPlanExampleItems,
    graphItems: pageRequestedPlanExampleItems,
    selectedItemId: "page-requested-main-0800",
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
    items: pageStressPathItems,
    graphItems: pageStressPathItems,
    selectedItemId: "page-stress-0800-main",
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
    await expect(canvas.getByRole("button", { name: /Taxi direct route on Plan C/i })).toBeInTheDocument();
  },
};

export const TableOverflow: Story = {
  args: {
    ...Owner.args,
    items: pageStressPathItems.map((item, index) => ({
      ...item,
      id: `page-overflow-${item.id}`,
      activity: `${item.activity} with long operational copy for page-level overflow validation ${index + 1}`,
      place: `${item.place} - gate notes, booking reference, and meet-up details`,
      transport: "Airport Express transfer with luggage coordination",
    })),
    graphItems: pageStressPathItems,
    selectedItemId: "page-overflow-page-stress-0800-main",
    showAllPaths: true,
    pathOptions: [
      { id: "main", name: "Main", scope: "trip" },
      { id: "path-2026-06-19-sub-a", name: "Plan A", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-b", name: "Plan B", scope: "day", day: "2026-06-19" },
      { id: "path-2026-06-19-sub-c", name: "Plan C", scope: "day", day: "2026-06-19" },
    ],
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    await expect(canvasElement.querySelector(".activity-path-graph")).toBeInTheDocument();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
  },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
  },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: async ({ canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
  },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas, canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    const inspector = canvas.getByRole("region", { name: /Selected stop details/i });
    const inspectorCanvas = within(inspector);
    await expect(inspector).toHaveClass("mobile-itinerary-inspector");
    await expect(inspectorCanvas.getByLabelText(/Edit activity Dim Dim Sum/i)).toBeEnabled();
    await expect(inspectorCanvas.getByRole("button", { name: /Edit Dim Dim Sum/i })).toBeEnabled();
    await expect(inspectorCanvas.getByRole("button", { name: /Delete Dim Dim Sum/i })).toBeEnabled();
  },
};

export const MobileViewer: Story = {
  args: {
    ...Owner.args,
    role: "viewer",
  },
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: async ({ canvas, canvasElement }) => {
    await expectItineraryResponsiveContract(canvasElement);
    const inspector = canvas.getByRole("region", { name: /Selected stop details/i });
    const inspectorCanvas = within(inspector);
    await expect(inspector).toHaveClass("mobile-itinerary-inspector");
    await expect(inspectorCanvas.getByLabelText(/Edit activity Dim Dim Sum/i)).toHaveAttribute("readonly");
    await expect(inspectorCanvas.getByRole("button", { name: /Edit Dim Dim Sum/i })).toBeDisabled();
    await expect(inspectorCanvas.getByRole("button", { name: /Delete Dim Dim Sum/i })).toBeDisabled();
  },
};
