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

const meta = {
  title: "Pages/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof OverviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: overviewPageOwnerStoryArgs,
  play: ownerPlay,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

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

export const AddTaskDialogOpen: Story = {
  args: Owner.args,
  play: addTaskDialogOpenPlay,
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: tabletPlay,
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: tabletPlay,
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: desktop1440Play,
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};
