import { WorkspaceDialog } from "@/src/shared/components/workspace-dialog";
import type { Member, Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import { Button } from "@/src/ui";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import type { SubmitPhotoAlbumHandler } from "../TripPhotosPage.types";
import { usePhotoAlbumDialogState } from "../hooks/usePhotoAlbumDialogState";
import { PhotoAlbumDialogFields } from "./PhotoAlbumDialogFields";
import { PhotoAlbumDialogRelatedItems } from "./PhotoAlbumDialogRelatedItems";

interface PhotoAlbumDialogProps {
  album: TripPhotoAlbumLink | null;
  copy: PhotoCopy;
  currentMember: Member;
  trip: Trip;
  onCancel: () => void;
  onSubmit: SubmitPhotoAlbumHandler;
}

export function PhotoAlbumDialog({
  album,
  copy,
  currentMember,
  trip,
  onCancel,
  onSubmit,
}: PhotoAlbumDialogProps) {
  const state = usePhotoAlbumDialogState({
    album,
    currentMember,
    trip,
    onSubmit,
  });
  const title = album ? copy.editAlbumDialog : copy.addAlbumDialog;

  return (
    <WorkspaceDialog
      ariaLabel={title}
      className={photoStyles.dialogClassName}
      closeAriaLabel={copy.close}
      formClassName={photoStyles.dialogFormClassName}
      onClose={onCancel}
      onSubmit={(event) => void state.submit(event)}
      title={title}
    >
      <PhotoAlbumDialogFields copy={copy} state={state} trip={trip} />
      <PhotoAlbumDialogRelatedItems copy={copy} state={state} trip={trip} />
      <div className={photoStyles.dialogActionsClassName}>
        <Button type="button" variant="ghost" onClick={onCancel}>{copy.cancel}</Button>
        <Button type="submit">{copy.saveAlbum}</Button>
      </div>
    </WorkspaceDialog>
  );
}
