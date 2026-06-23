import {
  tripPhotoAlbumAccessValues,
  tripPhotoAlbumProviderValues,
} from "@/src/trip/photo-albums";
import type { TripPhotoAlbumAccess } from "@/src/trip/types";
import type { BadgeTone } from "@/src/ui/primitive-badge-styles";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";

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

export function photoAccessBadgeTone(access: TripPhotoAlbumAccess): BadgeTone {
  if (access === "collaborative") return "primary";
  if (access === "upload_request") return "warning";
  return "route";
}
