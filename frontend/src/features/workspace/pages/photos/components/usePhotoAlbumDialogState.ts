import { useState, type FormEvent } from "react";
import { toggleId } from "@/src/shared/collection";
import type {
  Member,
  Trip,
  TripPhotoAlbumLink,
} from "@/src/trip/types";
import type { SubmitPhotoAlbumHandler } from "../TripPhotosPage.types";
import {
  buildPhotoAlbumDialogSubmitInput,
  initialPhotoAlbumDialogFields,
  photoAlbumDialogDayOptions,
} from "../model/photo-album-dialog-fields";

interface PhotoAlbumDialogStateInput {
  album: TripPhotoAlbumLink | null;
  currentMember: Member;
  trip: Trip;
  onSubmit: SubmitPhotoAlbumHandler;
}

export function usePhotoAlbumDialogState({
  album,
  currentMember,
  trip,
  onSubmit,
}: PhotoAlbumDialogStateInput) {
  const initialFields = initialPhotoAlbumDialogFields({ album, currentMember });
  const [title, setTitle] = useState(initialFields.title);
  const [provider, setProvider] = useState(initialFields.provider);
  const [access, setAccess] = useState(initialFields.access);
  const [url, setUrl] = useState(initialFields.url);
  const [ownerMemberId, setOwnerMemberId] = useState(
    initialFields.ownerMemberId,
  );
  const [day, setDay] = useState(initialFields.day);
  const [description, setDescription] = useState(initialFields.description);
  const [accessNote, setAccessNote] = useState(initialFields.accessNote);
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(
    initialFields.relatedItineraryItemIds,
  );
  const days = photoAlbumDialogDayOptions(trip);

  function toggleRelatedItem(itemId: string) {
    setRelatedItineraryItemIds((current) => toggleId(current, itemId));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(buildPhotoAlbumDialogSubmitInput({
      album,
      fields: {
        access,
        accessNote,
        day,
        description,
        ownerMemberId,
        provider,
        relatedItineraryItemIds,
        title,
        url,
      },
    }));
  }

  return {
    access,
    accessNote,
    day,
    days,
    description,
    ownerMemberId,
    provider,
    relatedItineraryItemIds,
    setAccess,
    setAccessNote,
    setDay,
    setDescription,
    setOwnerMemberId,
    setProvider,
    setTitle,
    setUrl,
    submit,
    title,
    toggleRelatedItem,
    url,
  };
}

export type PhotoAlbumDialogState = ReturnType<typeof usePhotoAlbumDialogState>;
