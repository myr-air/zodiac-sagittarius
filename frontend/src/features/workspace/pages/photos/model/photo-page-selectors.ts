import { countMatchingOptions } from "@/src/shared/collection/count-matching-options";
import {
  filterPhotoAlbumLinks,
  findPhotoAlbumById,
} from "@/src/trip/photo-albums";
import { safeExternalHost } from "@/src/trip/places";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import { photoProviders, type PhotoProviderFilter } from "./photo-page-options";

export function countPhotoProviders(albums: TripPhotoAlbumLink[]): Record<PhotoProviderFilter, number> {
  return countMatchingOptions(
    photoProviders,
    albums,
    (album, provider) => provider === "all" || album.provider === provider,
  );
}

export function visiblePhotoAlbumsForProvider(
  albums: readonly TripPhotoAlbumLink[],
  activeProvider: PhotoProviderFilter,
): TripPhotoAlbumLink[] {
  return filterPhotoAlbumLinks([...albums], { provider: activeProvider });
}

export function selectedPhotoAlbum(
  albums: readonly TripPhotoAlbumLink[],
  selectedAlbumId: string,
): TripPhotoAlbumLink | null {
  return findPhotoAlbumById(albums, selectedAlbumId) ?? albums[0] ?? null;
}

export function photoAlbumLinkHost(href: string | null): string | null {
  return safeExternalHost(href);
}
