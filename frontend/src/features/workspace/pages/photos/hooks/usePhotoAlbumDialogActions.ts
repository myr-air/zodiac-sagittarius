import type { FormEvent } from "react";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import {
  buildPhotoAlbumDialogSubmitInput,
  type PhotoAlbumDialogFields,
} from "../model/photo-album-dialog-fields";
import type { SubmitPhotoAlbumHandler } from "../TripPhotosPage.types";

interface UsePhotoAlbumDialogActionsInput {
  album: TripPhotoAlbumLink | null;
  formFields: PhotoAlbumDialogFields;
  onSubmit: SubmitPhotoAlbumHandler;
}

export function usePhotoAlbumDialogActions({
  album,
  formFields,
  onSubmit,
}: UsePhotoAlbumDialogActionsInput) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(buildPhotoAlbumDialogSubmitInput({
      album,
      fields: formFields,
    }));
  }

  return {
    submit,
  };
}
