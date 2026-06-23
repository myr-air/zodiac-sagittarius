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
  UpdatePhotoAlbumHandler,
} from "../TripPhotosPage.types";
import { usePhotoAlbumModalActions } from "./usePhotoAlbumModalActions";

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

  const {
    confirmDelete,
    submitAlbum,
  } = usePhotoAlbumModalActions({
    modalState,
    onCreatePhotoAlbum,
    onDeletePhotoAlbum,
    onUpdatePhotoAlbum,
    updateModalState,
  });

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
