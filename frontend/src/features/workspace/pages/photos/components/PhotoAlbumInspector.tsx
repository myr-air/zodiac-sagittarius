import { safePhotoAlbumHref, type PhotoAlbumRelations } from "@/src/trip/photo-albums";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import { Badge, Button, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { PhotoCopy } from "../TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import { photoAccessLabel, photoAlbumLinkHost, photoProviderLabel } from "../TripPhotosPage.support";

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
  if (!album) {
    return (
      <WorkspaceSurface className={photoStyles.inspectorClassName} density="compact" aria-label={copy.inspectorLabel}>
        <div className={photoStyles.inspectorSectionClassName}>{copy.selectHint}</div>
      </WorkspaceSurface>
    );
  }
  const href = safePhotoAlbumHref(album.url);
  const linkHost = photoAlbumLinkHost(href);
  return (
    <WorkspaceSurface className={photoStyles.inspectorClassName} density="compact" aria-label={copy.inspectorLabel}>
      <div className="grid gap-2">
        <Badge tone={album.access === "collaborative" ? "primary" : album.access === "upload_request" ? "warning" : "route"}>{photoProviderLabel(album.provider, copy)}</Badge>
        <h2 className="m-0 text-xl font-black text-(--color-text)">{album.title}</h2>
        <span className="text-sm font-semibold leading-6 text-(--color-text-muted)">{copy.externalProviderNote}</span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-xs font-black text-(--color-text-muted)">{linkHost ?? copy.blockedLink}</span>
          {href ? (
            <button
              type="button"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-xs font-extrabold text-(--color-primary-strong)"
              onClick={() => void navigator.clipboard?.writeText(album.url)}
            >
              <Icon name="copy" /> {copy.copy}
            </button>
          ) : null}
        </div>
        {href ? (
          <Button asChild className="w-full">
            <a href={href} target="_blank" rel="noreferrer">{copy.openAlbum}<Icon name="external" /></a>
          </Button>
        ) : (
          <strong className="text-[#b91c1c]">{copy.unsafeLinkBlocked}</strong>
        )}
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.access}</strong>
        <span>{photoAccessLabel(album.access, copy)}</span>
        <span className="text-(--color-text-muted)">{album.accessNote || copy.noAccessNote}</span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.owner}</strong>
        <span>{relations?.owner?.displayName ?? copy.noOwnerAssigned}</span>
        <span className="text-xs text-(--color-text-muted)">{copy.createdBy(relations?.createdBy?.displayName ?? album.createdBy)}</span>
      </div>
      <div className={photoStyles.inspectorSectionClassName}>
        <strong className="text-(--color-text)">{copy.relatedStops}</strong>
        {relations?.itineraryItems.length ? relations.itineraryItems.map((item) => (
          <span key={item.id} className="text-sm">{item.day} · {item.activity}</span>
        )) : <span className="text-(--color-text-muted)">{copy.tripLevel}</span>}
      </div>
    </WorkspaceSurface>
  );
}
