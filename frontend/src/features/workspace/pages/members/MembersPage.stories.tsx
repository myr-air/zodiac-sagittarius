import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TripMembersPage } from "./TripMembersPage";
import {
  mobilePlay,
  ownerPlay,
  ownerThaiPlay,
  readOnlyPlay,
  responsivePlay,
} from "./MembersPage.stories.plays";
import {
  membersDenseStoryArgs,
  membersEmptyStoryArgs,
  membersOwnerStoryArgs,
  membersTravelerStoryArgs,
  membersViewerStoryArgs,
} from "./MembersPage.stories.support";

const meta = {
  title: "Pages/Members",
  component: TripMembersPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripMembersPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: membersOwnerStoryArgs,
  play: ownerPlay,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Traveler: Story = {
  args: membersTravelerStoryArgs,
  play: readOnlyPlay,
};

export const Viewer: Story = {
  args: membersViewerStoryArgs,
  play: Traveler.play,
};

export const Dense: Story = {
  args: membersDenseStoryArgs,
};

export const Empty: Story = {
  args: membersEmptyStoryArgs,
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

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};
