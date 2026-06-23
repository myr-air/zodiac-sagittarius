import { findPhotoAlbumRelations, safePhotoAlbumCoverHref, safePhotoAlbumHref } from "@/src/trip/photo-albums";
import type { Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { Badge, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import {
  photoAccessBadgeTone,
  photoAccessLabel,
  photoProviderLabel,
} from "../model/photo-page-options";
import {
  photoAlbumDayDisplay,
  photoAlbumOwnerDisplay,
  photoAlbumSummaryDisplay,
} from "../model/photo-album-display";
import { PhotoAlbumExternalLinkAction } from "./PhotoAlbumExternalLinkAction";

interface PhotoAlbumCardProps {
  album: TripPhotoAlbumLink;
  copy: PhotoCopy;
  trip: Trip;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PhotoAlbumCard({
  album,
  copy,
  trip,
  selected,
  canEdit,
  onSelect,
  onEdit,
  onDelete,
}: PhotoAlbumCardProps) {
  const href = safePhotoAlbumHref(album.url);
  const relations = findPhotoAlbumRelations(album, trip);
  const coverHref = safePhotoAlbumCoverHref(album.coverUrl);
  return (
    <article className={cn(photoStyles.albumCardClassName, selected && photoStyles.selectedAlbumClassName)}>
      <button type="button" className="grid min-w-0 gap-2 text-left" onClick={onSelect} aria-label={copy.selectAlbum(album.title)}>
        <span
          aria-label={copy.coverFor(album.title)}
          className={photoStyles.albumCoverClassName}
          role="img"
          style={coverHref ? { backgroundImage: `url(${coverHref})` } : undefined}
        />
        <span className="flex items-center justify-between gap-2">
          <Badge tone={photoAccessBadgeTone(album.access)}>{photoAccessLabel(album.access, copy)}</Badge>
          <span className="text-xs font-extrabold text-(--color-text-muted)">{photoProviderLabel(album.provider, copy)}</span>
        </span>
        <span className="grid gap-1">
          <strong className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-black text-(--color-text)">{album.title}</strong>
          <span className="line-clamp-2 text-xs font-semibold leading-5 text-(--color-text-muted)">{photoAlbumSummaryDisplay(album, copy)}</span>
        </span>
      </button>
      <div className="grid gap-2 text-xs font-bold text-(--color-text-muted)">
        <span className="flex min-w-0 items-center gap-1.5"><Icon name="users" /> {photoAlbumOwnerDisplay(relations.owner, copy.noOwner)}</span>
        <span className="flex min-w-0 items-center gap-1.5"><Icon name="calendar" /> {photoAlbumDayDisplay(album.day, copy)}</span>
        {!href ? <span className="font-extrabold text-[#b91c1c]">{copy.unsafeLinkBlocked}</span> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PhotoAlbumExternalLinkAction
          blockedLabel={copy.openBlocked}
          blockedMode="button"
          buttonClassName="w-auto"
          href={href}
          openLabel={copy.openAlbumTitle(album.title)}
          variant="ghost"
        />
        {canEdit ? (
          <span className="flex gap-1">
            <IconButton type="button" aria-label={copy.editAlbum} onClick={onEdit}><Icon name="edit" /></IconButton>
            <IconButton type="button" aria-label={copy.deleteAlbum} onClick={onDelete}><Icon name="trash" /></IconButton>
          </span>
        ) : null}
      </div>
    </article>
  );
}
