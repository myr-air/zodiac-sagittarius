import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { messages } from "@/src/i18n/messages";
import { ItineraryHeaderMeta } from "../ItineraryHeaderMeta";

const meta = {
  title: "Features/Itinerary/ItineraryHeaderMeta",
  component: ItineraryHeaderMeta,
  parameters: { layout: "centered" },
  args: {
    daysCount: 6,
    endDate: "2026-06-23",
    itemsCount: 42,
    locale: "en",
    startDate: "2026-06-18",
    tDates: messages.en.dates,
    tItinerary: messages.en.itinerary,
    totalMinutes: 1320,
    warningCount: 0,
  },
} satisfies Meta<typeof ItineraryHeaderMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Thai: Story = {
  args: {
    locale: "th",
    tDates: messages.th.dates,
    tItinerary: messages.th.itinerary,
    warningCount: 2,
  },
};
