import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTable } from "./SmartItineraryTable";

const noop = () => {};

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

export const Dense: Story = {
  args: {
    ...Owner.args,
    items: buildDenseTripFixture().itineraryItems,
    selectedItemId: "",
  },
};
