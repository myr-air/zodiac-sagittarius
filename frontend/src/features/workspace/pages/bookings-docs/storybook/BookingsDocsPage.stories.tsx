import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { BookingsDocsPage } from "../BookingsDocsPage";
import {
  addBookingDialogOpenPlay,
  densePlay,
  emptyPlay,
  mobilePlay,
  ownerPlay,
  ownerThaiPlay,
  paidCommitmentLifecyclePlay,
  responsivePlay,
  travelerPlay,
  viewerPlay,
} from "./BookingsDocsPage.stories.plays";
import {
  bookingsDocsOwnerStoryArgs,
  bookingsDocsTravelerStoryArgs,
  bookingsDocsViewerStoryArgs,
  denseBookingsDocsStoryArgs,
  emptyBookingsDocsStoryArgs,
  paidCommitmentLifecycleStoryArgs,
} from "./BookingsDocsPage.stories.support";

const meta = {
  title: "Pages/Bookings & Docs",
  component: BookingsDocsPage,
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof BookingsDocsPage>;

export default meta;

type Story = StoryObj<typeof meta>;
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

export const Owner: Story = {
  args: bookingsDocsOwnerStoryArgs,
  play: ownerPlay,
};

export const Viewer: Story = {
  args: bookingsDocsViewerStoryArgs,
  play: viewerPlay,
};

export const Traveler: Story = {
  args: bookingsDocsTravelerStoryArgs,
  play: travelerPlay,
};

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Dense: Story = {
  args: denseBookingsDocsStoryArgs,
  play: densePlay,
};

export const Empty: Story = {
  args: emptyBookingsDocsStoryArgs,
  play: emptyPlay,
};

export const AddBookingDialogOpen: Story = ownerStory(
  Owner.args,
  {},
  addBookingDialogOpenPlay,
);

export const PaidCommitmentLifecycle: Story = {
  args: paidCommitmentLifecycleStoryArgs,
  play: paidCommitmentLifecyclePlay,
};

export const Mobile: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  mobilePlay,
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
