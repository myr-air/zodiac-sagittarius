import { type FormEvent, useState } from "react";
import type { Member, Trip, TripPhotoAlbumAccess, TripPhotoAlbumLink, TripPhotoAlbumProvider } from "@/src/trip/types";
import { Button, IconButton, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { PhotoCopy } from "../TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import {
  photoAccessLabel,
  photoAccessOptions,
  photoProviderLabel,
  photoProviderOptions,
} from "../TripPhotosPage.support";
import type { TripPhotoAlbumInput } from "../TripPhotosPage.types";

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
  const [title, setTitle] = useState(album?.title ?? "");
  const [provider, setProvider] = useState<TripPhotoAlbumProvider>(album?.provider ?? "google_photos");
  const [access, setAccess] = useState<TripPhotoAlbumAccess>(album?.access ?? "collaborative");
  const [url, setUrl] = useState(album?.url ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState(album?.ownerMemberId ?? currentMember.id);
  const [day, setDay] = useState(album?.day ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [accessNote, setAccessNote] = useState(album?.accessNote ?? "");
  const [relatedItineraryItemIds, setRelatedItineraryItemIds] = useState(album?.relatedItineraryItemIds ?? []);
  const days = Array.from(new Set(trip.itineraryItems.map((item) => item.day))).sort();

  function toggleRelatedItem(itemId: string) {
    setRelatedItineraryItemIds((current) => current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  return (
    <div className={photoStyles.dialogBackdropClassName}>
      <div className={photoStyles.dialogClassName} role="dialog" aria-modal="true" aria-label={album ? copy.editAlbumDialog : copy.addAlbumDialog}>
        <div className={photoStyles.dialogHeaderClassName}>
          <h2>{album ? copy.editAlbumDialog : copy.addAlbumDialog}</h2>
          <IconButton type="button" aria-label={copy.close} onClick={onCancel}><Icon name="x" /></IconButton>
        </div>
        <form className={photoStyles.dialogFormClassName} onSubmit={(event) => void handleSubmit(event)}>
          <div className={photoStyles.dialogGridClassName}>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.titleField}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.providerField}</span>
              <Select value={provider} onChange={(event) => setProvider(event.target.value as TripPhotoAlbumProvider)}>
                {photoProviderOptions.map((option) => <option key={option} value={option}>{photoProviderLabel(option, copy)}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.accessField}</span>
              <Select value={access} onChange={(event) => setAccess(event.target.value as TripPhotoAlbumAccess)}>
                {photoAccessOptions.map((option) => <option key={option} value={option}>{photoAccessLabel(option, copy)}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.ownerField}</span>
              <Select value={ownerMemberId} onChange={(event) => setOwnerMemberId(event.target.value)}>
                <option value="">{copy.noOwner}</option>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.albumLinkField}</span>
              <input value={url} onChange={(event) => setUrl(event.target.value)} required />
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.dayField}</span>
              <Select value={day} onChange={(event) => setDay(event.target.value)}>
                <option value="">{copy.tripLevel}</option>
                {days.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
              </Select>
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.descriptionField}</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className={photoStyles.fieldClassName}>
              <span>{copy.accessNoteField}</span>
              <textarea value={accessNote} onChange={(event) => setAccessNote(event.target.value)} />
            </label>
          </div>
          <fieldset className="grid gap-2 rounded-(--radius-md) border border-(--color-border) p-3">
            <legend className="px-1 text-xs font-extrabold text-(--color-text-muted)">{copy.relatedItinerary}</legend>
            <div className="grid max-h-48 gap-2 overflow-auto">
              {trip.itineraryItems.map((item) => (
                <label key={item.id} className="flex items-start gap-2 text-sm font-semibold text-(--color-text-muted)">
                  <input type="checkbox" checked={relatedItineraryItemIds.includes(item.id)} onChange={() => toggleRelatedItem(item.id)} />
                  <span>{item.day} · {item.activity}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={photoStyles.dialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onCancel}>{copy.cancel}</Button>
            <Button type="submit">{copy.saveAlbum}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
