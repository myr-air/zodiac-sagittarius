import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ownerArgsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { TripPhotosPage } from "../TripPhotosPage";
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
const ownerStory = ownerArgsStory<Story>;
const viewportStoryForOwner = viewportStory<Story>;

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

export const OwnerThai: Story = ownerStory(Owner.args, {}, ownerThaiPlay, {
  locale: "th",
});

export const Dense: Story = {
  args: denseTripPhotosStoryArgs,
};

export const Empty: Story = {
  args: emptyTripPhotosStoryArgs,
};

export const AddAlbumDialogOpen: Story = ownerStory(
  Owner.args,
  {},
  addAlbumDialogOpenPlay,
);

export const CoverStates: Story = {
  args: coverStatesTripPhotosStoryArgs,
  play: coverStatesPlay,
};

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

export const Mobile: Story = viewportStoryForOwner(
  Owner.args,
  "mobile320",
  responsivePlay,
);
