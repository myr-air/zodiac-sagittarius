import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import { TripPhotosPage } from "./TripPhotosPage";

const noop = () => {};
const densePhotoAlbumLinks: TripPhotoAlbumLink[] = Array.from({ length: 18 }, (_, index) => {
  const base = tripFixture.trip.photoAlbumLinks?.[index % (tripFixture.trip.photoAlbumLinks?.length || 1)];

  return {
    id: `photo-album-dense-${index + 1}`,
    tripId: tripFixture.trip.id,
    title: base ? `${base.title} ${index + 1}` : `Shared album ${index + 1}`,
    provider: base?.provider ?? (index % 2 === 0 ? "google_photos" : "icloud"),
    url: base?.url ?? "https://photos.example.com/shared-trip",
    access: base?.access ?? (index % 3 === 0 ? "upload_request" : "collaborative"),
    ownerMemberId: base?.ownerMemberId ?? tripFixture.currentMembers.owner.id,
    relatedItineraryItemIds: base?.relatedItineraryItemIds ?? [tripFixture.planItems[index % tripFixture.planItems.length].id],
    day: base?.day ?? tripFixture.planItems[index % tripFixture.planItems.length].day,
    description: base?.description ?? "Shared photos for a busy group trip day.",
    accessNote: index % 4 === 0 ? null : (base?.accessNote ?? "Anyone with the trip link can view."),
    coverUrl: base?.coverUrl ?? null,
    createdBy: base?.createdBy ?? tripFixture.currentMembers.owner.id,
    updatedAt: base?.updatedAt ?? "2026-05-27T00:00:00.000Z",
    version: base?.version ?? 1,
  };
});

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

export const Traveler: Story = {
  args: {
    ...Owner.args,
    currentMember: tripFixture.currentMembers.traveler,
    canEditPhotoAlbums: true,
  },
};

export const OwnerThai: Story = {
  args: Owner.args,
  parameters: { locale: "th" },
};

export const Dense: Story = {
  args: {
    ...Owner.args,
    photoAlbumLinks: densePhotoAlbumLinks,
  },
};

export const Empty: Story = {
  args: {
    ...Owner.args,
    photoAlbumLinks: [],
  },
};

export const AddAlbumDialogOpen: Story = {
  args: Owner.args,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Add album/i }));
    await expect(canvas.getByRole("dialog", { name: /Add album/i })).toHaveClass("photos-dialog");
    await expect(canvas.getByText("Album link")).toBeVisible();
    await expect(canvas.getByText("Related itinerary")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Save album/i })).toBeVisible();
  },
};

export const Tablet: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
};

export const Desktop1024: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
};

export const Desktop1440: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
};

export const Mobile: Story = {
  args: Owner.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
