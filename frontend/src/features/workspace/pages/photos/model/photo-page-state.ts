import type { TripPhotoAlbumLink } from "@/src/trip/types";
import type { PhotoProviderFilter } from "./photo-page-options";

export interface PhotoAlbumBrowserState {
  activeProvider: PhotoProviderFilter;
  selectedAlbumId: string;
}

export interface PhotoAlbumModalState {
  deleteAlbum: TripPhotoAlbumLink | null;
  dialogAlbum: TripPhotoAlbumLink | "new" | null;
}

export function initialPhotoAlbumBrowserState(
  photoAlbumLinks: TripPhotoAlbumLink[],
): PhotoAlbumBrowserState {
  return {
    activeProvider: "all",
    selectedAlbumId: photoAlbumLinks[0]?.id ?? "",
  };
}

export const initialPhotoAlbumModalState: PhotoAlbumModalState = {
  deleteAlbum: null,
  dialogAlbum: null,
};

export function updatePhotoAlbumBrowserState<
  Field extends keyof PhotoAlbumBrowserState,
>(
  state: PhotoAlbumBrowserState,
  field: Field,
  value: PhotoAlbumBrowserState[Field],
): PhotoAlbumBrowserState {
  return { ...state, [field]: value };
}
