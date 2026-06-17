import type { TripPhotoAlbumAccess, TripPhotoAlbumLink, TripPhotoAlbumProvider } from "@/src/trip/types";
import type { PhotoCopy } from "./TripPhotosPage.copy";

export const photoProviders = ["all", "google_photos", "icloud", "google_drive", "dropbox", "onedrive", "custom"] as const;
export type PhotoProviderFilter = (typeof photoProviders)[number];

export const photoProviderOptions = photoProviders.filter((provider) => provider !== "all") as TripPhotoAlbumProvider[];
export const photoAccessOptions = ["view_only", "collaborative", "upload_request"] satisfies TripPhotoAlbumAccess[];

export function countPhotoProviders(albums: TripPhotoAlbumLink[]): Record<PhotoProviderFilter, number> {
  const counts = Object.fromEntries(photoProviders.map((provider) => [provider, 0])) as Record<PhotoProviderFilter, number>;
  counts.all = albums.length;
  for (const album of albums) {
    counts[album.provider] += 1;
  }
  return counts;
}

export function photoProviderLabel(provider: TripPhotoAlbumProvider | "all", copy: PhotoCopy): string {
  return copy.providers[provider];
}

export function photoAccessLabel(access: TripPhotoAlbumAccess, copy: PhotoCopy): string {
  return copy.accessLabels[access];
}

export function photoAlbumLinkHost(href: string | null): string | null {
  if (!href) return null;
  try {
    return new URL(href).host;
  } catch {
    return null;
  }
}
