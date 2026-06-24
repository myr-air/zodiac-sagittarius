import type { Member, Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import { PhotoAlbumDeleteDialog } from "./PhotoAlbumDeleteDialog";
import { PhotoAlbumDialog } from "./PhotoAlbumDialog";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import type { SubmitPhotoAlbumHandler } from "../TripPhotosPage.types";

interface PhotoAlbumDialogLayerProps {
  copy: PhotoCopy;
  currentMember: Member;
  deleteAlbum: TripPhotoAlbumLink | null;
  dialogAlbum: TripPhotoAlbumLink | "new" | null;
  trip: Trip;
  onCancelDelete: () => void;
  onCancelDialog: () => void;
  onConfirmDelete: () => void;
  onSubmitAlbum: SubmitPhotoAlbumHandler;
}

export function PhotoAlbumDialogLayer({
  copy,
  currentMember,
  deleteAlbum,
  dialogAlbum,
  trip,
  onCancelDelete,
  onCancelDialog,
  onConfirmDelete,
  onSubmitAlbum,
}: PhotoAlbumDialogLayerProps) {
  return (
    <>
      {dialogAlbum ? (
        <PhotoAlbumDialog
          album={dialogAlbum === "new" ? null : dialogAlbum}
          currentMember={currentMember}
          trip={trip}
          onCancel={onCancelDialog}
          onSubmit={onSubmitAlbum}
          copy={copy}
        />
      ) : null}

      {deleteAlbum ? (
        <PhotoAlbumDeleteDialog
          album={deleteAlbum}
          copy={copy}
          onCancel={onCancelDelete}
          onConfirm={onConfirmDelete}
        />
      ) : null}
    </>
  );
}
