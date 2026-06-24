import {
  displayNameOrFallback,
  displayNullableTextOrFallback,
  displayTextOrFallback,
} from "@/src/shared/text-parts";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";

type DisplayMember = {
  displayName: string;
};

export function photoAlbumSummaryDisplay(
  album: Pick<TripPhotoAlbumLink, "accessNote" | "description">,
  copy: Pick<PhotoCopy, "defaultAccessNote">,
): string {
  return album.accessNote || album.description || copy.defaultAccessNote;
}

export function photoAlbumAccessNoteDisplay(
  album: Pick<TripPhotoAlbumLink, "accessNote">,
  copy: Pick<PhotoCopy, "noAccessNote">,
): string {
  return displayTextOrFallback(album.accessNote, copy.noAccessNote);
}

export function photoAlbumDayDisplay(
  day: string | null | undefined,
  copy: Pick<PhotoCopy, "tripLevel">,
): string {
  return day ?? copy.tripLevel;
}

export function photoAlbumHostDisplay(
  host: string | null,
  copy: Pick<PhotoCopy, "blockedLink">,
): string {
  return displayNullableTextOrFallback(host, copy.blockedLink);
}

export function photoAlbumOwnerDisplay(
  owner: DisplayMember | null | undefined,
  fallback: string,
): string {
  return displayNameOrFallback(owner, fallback);
}
