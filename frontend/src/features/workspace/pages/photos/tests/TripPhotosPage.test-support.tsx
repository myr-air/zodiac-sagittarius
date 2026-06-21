import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import type { Member, TripPhotoAlbumLink } from "@/src/trip/types";
import { TripPhotosPage, type TripPhotoAlbumInput } from "../TripPhotosPage";

export const photoAlbumPageTestAlbums: TripPhotoAlbumLink[] = [
  {
    id: "album-google",
    tripId: seedTrip.id,
    title: "Google Photos group album",
    provider: "google_photos",
    url: "https://photos.app.goo.gl/group",
    access: "collaborative",
    ownerMemberId: "member-aom",
    relatedItineraryItemIds: ["item-victoria-peak"],
    day: "2026-06-18",
    description: "Shared album for everyone",
    accessNote: "Everyone can add photos",
    coverUrl: "https://images.example.test/hong-kong-album.jpg",
    createdBy: "member-aom",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
  },
  {
    id: "album-dropbox",
    tripId: seedTrip.id,
    title: "Dropbox upload request",
    provider: "dropbox",
    url: "https://www.dropbox.com/request/example",
    access: "upload_request",
    ownerMemberId: "member-beam",
    relatedItineraryItemIds: [],
    day: null,
    description: null,
    accessNote: null,
    coverUrl: null,
    createdBy: "member-beam",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
  },
  {
    id: "album-unsafe",
    tripId: seedTrip.id,
    title: "Unsafe import",
    provider: "custom",
    url: "javascript:alert(1)",
    access: "view_only",
    ownerMemberId: null,
    relatedItineraryItemIds: [],
    day: null,
    description: null,
    accessNote: null,
    coverUrl: null,
    createdBy: "member-aom",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
  },
];

interface RenderTripPhotosPageOptions {
  currentMember: Member;
  onCreatePhotoAlbum: (input: TripPhotoAlbumInput) => void;
  onDeletePhotoAlbum: (albumId: string) => void;
  onUpdatePhotoAlbum: (albumId: string, input: TripPhotoAlbumInput) => void;
  photoAlbumLinks: TripPhotoAlbumLink[];
}

export function renderTripPhotosPage(
  overrides: Partial<RenderTripPhotosPageOptions> = {},
) {
  return renderWithI18n(renderTripPhotosPageElement(overrides), {
    locale: "en",
  });
}

export function renderTripPhotosPageElement(
  overrides: Partial<RenderTripPhotosPageOptions> = {},
) {
  const currentMember = overrides.currentMember ?? seedTrip.members[0];
  return (
    <TripPhotosPage
      trip={seedTrip}
      currentMember={currentMember}
      photoAlbumLinks={overrides.photoAlbumLinks ?? photoAlbumPageTestAlbums}
      canEditPhotoAlbums={
        currentMember.role === "owner" ||
        currentMember.role === "organizer" ||
        currentMember.role === "traveler"
      }
      onCreatePhotoAlbum={overrides.onCreatePhotoAlbum ?? vi.fn()}
      onUpdatePhotoAlbum={overrides.onUpdatePhotoAlbum ?? vi.fn()}
      onDeletePhotoAlbum={overrides.onDeletePhotoAlbum ?? vi.fn()}
    />
  );
}
