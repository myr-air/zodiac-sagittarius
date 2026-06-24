import { useMemo } from "react";
import {
  buildPhotoAlbumSummary,
  findPhotoAlbumRelations,
} from "@/src/trip/photo-albums";
import type { Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import {
  countPhotoProviders,
  selectedPhotoAlbum,
  visiblePhotoAlbumsForProvider,
} from "../model/photo-page-selectors";
import type {
  CreatePhotoAlbumHandler,
  DeletePhotoAlbumHandler,
  UpdatePhotoAlbumHandler,
} from "../TripPhotosPage.types";
import { usePhotoAlbumBrowserState } from "./usePhotoAlbumBrowserState";
import { usePhotoAlbumModalState } from "./usePhotoAlbumModalState";

interface UseTripPhotosPageStateInput {
  onCreatePhotoAlbum: CreatePhotoAlbumHandler;
  onDeletePhotoAlbum: DeletePhotoAlbumHandler;
  onUpdatePhotoAlbum: UpdatePhotoAlbumHandler;
  photoAlbumLinks: TripPhotoAlbumLink[];
  trip: Trip;
}

export function useTripPhotosPageState({
  onCreatePhotoAlbum,
  onDeletePhotoAlbum,
  onUpdatePhotoAlbum,
  photoAlbumLinks,
  trip,
}: UseTripPhotosPageStateInput) {
  const {
    activeProvider,
    selectedAlbumId,
    setActiveProvider,
    setSelectedAlbumId,
  } = usePhotoAlbumBrowserState({ photoAlbumLinks });
  const {
    confirmDelete,
    deleteAlbum,
    dialogAlbum,
    setDeleteAlbum,
    setDialogAlbum,
    submitAlbum,
  } = usePhotoAlbumModalState({
    onCreatePhotoAlbum,
    onDeletePhotoAlbum,
    onUpdatePhotoAlbum,
  });
  const summary = useMemo(() => buildPhotoAlbumSummary(photoAlbumLinks), [photoAlbumLinks]);
  const providerCounts = useMemo(() => countPhotoProviders(photoAlbumLinks), [photoAlbumLinks]);
  const visibleAlbums = useMemo(
    () => visiblePhotoAlbumsForProvider(photoAlbumLinks, activeProvider),
    [activeProvider, photoAlbumLinks],
  );
  const selectedAlbum = selectedPhotoAlbum(visibleAlbums, selectedAlbumId);
  const selectedRelations = selectedAlbum ? findPhotoAlbumRelations(selectedAlbum, trip) : null;

  return {
    activeProvider,
    confirmDelete,
    deleteAlbum,
    dialogAlbum,
    providerCounts,
    selectedAlbum,
    selectedRelations,
    setActiveProvider,
    setDeleteAlbum,
    setDialogAlbum,
    setSelectedAlbumId,
    submitAlbum,
    summary,
    visibleAlbums,
  };
}
