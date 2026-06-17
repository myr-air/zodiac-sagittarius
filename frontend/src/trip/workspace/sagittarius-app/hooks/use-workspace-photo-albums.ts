import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { TripPhotoAlbumInput } from "@/src/features/workspace/pages/photos";
import type { TripApiClient } from "@/src/trip/api-client";
import { isVersionConflict } from "@/src/trip/api-errors";
import { nextClientMutationId, nextLocalPhotoAlbumId } from "@/src/trip/local-ids";
import {
  appendPhotoAlbumToTrip,
  buildCreatePhotoAlbumRequest,
  buildPatchPhotoAlbumRequest,
  createLocalPhotoAlbum,
  removePhotoAlbumFromTrip,
  replacePhotoAlbumInTrip,
  updateLocalPhotoAlbumInTrip,
} from "@/src/trip/photo-albums";
import type { Trip, TripParticipantSession } from "@/src/trip/types";

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

const localMutationTimestamp = "2026-05-28T00:00:00.000Z";

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
  const createPhotoAlbum = useCallback(async (input: TripPhotoAlbumInput) => {
    if (!canEditPhotoAlbums) return;
    const title = input.title.trim();
    const url = input.url.trim();
    if (!title || !url) return;
    if (isApiMode && apiClient && participantSession) {
      const photoAlbum = await apiClient.createPhotoAlbum(
        trip.id,
        participantSession.sessionToken,
        buildCreatePhotoAlbumRequest({
          ...input,
          title,
          url,
        }, {
          clientMutationId: nextClientMutationId("photo-album-create"),
        }),
      );
      replaceApiTrip(
        appendPhotoAlbumToTrip(latestTripRef.current, photoAlbum),
      );
      return;
    }

    const photoAlbum = createLocalPhotoAlbum(trip, input, {
      title,
      url,
      createdBy: currentMemberId,
      updatedAt: localMutationTimestamp,
      nextPhotoAlbumId: nextLocalPhotoAlbumId,
    });
    commitTrip((current) => appendPhotoAlbumToTrip(current, photoAlbum));
  }, [
    apiClient,
    canEditPhotoAlbums,
    commitTrip,
    currentMemberId,
    isApiMode,
    latestTripRef,
    participantSession,
    replaceApiTrip,
    trip,
  ]);

  const updatePhotoAlbum = useCallback(async (
    albumId: string,
    input: TripPhotoAlbumInput,
  ) => {
    if (!canEditPhotoAlbums) return;
    if (isApiMode && apiClient && participantSession) {
      const currentTrip = latestTripRef.current;
      const photoAlbum = currentTrip.photoAlbumLinks?.find(
        (candidate) => candidate.id === albumId,
      );
      if (!photoAlbum) return;
      try {
        const patchedPhotoAlbum = await apiClient.patchPhotoAlbum(
          trip.id,
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
            trip.id,
            participantSession.sessionToken,
          );
          latestTripRef.current = latest.trip;
          setTripState({ trip: latest.trip, past: [], future: [] });
          return;
        }
        throw error;
      }
      return;
    }

    commitTrip((current) =>
      updateLocalPhotoAlbumInTrip(current, albumId, input, {
        title: input.title.trim(),
        url: input.url.trim(),
        updatedAt: localMutationTimestamp,
      }),
    );
  }, [
    apiClient,
    canEditPhotoAlbums,
    commitTrip,
    isApiMode,
    latestTripRef,
    participantSession,
    replaceApiTrip,
    setTripState,
    trip.id,
  ]);

  const deletePhotoAlbum = useCallback(async (albumId: string) => {
    if (!canEditPhotoAlbums) return;
    if (isApiMode && apiClient && participantSession) {
      await apiClient.deletePhotoAlbum(
        trip.id,
        albumId,
        participantSession.sessionToken,
      );
      replaceApiTrip(removePhotoAlbumFromTrip(latestTripRef.current, albumId));
      return;
    }
    commitTrip((current) => removePhotoAlbumFromTrip(current, albumId));
  }, [
    apiClient,
    canEditPhotoAlbums,
    commitTrip,
    isApiMode,
    latestTripRef,
    participantSession,
    replaceApiTrip,
    trip.id,
  ]);

  return {
    createPhotoAlbum,
    deletePhotoAlbum,
    updatePhotoAlbum,
  };
}
