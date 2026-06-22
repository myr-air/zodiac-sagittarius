import type {
  CreatePhotoAlbumApiRequest,
  PatchPhotoAlbumApiRequest,
} from "../api-client";
import type { PhotoAlbumInput } from "./photo-album-inputs";

export interface BuildCreatePhotoAlbumRequestOptions {
  clientMutationId: string;
}

export interface BuildPatchPhotoAlbumRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

export function serializePhotoAlbumInputForApi(input: PhotoAlbumInput) {
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

export function buildCreatePhotoAlbumRequest(
  input: PhotoAlbumInput,
  options: BuildCreatePhotoAlbumRequestOptions,
): CreatePhotoAlbumApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    ...serializePhotoAlbumInputForApi(input),
  };
}

export function buildPatchPhotoAlbumRequest(
  input: PhotoAlbumInput,
  options: BuildPatchPhotoAlbumRequestOptions,
): PatchPhotoAlbumApiRequest {
  return {
    clientMutationId: options.clientMutationId,
    expectedVersion: options.expectedVersion,
    patch: serializePhotoAlbumInputForApi(input),
  };
}
