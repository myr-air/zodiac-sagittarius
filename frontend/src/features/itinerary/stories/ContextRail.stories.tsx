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
import {
  argsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";

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
const baseStory = argsStory<Story>;
const viewportStoryForBase = viewportStory<Story>;

export const NotesOpen: Story = {
  args: contextRailBaseArgs,
  play: notesOpenPlay,
};

export const BookingTab: Story = baseStory(contextRailBaseArgs, {
  bookingDocs: contextRailBookingDocs,
}, bookingTabPlay);

export const SuggestionsTab: Story = {
  args: contextRailBaseArgs,
  play: suggestionsTabPlay,
};

export const TripExpensesOnly: Story = baseStory(contextRailBaseArgs, {
  selectedItem: undefined,
}, tripExpensesOnlyPlay);

export const ReadOnlyTraveler: Story = {
  args: readOnlyTravelerContextRailArgs,
  play: readOnlyTravelerPlay,
};

export const Closed: Story = baseStory(contextRailBaseArgs, {
  open: false,
}, closedPlay);

export const Mobile: Story = viewportStoryForBase(
  contextRailBaseArgs,
  "mobile320",
  mobilePlay,
);

export const Tablet: Story = viewportStoryForBase(
  contextRailBaseArgs,
  "tablet768",
  tabletPlay,
);

export const Thai: Story = {
  args: contextRailBaseArgs,
  parameters: { locale: "th" },
  play: thaiPlay,
};

export const Desktop1024: Story = viewportStoryForBase(
  contextRailBaseArgs,
  "desktop1024",
  mobilePlay,
);

export const Desktop1440: Story = viewportStoryForBase(
  contextRailBaseArgs,
  "desktop1440",
  desktop1440Play,
);
