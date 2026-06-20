import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppShell } from "@/src/features/workspace/components/app-shell";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { ownerPlay, ownerThaiPlay, travelerPlay, viewerPlay } from "./AppShell.stories.plays";
import {
  appShellOwnerStoryArgs,
  appShellTravelerStoryArgs,
  appShellViewerStoryArgs,
  collapsedAppShellOwnerStoryArgs,
} from "./AppShell.stories.support";

const meta = {
  title: "Templates/Workspace Shell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

export const Owner: Story = {
  args: appShellOwnerStoryArgs,
  play: ownerPlay,
};

export const Traveler: Story = {
  args: appShellTravelerStoryArgs,
  play: travelerPlay,
};

export const Viewer: Story = {
  args: appShellViewerStoryArgs,
  play: viewerPlay,
};

export const Mobile: Story = viewportStoryForOwner(
  collapsedAppShellOwnerStoryArgs,
  "mobile320",
  undefined,
);

export const Tablet: Story = viewportStoryForOwner(
  collapsedAppShellOwnerStoryArgs,
  "tablet768",
  undefined,
);

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});
