import type {
  Member,
  Trip,
  TripPhotoAlbumAccess,
  TripPhotoAlbumLink,
  TripPhotoAlbumProvider,
} from "@/src/trip/types";
import type { WorkspaceMutationResult } from "../../model/workspace-action-types";

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

export type TripPhotoAlbumMutationResult = WorkspaceMutationResult;

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

export interface TripPhotosPageProps {
  trip: Trip;
  currentMember: Member;
  photoAlbumLinks: TripPhotoAlbumLink[];
  canEditPhotoAlbums: boolean;
  onCreatePhotoAlbum: CreatePhotoAlbumHandler;
  onUpdatePhotoAlbum: UpdatePhotoAlbumHandler;
  onDeletePhotoAlbum: DeletePhotoAlbumHandler;
}
