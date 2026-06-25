import {
  safePhotoAlbumHref,
  type PhotoAlbumRelations,
} from "@/src/trip/photo-albums";
import { useCopyFeedbackState } from "@/src/shared/components/copy-feedback";
import { ExternalLinkAction } from "@/src/shared/components/external-link-action";
import { displayNameOrFallback } from "@/src/shared/text-parts";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import { Badge, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import {
  photoAccessBadgeTone,
  photoAccessLabel,
  photoProviderLabel,
} from "../model/photo-page-options";
import {
  photoAlbumAccessNoteDisplay,
  photoAlbumHostDisplay,
  photoAlbumOwnerDisplay,
} from "../model/photo-album-display";
import { photoAlbumLinkHost } from "../model/photo-page-selectors";
import { PhotoCopyFeedback } from "./PhotoCopyFeedback";

interface PhotoAlbumInspectorProps {
  album: TripPhotoAlbumLink | null;
  copy: PhotoCopy;
  relations: PhotoAlbumRelations | null;
}

export function PhotoAlbumInspector({
  album,
  copy,
  relations,
}: PhotoAlbumInspectorProps) {
  const { copyState, copyText } = useCopyFeedbackState();

  if (!album) {
    return (
      <WorkspaceSurface
        className={photoStyles.inspectorClassName}
        density="compact"
        aria-label={copy.inspectorLabel}
      >
        <div className={photoStyles.inspectorSectionClassName}>
          {copy.selectHint}
        </div>
      </WorkspaceSurface>
    );
  }
  const href = safePhotoAlbumHref(album.url);
  const linkHost = photoAlbumLinkHost(href);
  return (
    <WorkspaceSurface
      className={photoStyles.inspectorClassName}
      density="compact"
      aria-label={copy.inspectorLabel}
    >
      <div className="grid gap-2">
        <span className="flex items-center justify-between gap-2">
          <Badge tone={photoAccessBadgeTone(album.access)}>
            {photoProviderLabel(album.provider, copy)}
          </Badge>
          <span className="text-xs font-extrabold text-(--color-text-muted)">
            {photoAccessLabel(album.access, copy)}
          </span>
        </span>
        <h2 className="m-0 text-[17px] font-black leading-6 text-(--color-text)">
          {album.title}
        </h2>
        <span className="text-xs font-semibold leading-5 text-(--color-text-muted)">
          {copy.externalProviderNote}
        </span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-black text-(--color-text-muted)">
            {photoAlbumHostDisplay(linkHost, copy)}
          </span>
          {href ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-xs font-extrabold text-(--color-primary-strong)"
              onClick={() => void copyText(album.url)}
            >
              <Icon name="copy" /> {copy.copy}
            </button>
          ) : null}
        </div>
        {copyState !== "idle" ? (
          <PhotoCopyFeedback copy={copy} copyState={copyState} />
        ) : null}
        <ExternalLinkAction
          blockedLabel={copy.unsafeLinkBlocked}
          blockedMode="notice"
          className="w-full"
          href={href}
          openLabel={copy.openAlbum}
        />
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.access}</strong>
        <span className="text-(--color-text-muted)">
          {photoAlbumAccessNoteDisplay(album, copy)}
        </span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.owner}</strong>
        <span>
          {photoAlbumOwnerDisplay(relations?.owner, copy.noOwnerAssigned)}
        </span>
        <span className="text-xs text-(--color-text-muted)">
          {copy.createdBy(
            displayNameOrFallback(relations?.createdBy, album.createdBy),
          )}
        </span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.relatedStops}</strong>
        {relations?.itineraryItems.length ? (
          relations.itineraryItems.map((item) => (
            <span key={item.id} className="text-sm">
              {item.day} · {item.activity}
            </span>
          ))
        ) : (
          <span className="text-(--color-text-muted)">{copy.tripLevel}</span>
        )}
      </div>
    </WorkspaceSurface>
  );
}
