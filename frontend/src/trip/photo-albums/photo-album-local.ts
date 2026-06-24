import { trimmedTextOrNull } from "@/src/shared/text-parts";
import type { PhotoAlbumInput } from "./photo-album-inputs";
import type { Trip, TripPhotoAlbumLink } from "../types";

export interface LocalPhotoAlbumCreateOptions {
  title: string;
  url: string;
  createdBy: string;
  updatedAt: string;
  nextPhotoAlbumId: (albums: TripPhotoAlbumLink[]) => string;
}

export interface LocalPhotoAlbumUpdateOptions {
  title: string;
  url: string;
  updatedAt: string;
}

export function normalizePhotoAlbumCreateInput(
  input: PhotoAlbumInput,
): PhotoAlbumInput | null {
  const title = input.title.trim();
  const url = input.url.trim();
  if (!title || !url) return null;

  return {
    ...input,
    title,
    url,
  };
}

export function createLocalPhotoAlbum(
  trip: Pick<Trip, "id" | "photoAlbumLinks">,
  input: PhotoAlbumInput,
  options: LocalPhotoAlbumCreateOptions,
): TripPhotoAlbumLink {
  const albums = trip.photoAlbumLinks ?? [];

  return {
    ...input,
    id: options.nextPhotoAlbumId(albums),
    tripId: trip.id,
    title: options.title,
    url: options.url,
    description: trimmedTextOrNull(input.description),
    accessNote: trimmedTextOrNull(input.accessNote),
    createdBy: options.createdBy,
    updatedAt: options.updatedAt,
    version: 1,
  };
}

export function appendPhotoAlbumToTrip<T extends Pick<Trip, "photoAlbumLinks">>(
  trip: T,
  photoAlbum: TripPhotoAlbumLink,
): T {
  return {
    ...trip,
    photoAlbumLinks: [...(trip.photoAlbumLinks ?? []), photoAlbum],
  };
}

export function replacePhotoAlbumInTrip<T extends Pick<Trip, "photoAlbumLinks">>(
  trip: T,
  photoAlbum: TripPhotoAlbumLink,
): T {
  return {
    ...trip,
    photoAlbumLinks: (trip.photoAlbumLinks ?? []).map((candidate) =>
      candidate.id === photoAlbum.id ? photoAlbum : candidate,
    ),
  };
}

export function updateLocalPhotoAlbum(
  album: TripPhotoAlbumLink,
  input: PhotoAlbumInput,
  options: LocalPhotoAlbumUpdateOptions,
): TripPhotoAlbumLink {
  return {
    ...album,
    ...input,
    title: options.title,
    url: options.url,
    description: trimmedTextOrNull(input.description),
    accessNote: trimmedTextOrNull(input.accessNote),
    updatedAt: options.updatedAt,
    version: album.version + 1,
  };
}

export function updateLocalPhotoAlbumInTrip<T extends Pick<Trip, "photoAlbumLinks">>(
  trip: T,
  albumId: string,
  input: PhotoAlbumInput,
  options: LocalPhotoAlbumUpdateOptions,
): T {
  return {
    ...trip,
    photoAlbumLinks: (trip.photoAlbumLinks ?? []).map((album) =>
      album.id === albumId
        ? updateLocalPhotoAlbum(album, input, options)
        : album,
    ),
  };
}

export function removePhotoAlbumFromTrip<T extends Pick<Trip, "photoAlbumLinks">>(
  trip: T,
  albumId: string,
): T {
  return {
    ...trip,
    photoAlbumLinks: (trip.photoAlbumLinks ?? []).filter(
      (album) => album.id !== albumId,
    ),
  };
}
