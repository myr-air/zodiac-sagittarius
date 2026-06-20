import { safeExternalHost } from "@/src/trip/safe-links";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import { photoProviders, type PhotoProviderFilter } from "./photo-page-options";

export function countPhotoProviders(albums: TripPhotoAlbumLink[]): Record<PhotoProviderFilter, number> {
  const counts = Object.fromEntries(photoProviders.map((provider) => [provider, 0])) as Record<PhotoProviderFilter, number>;
  counts.all = albums.length;
  for (const album of albums) {
    counts[album.provider] += 1;
  }
  return counts;
}

export function photoAlbumLinkHost(href: string | null): string | null {
  return safeExternalHost(href);
}
