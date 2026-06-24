import type { Member, Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import type { PhotoAlbumInput } from "@/src/trip/photo-albums";
import type { WorkspaceMutationResult } from "../../model/workspace-action-types";

export type TripPhotoAlbumInput = PhotoAlbumInput;

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
