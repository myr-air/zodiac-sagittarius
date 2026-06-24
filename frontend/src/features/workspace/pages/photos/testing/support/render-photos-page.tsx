import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import {
  TripPhotosPage,
  type TripPhotosPageProps,
  type UpdatePhotoAlbumHandler,
} from "../../TripPhotosPage";
import { photoAlbumPageTestAlbums } from "../fixtures/photo-album-page-fixtures";

type RenderTripPhotosPageOptions = Partial<TripPhotosPageProps>;

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
  const onUpdatePhotoAlbum =
    overrides.onUpdatePhotoAlbum ?? (vi.fn() as UpdatePhotoAlbumHandler);
  return (
    <TripPhotosPage
      trip={overrides.trip ?? seedTrip}
      currentMember={currentMember}
      photoAlbumLinks={overrides.photoAlbumLinks ?? photoAlbumPageTestAlbums}
      canEditPhotoAlbums={
        currentMember.role === "owner" ||
        currentMember.role === "organizer" ||
        currentMember.role === "traveler"
      }
      onCreatePhotoAlbum={overrides.onCreatePhotoAlbum ?? vi.fn()}
      onUpdatePhotoAlbum={onUpdatePhotoAlbum}
      onDeletePhotoAlbum={overrides.onDeletePhotoAlbum ?? vi.fn()}
    />
  );
}
