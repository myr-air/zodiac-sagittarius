import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { TripPhotoAlbumInput } from "@/src/features/workspace/pages/photos/TripPhotosPage";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  normalizePhotoAlbumCreateInput,
} from "@/src/trip/photo-albums";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { useWorkspaceApiPhotoAlbumCommands } from "./photo-albums/use-workspace-api-photo-album-commands";
import { useWorkspaceLocalPhotoAlbumCommands } from "./photo-albums/use-workspace-local-photo-album-commands";

interface UseWorkspacePhotoAlbumsOptions {
  apiClient?: TripApiClient;
  canEditPhotoAlbums: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (trip: Trip) => void;
  setTripState: (state: { trip: Trip; past: Trip[]; future: Trip[] }) => void;
  trip: Trip;
}

export function useWorkspacePhotoAlbums({
  apiClient,
  canEditPhotoAlbums,
  commitTrip,
  currentMemberId,
  isApiMode,
  latestTripRef,
  participantSession,
  replaceApiTrip,
  setTripState,
  trip,
}: UseWorkspacePhotoAlbumsOptions) {
  const useApiPhotoAlbums = Boolean(isApiMode && apiClient && participantSession);
  const {
    createApiPhotoAlbum,
    deleteApiPhotoAlbum,
    updateApiPhotoAlbum,
  } = useWorkspaceApiPhotoAlbumCommands({
    apiClient,
    latestTripRef,
    participantSession,
    replaceApiTrip,
    setTripState,
    tripId: trip.id,
  });
  const {
    createLocalWorkspacePhotoAlbum,
    deleteLocalWorkspacePhotoAlbum,
    updateLocalWorkspacePhotoAlbum,
  } = useWorkspaceLocalPhotoAlbumCommands({
    commitTrip,
    currentMemberId,
    trip,
  });

  const createPhotoAlbum = useCallback(async (input: TripPhotoAlbumInput) => {
    if (!canEditPhotoAlbums) return;
    const photoAlbumInput = normalizePhotoAlbumCreateInput(input);
    if (!photoAlbumInput) return;
    if (useApiPhotoAlbums) {
      await createApiPhotoAlbum(photoAlbumInput);
      return;
    }
    await createLocalWorkspacePhotoAlbum(photoAlbumInput);
  }, [
    canEditPhotoAlbums,
    createApiPhotoAlbum,
    createLocalWorkspacePhotoAlbum,
    useApiPhotoAlbums,
  ]);

  const updatePhotoAlbum = useCallback(async (
    albumId: string,
    input: TripPhotoAlbumInput,
  ) => {
    if (!canEditPhotoAlbums) return;
    if (useApiPhotoAlbums) {
      await updateApiPhotoAlbum(albumId, input);
      return;
    }
    await updateLocalWorkspacePhotoAlbum(albumId, input);
  }, [
    canEditPhotoAlbums,
    updateApiPhotoAlbum,
    updateLocalWorkspacePhotoAlbum,
    useApiPhotoAlbums,
  ]);

  const deletePhotoAlbum = useCallback(async (albumId: string) => {
    if (!canEditPhotoAlbums) return;
    if (useApiPhotoAlbums) {
      await deleteApiPhotoAlbum(albumId);
      return;
    }
    await deleteLocalWorkspacePhotoAlbum(albumId);
  }, [
    canEditPhotoAlbums,
    deleteApiPhotoAlbum,
    deleteLocalWorkspacePhotoAlbum,
    useApiPhotoAlbums,
  ]);

  return {
    createPhotoAlbum,
    deletePhotoAlbum,
    updatePhotoAlbum,
  };
}
