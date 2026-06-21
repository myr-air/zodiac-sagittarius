import type { TripPhotoAlbumAccess, TripPhotoAlbumProvider } from "@/src/trip/types";

export interface TripPhotoAlbumInput {
  title: string;
  provider: TripPhotoAlbumProvider;
  url: string;
  access: TripPhotoAlbumAccess;
  ownerMemberId?: string | null;
  relatedItineraryItemIds: string[];
  day?: string | null;
  description?: string | null;
  accessNote?: string | null;
  coverUrl?: string | null;
}

export type TripPhotoAlbumMutationResult = void | Promise<void>;

export type CreatePhotoAlbumHandler = (
  input: TripPhotoAlbumInput,
) => TripPhotoAlbumMutationResult;

export type UpdatePhotoAlbumHandler = (
  albumId: string,
  input: TripPhotoAlbumInput,
) => TripPhotoAlbumMutationResult;

export type DeletePhotoAlbumHandler = (
  albumId: string,
) => TripPhotoAlbumMutationResult;

export type SubmitPhotoAlbumHandler = (
  input: TripPhotoAlbumInput,
) => TripPhotoAlbumMutationResult;
