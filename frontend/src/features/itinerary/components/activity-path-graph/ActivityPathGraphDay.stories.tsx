import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ItineraryItem } from "@/src/trip/types";
import { ActivityPathGraphDay } from "./ActivityPathGraphDay";
import type { ActivityPathGraphDayProps } from "./activity-path-graph.types";
import { mainPathOption, pathRainPlanOption } from "@/src/features/itinerary/testing";
import { makeItineraryGraphItem } from "./activity-path-graph.test-fixtures";

const rowItems: ItineraryItem[] = [
  makeItineraryGraphItem({
    id: "item-main",
    activity: "Hotel check-in",
    place: "Grand Hotel",
    pathId: "main",
    pathRole: "main",
  }),
  makeItineraryGraphItem({
    id: "item-rain",
    activity: "Airport pickup",
    place: "Terminal 1",
    pathId: "rain",
    pathRole: "alternative",
    pathName: "Rain Plan",
  }),
];

const graphItems: ItineraryItem[] = [
  rowItems[0],
  makeItineraryGraphItem({
    id: "item-rain-detail",
    activity: "Umbrella shopping",
    place: "Duty Free",
    pathId: "rain",
    pathRole: "alternative",
    pathName: "Rain Plan",
  }),
];

const pathOptions = [mainPathOption, pathRainPlanOption];

const meta = {
  title: "Features/Itinerary/ActivityPathGraphDay",
  component: ActivityPathGraphDay,
  parameters: { layout: "centered" },
  args: {
    canEdit: true,
    day: "2026-06-19",
    dayLabel: "Day 2",
    graphWidth: 220,
    graphItems,
    pathOptions,
    rowItems,
    selectedItemId: rowItems[0].id,
    onMoveItemToPath: () => {},
    onSelectItem: () => {},
  } satisfies Partial<ActivityPathGraphDayProps>,
  render: (args) => (
    <div className="w-[240px]">
      <ActivityPathGraphDay {...args} />
    </div>
  ),
} satisfies Meta<ActivityPathGraphDayProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ...meta.args,
  },
};

export const ReadOnly: Story = {
  args: {
    ...meta.args,
    canEdit: false,
  },
};
