import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContextRail } from "@/src/features/itinerary/components";
import {
  bookingTabPlay,
  closedPlay,
  desktop1440Play,
  mobilePlay,
  notesOpenPlay,
  readOnlyTravelerPlay,
  suggestionsTabPlay,
  tabletPlay,
  thaiPlay,
  tripExpensesOnlyPlay,
} from "./ContextRail.stories.plays";
import {
  contextRailBaseArgs,
  contextRailBookingDocs,
  readOnlyTravelerContextRailArgs,
} from "./ContextRail.stories.support";

const meta = {
  title: "Design System/Context Rail",
  component: ContextRail,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="relative min-h-[760px] overflow-hidden bg-(--color-page)">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContextRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotesOpen: Story = {
  args: contextRailBaseArgs,
  play: notesOpenPlay,
};

export const BookingTab: Story = {
  args: {
    ...contextRailBaseArgs,
    bookingDocs: contextRailBookingDocs,
  },
  play: bookingTabPlay,
};

export const SuggestionsTab: Story = {
  args: contextRailBaseArgs,
  play: suggestionsTabPlay,
};

export const TripExpensesOnly: Story = {
  args: {
    ...contextRailBaseArgs,
    selectedItem: undefined,
  },
  play: tripExpensesOnlyPlay,
};

export const ReadOnlyTraveler: Story = {
  args: readOnlyTravelerContextRailArgs,
  play: readOnlyTravelerPlay,
};

export const Closed: Story = {
  args: {
    ...contextRailBaseArgs,
    open: false,
  },
  play: closedPlay,
};

export const Mobile: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};

export const Tablet: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: tabletPlay,
};

export const Thai: Story = {
  args: contextRailBaseArgs,
  parameters: { locale: "th" },
  play: thaiPlay,
};

export const Desktop1024: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: mobilePlay,
};

export const Desktop1440: Story = {
  args: contextRailBaseArgs,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: desktop1440Play,
};
