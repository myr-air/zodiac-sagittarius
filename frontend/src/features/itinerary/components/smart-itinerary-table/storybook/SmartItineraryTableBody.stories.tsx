import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { messages } from "@/src/i18n/messages";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { mainPathOption, storyRainDisplayPathOption } from "@/src/features/itinerary/testing";
import { SmartItineraryTableBody } from "../SmartItineraryTableBody";
import { SmartItineraryStoryFrame } from "./smart-itinerary-story-frame";

const meta = {
  title: "Features/Itinerary/SmartItineraryTableBody",
  component: SmartItineraryTableBody,
  parameters: { layout: "fullscreen" },
  args: {
    canRestructureItems: true,
    collapsedDays: [],
    groups: [
      {
        day: tripFixture.trip.startDate,
        items: tripFixture.planItems.slice(0, 2),
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
    startDate: tripFixture.trip.startDate,
    selectedItemId: tripFixture.planItems[0].id,
    bookingDocs: [],
    bookingLinkItems: tripFixture.planItems,
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
