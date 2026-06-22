import { useMemo, useState } from "react";
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
import {
  initialPhotoAlbumModalState,
  updatePhotoAlbumModalState,
  type PhotoAlbumModalState,
} from "../model/photo-page-state";
import type {
  CreatePhotoAlbumHandler,
  DeletePhotoAlbumHandler,
  TripPhotoAlbumInput,
  UpdatePhotoAlbumHandler,
} from "../TripPhotosPage.types";
import { usePhotoAlbumBrowserState } from "./usePhotoAlbumBrowserState";

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
  const [modalState, setModalState] = useState<PhotoAlbumModalState>(
    initialPhotoAlbumModalState,
  );
  const summary = useMemo(() => buildPhotoAlbumSummary(photoAlbumLinks), [photoAlbumLinks]);
  const providerCounts = useMemo(() => countPhotoProviders(photoAlbumLinks), [photoAlbumLinks]);
  const visibleAlbums = useMemo(
    () => visiblePhotoAlbumsForProvider(photoAlbumLinks, activeProvider),
    [activeProvider, photoAlbumLinks],
  );
  const selectedAlbum = selectedPhotoAlbum(visibleAlbums, selectedAlbumId);
  const selectedRelations = selectedAlbum ? findPhotoAlbumRelations(selectedAlbum, trip) : null;

  function updateModalState<Field extends keyof PhotoAlbumModalState>(
    field: Field,
    value: PhotoAlbumModalState[Field],
  ) {
    setModalState((current) => updatePhotoAlbumModalState(current, field, value));
  }

  async function submitAlbum(input: TripPhotoAlbumInput) {
    if (modalState.dialogAlbum === "new") {
      await onCreatePhotoAlbum(input);
    } else if (modalState.dialogAlbum) {
      await onUpdatePhotoAlbum(modalState.dialogAlbum.id, input);
    }
    updateModalState("dialogAlbum", null);
  }

  async function confirmDelete() {
    if (!modalState.deleteAlbum) return;
    await onDeletePhotoAlbum(modalState.deleteAlbum.id);
    updateModalState("deleteAlbum", null);
  }

  return {
    activeProvider,
    confirmDelete,
    deleteAlbum: modalState.deleteAlbum,
    dialogAlbum: modalState.dialogAlbum,
    providerCounts,
    selectedAlbum,
    selectedRelations,
    setActiveProvider,
    setDeleteAlbum: (deleteAlbum: TripPhotoAlbumLink | null) =>
      updateModalState("deleteAlbum", deleteAlbum),
    setDialogAlbum: (dialogAlbum: TripPhotoAlbumLink | "new" | null) =>
      updateModalState("dialogAlbum", dialogAlbum),
    setSelectedAlbumId,
    submitAlbum,
    summary,
    visibleAlbums,
  };
}
