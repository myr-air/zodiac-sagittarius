import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OverviewPage } from "@/src/features/itinerary/components";
import {
  overviewTemplateDenseStoryArgs,
  overviewTemplateEmptyStoryArgs,
  overviewTemplateOwnerStoryArgs,
  overviewTemplateTravelerStoryArgs,
  overviewTemplateViewerStoryArgs,
} from "../OverviewPage.stories.support";
import { ownerArgsStory } from "../itinerary-story-builders";
import { ownerThaiPlay } from "./OverviewTemplate.stories.plays";

const meta = {
  title: "Templates/Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof OverviewPage>;

export default meta;

type Story = StoryObj<typeof meta>;

const ownerStory = ownerArgsStory<Story>;

export const Owner: Story = {
  args: overviewTemplateOwnerStoryArgs,
};

export const Traveler: Story = {
  args: overviewTemplateTravelerStoryArgs,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Viewer: Story = {
  args: overviewTemplateViewerStoryArgs,
};

export const Empty: Story = {
  args: overviewTemplateEmptyStoryArgs,
};

export const Dense: Story = {
  args: overviewTemplateDenseStoryArgs,
};
