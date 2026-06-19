import type {
  CreatePhotoAlbumApiRequest,
  PatchPhotoAlbumApiRequest,
} from "./api-client";
import type { PhotoAlbumInputForApi } from "./photo-album-inputs";

export interface BuildCreatePhotoAlbumRequestOptions {
  clientMutationId: string;
}

export interface BuildPatchPhotoAlbumRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
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
