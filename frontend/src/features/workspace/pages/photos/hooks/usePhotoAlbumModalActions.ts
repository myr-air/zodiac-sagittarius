import type { PhotoAlbumModalState } from "../model/photo-page-state";
import type {
  CreatePhotoAlbumHandler,
  DeletePhotoAlbumHandler,
  TripPhotoAlbumInput,
  UpdatePhotoAlbumHandler,
} from "../TripPhotosPage.types";

type UpdatePhotoAlbumModalState = <Field extends keyof PhotoAlbumModalState>(
  field: Field,
  value: PhotoAlbumModalState[Field],
) => void;

interface UsePhotoAlbumModalActionsInput {
  modalState: PhotoAlbumModalState;
  onCreatePhotoAlbum: CreatePhotoAlbumHandler;
  onDeletePhotoAlbum: DeletePhotoAlbumHandler;
  onUpdatePhotoAlbum: UpdatePhotoAlbumHandler;
  updateModalState: UpdatePhotoAlbumModalState;
}

export function usePhotoAlbumModalActions({
  modalState,
  onCreatePhotoAlbum,
  onDeletePhotoAlbum,
  onUpdatePhotoAlbum,
  updateModalState,
}: UsePhotoAlbumModalActionsInput) {
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
    submitAlbum,
  };
}
