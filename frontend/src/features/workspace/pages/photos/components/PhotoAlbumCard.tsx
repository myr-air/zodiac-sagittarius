import { ExternalLinkAction } from "@/src/shared/components/external-link-action";
import { IconText } from "@/src/shared/components/icon-text";
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
      <button
        type="button"
        className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-3 text-left max-[479px]:grid-cols-[76px_minmax(0,1fr)]"
        onClick={onSelect}
        aria-label={copy.selectAlbum(album.title)}
      >
        <span
          aria-label={copy.coverFor(album.title)}
          className={photoStyles.albumCoverClassName}
          role="img"
          style={coverHref ? { backgroundImage: `url(${coverHref})` } : undefined}
        />
        <span className="grid min-w-0 content-start gap-1.5">
          <span className="flex min-w-0 items-center justify-between gap-2">
            <Badge tone={photoAccessBadgeTone(album.access)}>{photoAccessLabel(album.access, copy)}</Badge>
            <span className="truncate text-xs font-extrabold text-(--color-text-muted)">
              {photoProviderLabel(album.provider, copy)}
            </span>
          </span>
          <strong className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-black text-(--color-text)">{album.title}</strong>
          <span className="line-clamp-2 text-xs font-semibold leading-5 text-(--color-text-muted)">{photoAlbumSummaryDisplay(album, copy)}</span>
        </span>
      </button>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-(--color-text-muted)">
        <IconText icon="users" className="flex min-w-0 items-center gap-1.5">
          {photoAlbumOwnerDisplay(relations.owner, copy.noOwner)}
        </IconText>
        <IconText icon="calendar" className="flex min-w-0 items-center gap-1.5">
          {photoAlbumDayDisplay(album.day, copy)}
        </IconText>
        {!href ? <span className="font-extrabold text-[#b91c1c]">{copy.unsafeLinkBlocked}</span> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--color-border) pt-2">
        <ExternalLinkAction
          blockedLabel={copy.openBlocked}
          blockedMode="button"
          buttonVariant="ghost"
          className="w-auto"
          href={href}
          openLabel={copy.openAlbumTitle(album.title)}
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
