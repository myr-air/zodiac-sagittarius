import {
  normalizeSearchQuery,
  valuesMatchSearchQuery,
} from "@/src/shared/text-search";
import { findById } from "@/src/shared/collection";
import { findMemberById } from "../members";
import { safeExternalHref } from "../places";
import type {
  ItineraryItem,
  Member,
  Trip,
  TripPhotoAlbumAccess,
  TripPhotoAlbumLink,
  TripPhotoAlbumProvider,
} from "../types";

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
  createdBy: Member | null;
  owner: Member | null;
  itineraryItems: ItineraryItem[];
}

export function buildPhotoAlbumSummary(
  albums: TripPhotoAlbumLink[],
): PhotoAlbumSummary {
  return {
    total: albums.length,
    collaborative: albums.filter((album) => album.access === "collaborative").length,
    uploadRequests: albums.filter((album) => album.access === "upload_request").length,
    missingAccessNotes: albums.filter((album) => !album.accessNote?.trim()).length,
  };
}

export function filterPhotoAlbumLinks(
  albums: TripPhotoAlbumLink[],
  filters: PhotoAlbumFilters,
): TripPhotoAlbumLink[] {
  const query = normalizeSearchQuery(filters.query);
  return albums.filter((album) => {
    if (filters.provider && filters.provider !== "all" && album.provider !== filters.provider) return false;
    if (filters.access && filters.access !== "all" && album.access !== filters.access) return false;
    if (filters.day && filters.day !== "all" && album.day !== filters.day) return false;
    return valuesMatchSearchQuery([
      album.title,
      album.provider,
      album.access,
      album.description,
      album.accessNote,
      album.url,
    ], query);
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

export function findPhotoAlbumById(
  albums: readonly TripPhotoAlbumLink[],
  albumId: string | null | undefined,
): TripPhotoAlbumLink | null {
  return findById(albums, albumId);
}

export function findPhotoAlbumRelations(
  album: TripPhotoAlbumLink,
  trip: Trip,
): PhotoAlbumRelations {
  const relatedItemIds = new Set(album.relatedItineraryItemIds);
  return {
    createdBy: findMemberById(trip.members, album.createdBy) ?? null,
    owner: findMemberById(trip.members, album.ownerMemberId) ?? null,
    itineraryItems: trip.itineraryItems.filter((item) => relatedItemIds.has(item.id)),
  };
}
