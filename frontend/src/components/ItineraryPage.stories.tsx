import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import { SmartItineraryTable } from "./SmartItineraryTable";

const noop = () => {};
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

export const Owner: Story = {
  args: {
    canRedo: false,
    canUndo: false,
    contextRailOpen: false,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    tripSheets: tripFixture.trip.planVariants,
    selectedTripSheetId: tripFixture.trip.activePlanVariantId,
    tripSheetError: null,
    isTripSheetBusy: false,
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
    onChangeTripSheet: noop,
    onCreateTripSheet: noop,
    onChangeTripPath: noop,
    onChangeDayPath: noop,
    onClearDayPath: noop,
    onClearAllDayPaths: noop,
    onToggleShowAllPaths: noop,
    onRedo: noop,
    onToggleContextRail: noop,
    onUndo: noop,
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    role: "viewer",
  },
};

export const Traveler: Story = {
  args: {
    ...Owner.args,
    role: "traveler",
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector(".data-row--path-overlap")).toBeInTheDocument();
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
    await expect(canvasElement.querySelector(".table-scroll")).toHaveClass("table-scroll", "overflow-x-auto", "max-w-full");
    await expect(canvasElement.querySelector(".smart-table")).toHaveClass("smart-table", "min-w-[1080px]");
    await expect(canvasElement.querySelector(".activity-path-graph")).toBeInTheDocument();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
