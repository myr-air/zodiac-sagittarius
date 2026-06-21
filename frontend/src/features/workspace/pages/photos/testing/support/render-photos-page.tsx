import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import type { Member, TripPhotoAlbumLink } from "@/src/trip/types";
import {
  TripPhotosPage,
  type CreatePhotoAlbumHandler,
  type DeletePhotoAlbumHandler,
  type UpdatePhotoAlbumHandler,
} from "../../TripPhotosPage";
import { photoAlbumPageTestAlbums } from "../fixtures/photo-album-page-fixtures";

interface RenderTripPhotosPageOptions {
  currentMember: Member;
  onCreatePhotoAlbum: CreatePhotoAlbumHandler;
  onDeletePhotoAlbum: DeletePhotoAlbumHandler;
  onUpdatePhotoAlbum: UpdatePhotoAlbumHandler;
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
