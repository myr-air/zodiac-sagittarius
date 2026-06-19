import type {
  CreatePhotoAlbumApiRequest,
  PatchPhotoAlbumApiRequest,
} from "./api-client";
import { safeExternalHref } from "./safe-links";
import type { ItineraryItem, Member, Trip, TripPhotoAlbumAccess, TripPhotoAlbumLink, TripPhotoAlbumProvider } from "./types";

export interface PhotoAlbumSummary {
  total: number;
  collaborative: number;
  uploadRequests: number;
  missingAccessNotes: number;
}

export interface PhotoAlbumFilters {
  query?: string;
  provider?: TripPhotoAlbumProvider | "all";
  access?: TripPhotoAlbumAccess | "all";
  day?: string | "all";
}

export interface PhotoAlbumRelations {
  owner: Member | null;
  itineraryItems: ItineraryItem[];
}

export type PhotoAlbumInputForApi = Pick<
  TripPhotoAlbumLink,
  "access" | "provider" | "relatedItineraryItemIds" | "title" | "url"
> &
  Partial<
    Pick<
      TripPhotoAlbumLink,
      "accessNote" | "coverUrl" | "day" | "description" | "ownerMemberId"
    >
  >;

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

export interface BuildCreatePhotoAlbumRequestOptions {
  clientMutationId: string;
}

export interface BuildPatchPhotoAlbumRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

export function buildPhotoAlbumSummary(albums: TripPhotoAlbumLink[]): PhotoAlbumSummary {
  return {
    total: albums.length,
    collaborative: albums.filter((album) => album.access === "collaborative").length,
    uploadRequests: albums.filter((album) => album.access === "upload_request").length,
    missingAccessNotes: albums.filter((album) => !album.accessNote?.trim()).length,
  };
}

export function filterPhotoAlbumLinks(albums: TripPhotoAlbumLink[], filters: PhotoAlbumFilters): TripPhotoAlbumLink[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return albums.filter((album) => {
    if (filters.provider && filters.provider !== "all" && album.provider !== filters.provider) return false;
    if (filters.access && filters.access !== "all" && album.access !== filters.access) return false;
    if (filters.day && filters.day !== "all" && album.day !== filters.day) return false;
    if (!query) return true;
    return [
      album.title,
      album.provider,
      album.access,
      album.description,
      album.accessNote,
      album.url,
    ].some((value) => value?.toLowerCase().includes(query));
  });
}

export function safePhotoAlbumHref(value: string | null | undefined): string | null {
  return safeExternalHref(value) || null;
}

export function safePhotoAlbumCoverHref(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  return safePhotoAlbumHref(trimmed);
}

export function serializePhotoAlbumInputForApi(input: PhotoAlbumInputForApi) {
  return {
    ...input,
    title: input.title.trim(),
    url: input.url.trim(),
    description: input.description?.trim() || null,
    accessNote: input.accessNote?.trim() || null,
    coverUrl: input.coverUrl?.trim() || null,
    day: input.day?.trim() || null,
  };
}

export function normalizePhotoAlbumCreateInput(
  input: PhotoAlbumInputForApi,
): PhotoAlbumInputForApi | null {
  const title = input.title.trim();
  const url = input.url.trim();
  if (!title || !url) return null;

  return {
    ...input,
    title,
    url,
  };
}

export function buildCreatePhotoAlbumRequest(
  input: PhotoAlbumInputForApi,
  options: BuildCreatePhotoAlbumRequestOptions,
): CreatePhotoAlbumApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    ...serializePhotoAlbumInputForApi(input),
  };
}

export function buildPatchPhotoAlbumRequest(
  input: PhotoAlbumInputForApi,
  options: BuildPatchPhotoAlbumRequestOptions,
): PatchPhotoAlbumApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: serializePhotoAlbumInputForApi(input),
  };
}

export function createLocalPhotoAlbum(
  trip: Pick<Trip, "id" | "photoAlbumLinks">,
  input: PhotoAlbumInputForApi,
  options: LocalPhotoAlbumCreateOptions,
): TripPhotoAlbumLink {
  const albums = trip.photoAlbumLinks ?? [];

  return {
    ...input,
    id: options.nextPhotoAlbumId(albums),
    tripId: trip.id,
    title: options.title,
    url: options.url,
    description: input.description?.trim() || null,
    accessNote: input.accessNote?.trim() || null,
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
  input: PhotoAlbumInputForApi,
  options: LocalPhotoAlbumUpdateOptions,
): TripPhotoAlbumLink {
  return {
    ...album,
    ...input,
    title: options.title,
    url: options.url,
    description: input.description?.trim() || null,
    accessNote: input.accessNote?.trim() || null,
    updatedAt: options.updatedAt,
    version: album.version + 1,
  };
}

export function updateLocalPhotoAlbumInTrip<T extends Pick<Trip, "photoAlbumLinks">>(
  trip: T,
  albumId: string,
  input: PhotoAlbumInputForApi,
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

export function findPhotoAlbumRelations(album: TripPhotoAlbumLink, trip: Trip): PhotoAlbumRelations {
  const relatedItemIds = new Set(album.relatedItineraryItemIds);
  return {
    owner: trip.members.find((member) => member.id === album.ownerMemberId) ?? null,
    itineraryItems: trip.itineraryItems.filter((item) => relatedItemIds.has(item.id)),
  };
}
