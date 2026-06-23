import { useState } from "react";
import {
  toggleIdFieldState,
  updateFieldState,
} from "@/src/shared/form-state";
import type {
  Member,
  TripPhotoAlbumLink,
} from "@/src/trip/types";
import {
  initialPhotoAlbumDialogFields,
  type PhotoAlbumDialogFields,
} from "../model/photo-album-dialog-fields";
import type { SubmitPhotoAlbumHandler } from "../TripPhotosPage.types";
import { usePhotoAlbumDialogActions } from "./usePhotoAlbumDialogActions";

interface PhotoAlbumDialogStateInput {
  album: TripPhotoAlbumLink | null;
  currentMember: Member;
  onSubmit: SubmitPhotoAlbumHandler;
}

export function usePhotoAlbumDialogState({
  album,
  currentMember,
  onSubmit,
}: PhotoAlbumDialogStateInput) {
  const initialFields = initialPhotoAlbumDialogFields({ album, currentMember });
  const [formFields, setFormFields] =
    useState<PhotoAlbumDialogFields>(initialFields);

  function updateFormField<Field extends keyof PhotoAlbumDialogFields>(
    field: Field,
    value: PhotoAlbumDialogFields[Field],
  ) {
    setFormFields((current) => updateFieldState(current, field, value));
  }

  function toggleRelatedItem(itemId: string) {
    setFormFields((current) =>
      toggleIdFieldState(current, "relatedItineraryItemIds", itemId),
    );
  }

  const { submit } = usePhotoAlbumDialogActions({
    album,
    formFields,
    onSubmit,
  });

  return {
    access: formFields.access,
    accessNote: formFields.accessNote,
    day: formFields.day,
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
