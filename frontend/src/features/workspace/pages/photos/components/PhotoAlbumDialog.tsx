import type { Member, Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { PhotoCopy } from "../TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import type { TripPhotoAlbumInput } from "../TripPhotosPage.types";
import { PhotoAlbumDialogFields } from "./PhotoAlbumDialogFields";
import { PhotoAlbumDialogRelatedItems } from "./PhotoAlbumDialogRelatedItems";
import { usePhotoAlbumDialogState } from "./usePhotoAlbumDialogState";

interface PhotoAlbumDialogProps {
  album: TripPhotoAlbumLink | null;
  copy: PhotoCopy;
  currentMember: Member;
  trip: Trip;
  onCancel: () => void;
  onSubmit: (input: TripPhotoAlbumInput) => void | Promise<void>;
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

  return (
    <div className={photoStyles.dialogBackdropClassName}>
      <div className={photoStyles.dialogClassName} role="dialog" aria-modal="true" aria-label={album ? copy.editAlbumDialog : copy.addAlbumDialog}>
        <div className={photoStyles.dialogHeaderClassName}>
          <h2>{album ? copy.editAlbumDialog : copy.addAlbumDialog}</h2>
          <IconButton type="button" aria-label={copy.close} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={photoStyles.dialogFormClassName} onSubmit={(event) => void state.submit(event)}>
          <PhotoAlbumDialogFields copy={copy} state={state} trip={trip} />
          <PhotoAlbumDialogRelatedItems copy={copy} state={state} trip={trip} />
          <div className={photoStyles.dialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onCancel}>{copy.cancel}</Button>
            <Button type="submit">{copy.saveAlbum}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
