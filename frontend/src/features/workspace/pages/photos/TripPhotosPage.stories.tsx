import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TripPhotosPage } from "./TripPhotosPage";
import {
  addAlbumDialogOpenPlay,
  coverStatesPlay,
  ownerPlay,
  ownerThaiPlay,
  responsivePlay,
  viewerPlay,
} from "./TripPhotosPage.stories.plays";
import {
  coverStatesTripPhotosStoryArgs,
  denseTripPhotosStoryArgs,
  emptyTripPhotosStoryArgs,
  tripPhotosOwnerStoryArgs,
  tripPhotosTravelerStoryArgs,
  tripPhotosViewerStoryArgs,
} from "./TripPhotosPage.stories.support";

const meta = {
  title: "Pages/Photos",
  component: TripPhotosPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripPhotosPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: tripPhotosOwnerStoryArgs,
  play: ownerPlay,
};

export const Viewer: Story = {
  args: tripPhotosViewerStoryArgs,
  play: viewerPlay,
};

export const Traveler: Story = {
  args: tripPhotosTravelerStoryArgs,
  play: Owner.play,
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
  play: ownerThaiPlay,
};

export const Dense: Story = {
  args: denseTripPhotosStoryArgs,
};

export const Empty: Story = {
  args: emptyTripPhotosStoryArgs,
};

export const AddAlbumDialogOpen: Story = {
  args: Owner.args,
  play: addAlbumDialogOpenPlay,
};

export const CoverStates: Story = {
  args: coverStatesTripPhotosStoryArgs,
  play: coverStatesPlay,
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
  play: responsivePlay,
};
