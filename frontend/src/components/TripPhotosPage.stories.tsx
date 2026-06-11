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

const coverPhotoAlbumLinks: TripPhotoAlbumLink[] = [
  {
    ...(tripFixture.trip.photoAlbumLinks?.[0] ?? densePhotoAlbumLinks[0]),
    id: "photo-album-cover-hong-kong",
    title: "Harbour skyline handoff",
    coverUrl: "/landing/auth/photo-hong-kong-skyline.png",
    accessNote: "Use this as the trip recap cover before everyone uploads.",
  },
  {
    ...(tripFixture.trip.photoAlbumLinks?.[1] ?? densePhotoAlbumLinks[1]),
    id: "photo-album-cover-market",
    title: "Mong Kok market uploads",
    coverUrl: "/landing/auth/photo-mong-kok-market.png",
    access: "upload_request",
    provider: "dropbox",
  },
  {
    ...(tripFixture.trip.photoAlbumLinks?.[2] ?? densePhotoAlbumLinks[2]),
    id: "photo-album-cover-fallback",
    title: "No cover fallback album",
    coverUrl: null,
    provider: "custom",
  },
];

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
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /รูปภาพและอัลบั้ม/i })).toHaveClass("trip-photos-page");
    await expect(canvas.getByRole("button", { name: /เพิ่มอัลบั้ม/i })).toBeVisible();
    await expect(canvas.getByLabelText(/สรุปอัลบั้มรูปภาพ/i)).toBeVisible();
    await expect(canvas.getByLabelText(/ผู้ให้บริการรูปภาพ/i)).toBeVisible();
  },
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

export const CoverStates: Story = {
  args: {
    ...Owner.args,
    photoAlbumLinks: coverPhotoAlbumLinks,
  },
  play: async ({ canvas }) => {
    const harbourCover = canvas.getByLabelText(/Cover for Harbour skyline handoff/i);
    await expect(harbourCover).toHaveClass("photo-album-cover", "bg-cover", "bg-center");
    await expect(harbourCover.getAttribute("style")).toContain("/landing/auth/photo-hong-kong-skyline.png");

    const fallbackCover = canvas.getByLabelText(/Cover for No cover fallback album/i);
    await expect(fallbackCover).toHaveClass("photo-album-cover", "bg-(--color-surface-subtle)");
    await expect(fallbackCover.getAttribute("style")).toBeNull();
    await expect(canvas.getAllByText(/Use this as the trip recap cover/i).length).toBeGreaterThan(1);
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
