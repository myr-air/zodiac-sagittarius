import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { messages } from "@/src/i18n/messages";
import {
  buildItineraryItem,
  mainPathOption,
  storyRainDisplayPathOption,
} from "@/src/features/itinerary/testing";
import { SmartItineraryTableBody } from "../SmartItineraryTableBody";
import { SmartItineraryStoryFrame } from "./smart-itinerary-story-frame";

const storyStartDate = "2026-06-18";
const storyItems = [
  buildItineraryItem({
    id: "table-body-story-checkin",
    day: storyStartDate,
    activity: "Hotel check-in",
    place: "Central hotel",
    sortOrder: 100,
  }),
  buildItineraryItem({
    id: "table-body-story-dinner",
    day: storyStartDate,
    activity: "Dinner plan",
    place: "Harbour restaurant",
    sortOrder: 200,
  }),
];

const meta = {
  title: "Features/Itinerary/SmartItineraryTableBody",
  component: SmartItineraryTableBody,
  parameters: { layout: "fullscreen" },
  args: {
    canRestructureItems: true,
    collapsedDays: [],
    groups: [
      {
        day: storyStartDate,
        items: storyItems,
        warningCount: 0,
      },
    ],
    graphItemsByDay: new Map(),
    dailyBriefingsByDate: new Map(),
    pathOptions: [mainPathOption, storyRainDisplayPathOption],
    dayPathOverrides: {},
    showAllPaths: false,
    smartTableStyle: { "--graph-column-width": "164px" } as CSSProperties,
    graphColumnWidth: 164,
    itineraryLabels: messages.en.itinerary,
    locale: "en",
    startDate: storyStartDate,
    selectedItemId: storyItems[0].id,
    bookingDocs: [],
    bookingLinkItems: storyItems,
    onAddStop: () => {},
    onOpenItemDetails: () => {},
    onSelectItem: () => {},
    tHeaders: messages.en.itinerary.headers,
  },
  render: (args) => (
    <SmartItineraryStoryFrame padded>
      <SmartItineraryTableBody {...args} />
    </SmartItineraryStoryFrame>
  ),
} satisfies Meta<typeof SmartItineraryTableBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ...meta.args,
    onToggleDay: () => {},
  },
};
