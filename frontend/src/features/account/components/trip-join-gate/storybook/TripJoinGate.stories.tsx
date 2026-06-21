import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  argsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { TripJoinGate } from "../TripJoinGate";
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
const joinGateStory = argsStory<Story>;
const viewportStoryForGate = viewportStory<Story>;

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

const roomCredentialsArgs = RoomCredentials.args ?? {};
const tripAccessArgs = TripAccess.args ?? {};
const selectIdentityArgs = SelectIdentity.args ?? {};

export const Thai: Story = joinGateStory(roomCredentialsArgs, {}, thaiPlay, {
  locale: "th",
});

export const Mobile: Story = viewportStoryForGate(
  selectIdentityArgs,
  "mobile320",
  mobilePlay,
);

export const Tablet: Story = viewportStoryForGate(
  selectIdentityArgs,
  "tablet768",
  responsiveIdentityPlay,
);

export const Desktop1024: Story = viewportStoryForGate(
  selectIdentityArgs,
  "desktop1024",
  responsiveIdentityPlay,
);

export const Desktop1440: Story = viewportStoryForGate(
  tripAccessArgs,
  "desktop1440",
  desktop1440Play,
);
