import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import { nextClientMutationId } from "@/src/trip/local-ids";
import {
  appendPhotoAlbumToTrip,
  buildCreatePhotoAlbumRequest,
  buildPatchPhotoAlbumRequest,
  removePhotoAlbumFromTrip,
  replacePhotoAlbumInTrip,
  type PhotoAlbumInputForApi,
} from "@/src/trip/photo-albums";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

interface UseWorkspaceApiPhotoAlbumCommandsOptions {
  apiClient?: TripApiClient;
  latestTripRef: MutableRefObject<Trip>;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (trip: Trip) => void;
  setTripState: (state: { trip: Trip; past: Trip[]; future: Trip[] }) => void;
  tripId: string;
}

export function useWorkspaceApiPhotoAlbumCommands({
  apiClient,
  latestTripRef,
  participantSession,
  replaceApiTrip,
  setTripState,
  tripId,
}: UseWorkspaceApiPhotoAlbumCommandsOptions) {
  const createApiPhotoAlbum = useCallback(
    async (input: PhotoAlbumInputForApi) => {
      if (!apiClient || !participantSession) return;
      const photoAlbum = await apiClient.createPhotoAlbum(
        tripId,
        participantSession.sessionToken,
        buildCreatePhotoAlbumRequest(input, {
          clientMutationId: nextClientMutationId("photo-album-create"),
        }),
      );
      replaceApiTrip(
        appendPhotoAlbumToTrip(latestTripRef.current, photoAlbum),
      );
    },
    [apiClient, latestTripRef, participantSession, replaceApiTrip, tripId],
  );

  const updateApiPhotoAlbum = useCallback(
    async (albumId: string, input: PhotoAlbumInputForApi) => {
      if (!apiClient || !participantSession) return;
      const currentTrip = latestTripRef.current;
      const photoAlbum = currentTrip.photoAlbumLinks?.find(
        (candidate) => candidate.id === albumId,
      );
      if (!photoAlbum) return;

      try {
        const patchedPhotoAlbum = await apiClient.patchPhotoAlbum(
          tripId,
          albumId,
          participantSession.sessionToken,
          buildPatchPhotoAlbumRequest(input, {
            clientMutationId: nextClientMutationId("photo-album-patch"),
            expectedVersion: photoAlbum.version,
          }),
        );
        replaceApiTrip(
          replacePhotoAlbumInTrip(latestTripRef.current, patchedPhotoAlbum),
        );
      } catch (error) {
        if (isVersionConflict(error)) {
          const latest = await apiClient.loadTrip(
            tripId,
            participantSession.sessionToken,
          );
          latestTripRef.current = latest.trip;
          setTripState({ trip: latest.trip, past: [], future: [] });
          return;
        }
        throw error;
      }
    },
    [
      apiClient,
      latestTripRef,
      participantSession,
      replaceApiTrip,
      setTripState,
      tripId,
    ],
  );

  const deleteApiPhotoAlbum = useCallback(
    async (albumId: string) => {
      if (!apiClient || !participantSession) return;
      await apiClient.deletePhotoAlbum(
        tripId,
        albumId,
        participantSession.sessionToken,
      );
      replaceApiTrip(removePhotoAlbumFromTrip(latestTripRef.current, albumId));
    },
    [apiClient, latestTripRef, participantSession, replaceApiTrip, tripId],
  );

  return {
    createApiPhotoAlbum,
    deleteApiPhotoAlbum,
    updateApiPhotoAlbum,
  };
}
