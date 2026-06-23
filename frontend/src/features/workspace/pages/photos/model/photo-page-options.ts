import {
  tripPhotoAlbumAccessValues,
  tripPhotoAlbumProviderValues,
} from "@/src/trip/photo-albums";
import type {
  TripPhotoAlbumAccess,
  TripPhotoAlbumProvider,
} from "@/src/trip/types";
import type { IconName } from "@/src/ui/icons";
import type { BadgeTone } from "@/src/ui/primitive-badge-styles";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";

export const photoProviders = ["all", ...tripPhotoAlbumProviderValues] as const;
export type PhotoProviderFilter = (typeof photoProviders)[number];

export const photoProviderOptions = tripPhotoAlbumProviderValues;
export const photoAccessOptions = tripPhotoAlbumAccessValues;

export interface PhotoSelectOption<Value extends string = string> {
  value: Value;
  label: string;
}

export function photoProviderLabel(provider: PhotoProviderFilter, copy: PhotoCopy): string {
  return copy.providers[provider];
}

export function photoProviderIcon(provider: PhotoProviderFilter): IconName {
  if (provider === "all") return "layout";
  if (provider === "dropbox") return "import";
  return "cloud";
}

export function photoAccessLabel(access: TripPhotoAlbumAccess, copy: PhotoCopy): string {
  return copy.accessLabels[access];
}

export function photoProviderSelectOptions(copy: PhotoCopy): PhotoSelectOption<TripPhotoAlbumProvider>[] {
  return photoProviderOptions.map((value) => ({ value, label: photoProviderLabel(value, copy) }));
}

export function photoAccessSelectOptions(copy: PhotoCopy): PhotoSelectOption<TripPhotoAlbumAccess>[] {
  return photoAccessOptions.map((value) => ({ value, label: photoAccessLabel(value, copy) }));
}

export function photoAccessBadgeTone(access: TripPhotoAlbumAccess): BadgeTone {
  if (access === "collaborative") return "primary";
  if (access === "upload_request") return "warning";
  return "route";
}
