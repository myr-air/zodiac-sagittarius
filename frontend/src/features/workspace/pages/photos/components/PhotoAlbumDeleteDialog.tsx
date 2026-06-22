import { WorkspaceConfirmDialog } from "@/src/shared/components/workspace-dialog";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";

interface PhotoAlbumDeleteDialogProps {
  album: TripPhotoAlbumLink;
  copy: PhotoCopy;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PhotoAlbumDeleteDialog({
  album,
  copy,
  onCancel,
  onConfirm,
}: PhotoAlbumDeleteDialogProps) {
  return (
    <WorkspaceConfirmDialog
      body={copy.deletePrompt(album.title)}
      cancelLabel={copy.cancel}
      confirmLabel={copy.deleteAlbum}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={copy.deleteAlbum}
    />
  );
}
