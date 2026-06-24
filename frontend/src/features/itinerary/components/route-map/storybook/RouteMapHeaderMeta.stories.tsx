import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { messages } from "@/src/i18n/messages";
import { allDaysFilter } from "@/src/features/itinerary/domain/route-map-model";
import { RouteMapHeaderMeta } from "../RouteMapHeaderMeta";

const meta = {
  title: "Features/Itinerary/RouteMapHeaderMeta",
  component: RouteMapHeaderMeta,
  parameters: { layout: "centered" },
  args: {
    activeDay: allDaysFilter,
    copy: messages.en.map,
    endDate: "2026-06-20",
    itemsCount: 8,
    locale: "en",
    mappedCount: 6,
    routeDayGroups: [
      {
        color: "#2563eb",
        day: "2026-06-18",
        label: "Day 1",
        points: [],
      },
      {
        color: "#16a34a",
        day: "2026-06-19",
        label: "Day 2",
        points: [],
      },
    ],
    startDate: "2026-06-18",
    unresolvedCount: 2,
    warningCount: 1,
    warningCountLabel: messages.en.dates.warningCount,
  },
} satisfies Meta<typeof RouteMapHeaderMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ThaiSelectedDay: Story = {
  args: {
    activeDay: "2026-06-19",
    copy: messages.th.map,
    locale: "th",
    warningCountLabel: messages.th.dates.warningCount,
  },
};
