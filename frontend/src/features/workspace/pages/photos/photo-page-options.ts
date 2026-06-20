import {
  tripPhotoAlbumAccessValues,
  tripPhotoAlbumProviderValues,
} from "@/src/trip/trip-record-types";
import type { TripPhotoAlbumAccess } from "@/src/trip/types";
import type { PhotoCopy } from "./TripPhotosPage.copy";

export const photoProviders = ["all", ...tripPhotoAlbumProviderValues] as const;
export type PhotoProviderFilter = (typeof photoProviders)[number];

export const photoProviderOptions = tripPhotoAlbumProviderValues;
export const photoAccessOptions = tripPhotoAlbumAccessValues;

export function photoProviderLabel(provider: PhotoProviderFilter, copy: PhotoCopy): string {
  return copy.providers[provider];
}

export function photoAccessLabel(access: TripPhotoAlbumAccess, copy: PhotoCopy): string {
  return copy.accessLabels[access];
}
