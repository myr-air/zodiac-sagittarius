import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TripSettingsPage } from "./TripSettingsPage";
import {
  ownerPlay,
  planImpactWarningPlay,
  responsivePlay,
  thaiPlay,
  viewerPlay,
} from "./TripSettingsPage.stories.plays";
import {
  tripSettingsOwnerStoryArgs,
  tripSettingsPlanImpactStoryArgs,
  tripSettingsTravelerStoryArgs,
  tripSettingsViewerStoryArgs,
} from "./TripSettingsPage.stories.support";

const meta = {
  title: "Pages/Trip Settings",
  component: TripSettingsPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripSettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: tripSettingsOwnerStoryArgs,
  play: ownerPlay,
};

export const Viewer: Story = {
  args: tripSettingsViewerStoryArgs,
  play: viewerPlay,
};

export const Traveler: Story = {
  args: tripSettingsTravelerStoryArgs,
  play: Viewer.play,
};

export const Thai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: thaiPlay,
};

export const PlanImpactWarning: Story = {
  args: tripSettingsPlanImpactStoryArgs,
  play: planImpactWarningPlay,
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: responsivePlay,
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: responsivePlay,
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: responsivePlay,
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: responsivePlay,
};
