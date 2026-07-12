import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { messages } from "@/src/i18n/messages";
import { SmartItineraryTableMeta } from "../SmartItineraryTableMeta";

const meta = {
  title: "Features/Itinerary/SmartItineraryTableMeta",
  component: SmartItineraryTableMeta,
  parameters: { layout: "centered" },
  args: {
    groupsCount: 6,
    itemsCount: 42,
    locale: "en",
    startDate: "2026-06-18",
    endDate: "2026-06-23",
    tDates: messages.en.dates,
    tItinerary: messages.en.itinerary,
    totalMinutes: 1320,
    warningCount: 0,
    subActivitiesCount: 0,
    flexibleItemsCount: 0,
  },
} satisfies Meta<typeof SmartItineraryTableMeta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <SmartItineraryTableMeta {...args} />,
};
