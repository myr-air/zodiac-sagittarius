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
  type PhotoAlbumDialogFields,
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
  const [formFields, setFormFields] =
    useState<PhotoAlbumDialogFields>(initialFields);
  const days = photoAlbumDialogDayOptions(trip);

  function updateFormField<Field extends keyof PhotoAlbumDialogFields>(
    field: Field,
    value: PhotoAlbumDialogFields[Field],
  ) {
    setFormFields((current) => ({ ...current, [field]: value }));
  }

  function toggleRelatedItem(itemId: string) {
    setFormFields((current) => ({
      ...current,
      relatedItineraryItemIds: toggleId(current.relatedItineraryItemIds, itemId),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(buildPhotoAlbumDialogSubmitInput({
      album,
      fields: formFields,
    }));
  }

  return {
    access: formFields.access,
    accessNote: formFields.accessNote,
    day: formFields.day,
    days,
    description: formFields.description,
    ownerMemberId: formFields.ownerMemberId,
    provider: formFields.provider,
    relatedItineraryItemIds: formFields.relatedItineraryItemIds,
    setAccess: (access: PhotoAlbumDialogFields["access"]) =>
      updateFormField("access", access),
    setAccessNote: (accessNote: string) =>
      updateFormField("accessNote", accessNote),
    setDay: (day: string) => updateFormField("day", day),
    setDescription: (description: string) =>
      updateFormField("description", description),
    setOwnerMemberId: (ownerMemberId: string) =>
      updateFormField("ownerMemberId", ownerMemberId),
    setProvider: (provider: PhotoAlbumDialogFields["provider"]) =>
      updateFormField("provider", provider),
    setTitle: (title: string) => updateFormField("title", title),
    setUrl: (url: string) => updateFormField("url", url),
    submit,
    title: formFields.title,
    toggleRelatedItem,
    url: formFields.url,
  };
}

export type PhotoAlbumDialogState = ReturnType<typeof usePhotoAlbumDialogState>;
