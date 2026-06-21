import { useCallback } from "react";
import { nextLocalPhotoAlbumId } from "@/src/trip/identity";
import {
  appendPhotoAlbumToTrip,
  createLocalPhotoAlbum,
  removePhotoAlbumFromTrip,
  type PhotoAlbumInputForApi,
  updateLocalPhotoAlbumInTrip,
} from "@/src/trip/photo-albums";
import type { Trip } from "@/src/trip/types";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";

interface UseWorkspaceLocalPhotoAlbumCommandsOptions {
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  trip: Trip;
}

export function useWorkspaceLocalPhotoAlbumCommands({
  commitTrip,
  currentMemberId,
  trip,
}: UseWorkspaceLocalPhotoAlbumCommandsOptions) {
  const createLocalWorkspacePhotoAlbum = useCallback(
    async (input: PhotoAlbumInputForApi) => {
      const photoAlbum = createLocalPhotoAlbum(trip, input, {
        title: input.title,
        url: input.url,
        createdBy: currentMemberId,
        updatedAt: workspaceLocalMutationTimestamp,
        nextPhotoAlbumId: nextLocalPhotoAlbumId,
      });
      commitTrip((current) => appendPhotoAlbumToTrip(current, photoAlbum));
    },
    [commitTrip, currentMemberId, trip],
  );

  const updateLocalWorkspacePhotoAlbum = useCallback(
    async (albumId: string, input: PhotoAlbumInputForApi) => {
      commitTrip((current) =>
        updateLocalPhotoAlbumInTrip(current, albumId, input, {
          title: input.title.trim(),
          url: input.url.trim(),
          updatedAt: workspaceLocalMutationTimestamp,
        }),
      );
    },
    [commitTrip],
  );

  const deleteLocalWorkspacePhotoAlbum = useCallback(
    async (albumId: string) => {
      commitTrip((current) => removePhotoAlbumFromTrip(current, albumId));
    },
    [commitTrip],
  );

  return {
    createLocalWorkspacePhotoAlbum,
    deleteLocalWorkspacePhotoAlbum,
    updateLocalWorkspacePhotoAlbum,
  };
}
