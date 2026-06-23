import type {
  Trip,
  TripPhotoAlbumAccess,
  TripPhotoAlbumProvider,
} from "@/src/trip/types";
import { buildMemberSelectOptions } from "@/src/features/workspace/model/related-checkbox-options";
import { SelectOptions } from "@/src/shared/components/select-options";
import { Select } from "@/src/ui";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import {
  photoAccessSelectOptions,
  photoProviderSelectOptions,
} from "../model/photo-page-options";
import type { PhotoAlbumDialogState } from "../hooks/usePhotoAlbumDialogState";

interface PhotoAlbumDialogFieldsProps {
  copy: PhotoCopy;
  state: PhotoAlbumDialogState;
  trip: Trip;
}

export function PhotoAlbumDialogFields({
  copy,
  state,
  trip,
}: PhotoAlbumDialogFieldsProps) {
  return (
    <div className={photoStyles.dialogGridClassName}>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.titleField}</span>
        <input value={state.title} onChange={(event) => state.setTitle(event.target.value)} required />
      </label>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.providerField}</span>
        <Select value={state.provider} onChange={(event) => state.setProvider(event.target.value as TripPhotoAlbumProvider)}>
          <SelectOptions options={photoProviderSelectOptions(copy)} />
        </Select>
      </label>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.accessField}</span>
        <Select value={state.access} onChange={(event) => state.setAccess(event.target.value as TripPhotoAlbumAccess)}>
          <SelectOptions options={photoAccessSelectOptions(copy)} />
        </Select>
      </label>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.ownerField}</span>
        <Select value={state.ownerMemberId} onChange={(event) => state.setOwnerMemberId(event.target.value)}>
          <option value="">{copy.noOwner}</option>
          <SelectOptions options={buildMemberSelectOptions(trip.members)} />
        </Select>
      </label>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.albumLinkField}</span>
        <input value={state.url} onChange={(event) => state.setUrl(event.target.value)} required />
      </label>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.dayField}</span>
        <Select value={state.day} onChange={(event) => state.setDay(event.target.value)}>
          <option value="">{copy.tripLevel}</option>
          {state.days.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
        </Select>
      </label>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.descriptionField}</span>
        <textarea value={state.description} onChange={(event) => state.setDescription(event.target.value)} />
      </label>
      <label className={photoStyles.fieldClassName}>
        <span>{copy.accessNoteField}</span>
        <textarea value={state.accessNote} onChange={(event) => state.setAccessNote(event.target.value)} />
      </label>
    </div>
  );
}
