import { expect, within } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import type { TripPhotosPage } from "./TripPhotosPage";

type TripPhotosPageStoryArgs = Parameters<typeof TripPhotosPage>[0];

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

export const tripPhotosOwnerStoryArgs = {
  trip: tripFixture.trip,
  currentMember: tripFixture.currentMembers.owner,
  photoAlbumLinks: tripFixture.trip.photoAlbumLinks ?? [],
  canEditPhotoAlbums: true,
  onCreatePhotoAlbum: noop,
  onUpdatePhotoAlbum: noop,
  onDeletePhotoAlbum: noop,
} satisfies TripPhotosPageStoryArgs;

export const tripPhotosViewerStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.viewer,
  canEditPhotoAlbums: false,
} satisfies TripPhotosPageStoryArgs;

export const tripPhotosTravelerStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.traveler,
  canEditPhotoAlbums: true,
} satisfies TripPhotosPageStoryArgs;

export const denseTripPhotosStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  photoAlbumLinks: densePhotoAlbumLinks,
} satisfies TripPhotosPageStoryArgs;

export const emptyTripPhotosStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  photoAlbumLinks: [],
} satisfies TripPhotosPageStoryArgs;

export const coverStatesTripPhotosStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  photoAlbumLinks: coverPhotoAlbumLinks,
} satisfies TripPhotosPageStoryArgs;

export async function expectPhotosResponsiveContract(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /Photos & albums|รูปภาพและอัลบั้ม/i })).toHaveClass("trip-photos-page");
  await expect(canvas.getByLabelText(/Photo album summary|สรุปอัลบั้มรูปภาพ/i)).toBeVisible();
  await expect(canvas.getByLabelText(/Photo providers|ผู้ให้บริการรูปภาพ/i)).toBeVisible();
}
