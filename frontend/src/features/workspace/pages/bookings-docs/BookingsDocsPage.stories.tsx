import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookingsDocsPage } from "./BookingsDocsPage";
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

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Dense: Story = {
  args: denseBookingsDocsStoryArgs,
  play: densePlay,
};

export const Empty: Story = {
  args: emptyBookingsDocsStoryArgs,
  play: emptyPlay,
};

export const AddBookingDialogOpen: Story = {
  args: Owner.args,
  play: addBookingDialogOpenPlay,
};

export const PaidCommitmentLifecycle: Story = {
  args: paidCommitmentLifecycleStoryArgs,
  play: paidCommitmentLifecyclePlay,
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
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
