import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
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
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

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

export const Thai: Story = ownerStory(Owner.args, {}, thaiPlay, {
  locale: "th",
});

export const PlanImpactWarning: Story = {
  args: tripSettingsPlanImpactStoryArgs,
  play: planImpactWarningPlay,
};

export const Mobile: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  responsivePlay,
);

export const Tablet: Story = viewportStoryForOwner(
  Owner.args,
  "tablet768",
  responsivePlay,
);

export const Desktop1024: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1024",
  responsivePlay,
);

export const Desktop1440: Story = viewportStoryForOwner(
  Owner.args,
  "desktop1440",
  responsivePlay,
);
