import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { TripPhotosPage } from "./TripPhotosPage";

const noop = () => {};

const meta = {
  title: "Pages/Photos",
  component: TripPhotosPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TripPhotosPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  args: {
    trip: tripFixture.trip,
    currentMember: tripFixture.currentMembers.owner,
    photoAlbumLinks: tripFixture.trip.photoAlbumLinks ?? [],
    canEditPhotoAlbums: true,
    onCreatePhotoAlbum: noop,
    onUpdatePhotoAlbum: noop,
    onDeletePhotoAlbum: noop,
  },
};

export const Viewer: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.viewer,
    canEditPhotoAlbums: false,
  },
};
