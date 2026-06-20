import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TripJoinGate } from "./TripJoinGate";
import {
  desktop1440Play,
  mobilePlay,
  responsiveIdentityPlay,
  roomCredentialsPlay,
  selectIdentityPlay,
  thaiPlay,
  tripAccessPlay,
} from "./TripJoinGate.stories.plays";
import {
  roomCredentialsStoryArgs,
  selectIdentityStoryArgs,
  tripAccessStoryArgs,
} from "./TripJoinGate.stories.support";

const meta = {
  title: "Pages/Trip Join Gate",
  component: TripJoinGate,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof TripJoinGate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RoomCredentials: Story = {
  args: roomCredentialsStoryArgs,
  play: roomCredentialsPlay,
};

export const TripAccess: Story = {
  args: tripAccessStoryArgs,
  play: tripAccessPlay,
};

export const SelectIdentity: Story = {
  args: selectIdentityStoryArgs,
  play: selectIdentityPlay,
};

export const Thai: Story = {
  args: RoomCredentials.args,
  parameters: { locale: "th" },
  play: thaiPlay,
};

export const Mobile: Story = {
  args: SelectIdentity.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};

export const Tablet: Story = {
  args: SelectIdentity.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: responsiveIdentityPlay,
};

export const Desktop1024: Story = {
  args: SelectIdentity.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: responsiveIdentityPlay,
};

export const Desktop1440: Story = {
  args: TripAccess.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: desktop1440Play,
};
