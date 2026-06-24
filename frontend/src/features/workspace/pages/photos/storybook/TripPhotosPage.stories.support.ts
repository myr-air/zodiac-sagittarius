import { expect, within } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import {
  coverStoryPhotoAlbumLinks,
  denseStoryPhotoAlbumLinks,
  ownerStoryMember,
  storyTrip,
  travelerStoryMember,
  viewerStoryMember,
} from "@/src/trip/testing/fixtures/trip-story-fixtures";
import type { TripPhotosPageProps } from "../TripPhotosPage";

type TripPhotosPageStoryArgs = TripPhotosPageProps;

export const tripPhotosOwnerStoryArgs = {
  trip: storyTrip,
  currentMember: ownerStoryMember,
  photoAlbumLinks: storyTrip.photoAlbumLinks ?? [],
  canEditPhotoAlbums: true,
  onCreatePhotoAlbum: noop,
  onUpdatePhotoAlbum: noop,
  onDeletePhotoAlbum: noop,
} satisfies TripPhotosPageStoryArgs;

export const tripPhotosViewerStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  currentMember: viewerStoryMember,
  canEditPhotoAlbums: false,
} satisfies TripPhotosPageStoryArgs;

export const tripPhotosTravelerStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  currentMember: travelerStoryMember,
  canEditPhotoAlbums: true,
} satisfies TripPhotosPageStoryArgs;

export const denseTripPhotosStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  photoAlbumLinks: denseStoryPhotoAlbumLinks,
} satisfies TripPhotosPageStoryArgs;

export const emptyTripPhotosStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  photoAlbumLinks: [],
} satisfies TripPhotosPageStoryArgs;

export const coverStatesTripPhotosStoryArgs = {
  ...tripPhotosOwnerStoryArgs,
  photoAlbumLinks: coverStoryPhotoAlbumLinks,
} satisfies TripPhotosPageStoryArgs;

export async function expectPhotosResponsiveContract(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /Photos & albums|รูปภาพและอัลบั้ม/i })).toHaveClass("trip-photos-page");
  await expect(canvas.getByLabelText(/Photo album summary|สรุปอัลบั้มรูปภาพ/i)).toBeVisible();
  await expect(canvas.getByLabelText(/Photo providers|ผู้ให้บริการรูปภาพ/i)).toBeVisible();
}
