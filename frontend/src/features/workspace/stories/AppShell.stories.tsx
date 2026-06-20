import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppShell } from "@/src/features/workspace/components/app-shell";
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

export const Mobile: Story = {
  args: collapsedAppShellOwnerStoryArgs,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};

export const Tablet: Story = {
  args: collapsedAppShellOwnerStoryArgs,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};
