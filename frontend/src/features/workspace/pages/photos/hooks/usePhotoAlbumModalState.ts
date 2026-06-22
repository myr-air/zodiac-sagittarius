import { useState } from "react";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
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

interface UsePhotoAlbumModalStateInput {
  onCreatePhotoAlbum: CreatePhotoAlbumHandler;
  onDeletePhotoAlbum: DeletePhotoAlbumHandler;
  onUpdatePhotoAlbum: UpdatePhotoAlbumHandler;
}

export function usePhotoAlbumModalState({
  onCreatePhotoAlbum,
  onDeletePhotoAlbum,
  onUpdatePhotoAlbum,
}: UsePhotoAlbumModalStateInput) {
  const [modalState, setModalState] = useState<PhotoAlbumModalState>(
    initialPhotoAlbumModalState,
  );

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
    confirmDelete,
    deleteAlbum: modalState.deleteAlbum,
    dialogAlbum: modalState.dialogAlbum,
    setDeleteAlbum: (deleteAlbum: TripPhotoAlbumLink | null) =>
      updateModalState("deleteAlbum", deleteAlbum),
    setDialogAlbum: (dialogAlbum: TripPhotoAlbumLink | "new" | null) =>
      updateModalState("dialogAlbum", dialogAlbum),
    submitAlbum,
  };
}
