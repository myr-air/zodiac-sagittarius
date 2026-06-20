import { useState, type FormEvent } from "react";
import type {
  Member,
  Trip,
  TripPhotoAlbumAccess,
  TripPhotoAlbumLink,
  TripPhotoAlbumProvider,
} from "@/src/trip/types";
import type { TripPhotoAlbumInput } from "../TripPhotosPage.types";

interface PhotoAlbumDialogStateInput {
  album: TripPhotoAlbumLink | null;
  currentMember: Member;
  trip: Trip;
  onSubmit: (input: TripPhotoAlbumInput) => void | Promise<void>;
}

export function usePhotoAlbumDialogState({
  album,
  currentMember,
  trip,
  onSubmit,
}: PhotoAlbumDialogStateInput) {
  const [title, setTitle] = useState(album?.title ?? "");
  const [provider, setProvider] = useState<TripPhotoAlbumProvider>(
    album?.provider ?? "google_photos",
  );
  const [access, setAccess] = useState<TripPhotoAlbumAccess>(
    album?.access ?? "collaborative",
  );
  const [url, setUrl] = useState(album?.url ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState(
    album?.ownerMemberId ?? currentMember.id,
  );
  const [day, setDay] = useState(album?.day ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [accessNote, setAccessNote] = useState(album?.accessNote ?? "");
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(
    album?.relatedItineraryItemIds ?? [],
  );
  const days = Array.from(
    new Set(trip.itineraryItems.map((item) => item.day)),
  ).sort();

  function toggleRelatedItem(itemId: string) {
    setRelatedItineraryItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      title: title.trim(),
      provider,
      url: url.trim(),
      access,
      ownerMemberId: ownerMemberId || null,
      relatedItineraryItemIds,
      day: day || null,
      description: description.trim() || null,
      accessNote: accessNote.trim() || null,
      coverUrl: album?.coverUrl ?? null,
    });
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
