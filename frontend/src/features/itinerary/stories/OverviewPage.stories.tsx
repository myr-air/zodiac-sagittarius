import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OverviewPage } from "@/src/features/itinerary/components";
import {
  addTaskDialogOpenPlay,
  densePlay,
  desktop1440Play,
  emptyPlay,
  mobilePlay,
  ownerPlay,
  ownerThaiPlay,
  tabletPlay,
  travelerPlay,
  viewerPlay,
} from "./OverviewPage.stories.plays";
import {
  overviewPageDenseStoryArgs,
  overviewPageEmptyStoryArgs,
  overviewPageOwnerStoryArgs,
  overviewPageTravelerStoryArgs,
  overviewPageViewerStoryArgs,
} from "./OverviewPage.stories.support";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";

const meta = {
  title: "Pages/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OverviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

export const Owner: Story = {
  args: overviewPageOwnerStoryArgs,
  play: ownerPlay,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Traveler: Story = {
  args: overviewPageTravelerStoryArgs,
  play: travelerPlay,
};

export const Viewer: Story = {
  args: overviewPageViewerStoryArgs,
  play: viewerPlay,
};

export const Dense: Story = {
  args: overviewPageDenseStoryArgs,
  play: densePlay,
};

export const Empty: Story = {
  args: overviewPageEmptyStoryArgs,
  play: emptyPlay,
};

export const AddTaskDialogOpen: Story = ownerStory(
  Owner.args,
  {},
  addTaskDialogOpenPlay,
);

export const Tablet: Story = viewportStoryForOwner(Owner.args, "tablet768", tabletPlay);

export const Desktop1024: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1024",
  tabletPlay,
);

export const Desktop1440: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1440",
  desktop1440Play,
);

export const Mobile: Story = viewportStoryForOwner(Owner.args, "mobile320", mobilePlay);
