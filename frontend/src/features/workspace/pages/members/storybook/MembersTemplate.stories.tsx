import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ownerArgsStory } from "@/src/shared/storybook/story-builders";
import { TripMembersPage } from "../TripMembersPage";
import { templateOwnerPlay, templateOwnerThaiPlay } from "./MembersPage.stories.plays";
import {
  membersDenseStoryArgs,
  membersEmptyStoryArgs,
  membersOwnerStoryArgs,
  membersTravelerStoryArgs,
  membersViewerStoryArgs,
} from "./MembersPage.stories.support";

const meta = {
  title: "Templates/Members",
  component: TripMembersPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripMembersPage>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;

export const Owner: Story = {
  args: membersOwnerStoryArgs,
  play: templateOwnerPlay,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, templateOwnerThaiPlay, {
  locale: "th",
});

export const Traveler: Story = {
  args: membersTravelerStoryArgs,
};

export const Viewer: Story = {
  args: membersViewerStoryArgs,
};

export const Dense: Story = {
  args: membersDenseStoryArgs,
};

export const Empty: Story = {
  args: membersEmptyStoryArgs,
};
