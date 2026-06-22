import type {
  Member,
  Trip,
  TripPhotoAlbumAccess,
  TripPhotoAlbumLink,
  TripPhotoAlbumProvider,
} from "@/src/trip/types";
import type { TripPhotoAlbumInput } from "../TripPhotosPage.types";

export interface PhotoAlbumDialogFields {
  access: TripPhotoAlbumAccess;
  accessNote: string;
  day: string;
  description: string;
  ownerMemberId: string;
  provider: TripPhotoAlbumProvider;
  relatedItineraryItemIds: string[];
  title: string;
  url: string;
}

export function initialPhotoAlbumDialogFields({
  album,
  currentMember,
}: {
  album: TripPhotoAlbumLink | null;
  currentMember: Member;
}): PhotoAlbumDialogFields {
  return {
    access: album?.access ?? "collaborative",
    accessNote: album?.accessNote ?? "",
    day: album?.day ?? "",
    description: album?.description ?? "",
    ownerMemberId: album?.ownerMemberId ?? currentMember.id,
    provider: album?.provider ?? "google_photos",
    relatedItineraryItemIds: album?.relatedItineraryItemIds ?? [],
    title: album?.title ?? "",
    url: album?.url ?? "",
  };
}

export function photoAlbumDialogDayOptions(trip: Trip): string[] {
  return Array.from(new Set(trip.itineraryItems.map((item) => item.day))).sort();
}

export function buildPhotoAlbumDialogSubmitInput({
  album,
  fields,
}: {
  album: TripPhotoAlbumLink | null;
  fields: PhotoAlbumDialogFields;
}): TripPhotoAlbumInput {
  return {
    title: fields.title.trim(),
    provider: fields.provider,
    url: fields.url.trim(),
    access: fields.access,
    ownerMemberId: fields.ownerMemberId || null,
    relatedItineraryItemIds: fields.relatedItineraryItemIds,
    day: fields.day || null,
    description: fields.description.trim() || null,
    accessNote: fields.accessNote.trim() || null,
    coverUrl: album?.coverUrl ?? null,
  };
}
