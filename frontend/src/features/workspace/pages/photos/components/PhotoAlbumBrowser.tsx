import type { Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { WorkspaceEmptyState } from "@/src/shared/components/workspace-empty-state";
import { Button, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import * as photoStyles from "../TripPhotosPage.styles";
import {
  type PhotoProviderFilter,
  photoProviderIcon,
  photoProviderLabel,
  photoProviders,
} from "../model/photo-page-options";
import { PhotoAlbumCard } from "./PhotoAlbumCard";

interface PhotoAlbumBrowserProps {
  activeProvider: PhotoProviderFilter;
  albums: TripPhotoAlbumLink[];
  canEdit: boolean;
  copy: PhotoCopy;
  providerCounts: Record<PhotoProviderFilter, number>;
  selectedAlbum: TripPhotoAlbumLink | null;
  trip: Trip;
  onChangeProvider: (provider: PhotoProviderFilter) => void;
  onCreateAlbum: () => void;
  onDeleteAlbum: (album: TripPhotoAlbumLink) => void;
  onEditAlbum: (album: TripPhotoAlbumLink) => void;
  onSelectAlbum: (albumId: string) => void;
}

export function PhotoAlbumBrowser({
  activeProvider,
  albums,
  canEdit,
  copy,
  providerCounts,
  selectedAlbum,
  trip,
  onChangeProvider,
  onCreateAlbum,
  onDeleteAlbum,
  onEditAlbum,
  onSelectAlbum,
}: PhotoAlbumBrowserProps) {
  return (
    <WorkspaceSurface as="div" className={photoStyles.panelClassName} density="compact">
      <div className={photoStyles.providerGridClassName} aria-label={copy.providersLabel}>
        {photoProviders.map((provider) => (
          <button
            key={provider}
            type="button"
            className={cn(
              photoStyles.providerButtonClassName,
              activeProvider === provider && photoStyles.selectedProviderClassName,
            )}
            onClick={() => onChangeProvider(provider)}
            aria-pressed={activeProvider === provider}
            aria-label={copy.providerCount(photoProviderLabel(provider, copy), providerCounts[provider] ?? 0)}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="grid size-9 place-items-center rounded-(--radius-md) border border-(--color-primary-border) bg-(--color-surface-subtle) text-(--color-primary-strong)">
                <Icon name={photoProviderIcon(provider)} />
              </span>
              <strong className="tabular-nums text-sm text-(--color-text)">{providerCounts[provider] ?? 0}</strong>
            </span>
            <strong className="text-sm font-extrabold text-(--color-text)">{photoProviderLabel(provider, copy)}</strong>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="grid gap-0.5">
          <strong className="text-[15px] font-extrabold text-(--color-text)">{photoProviderLabel(activeProvider, copy)}</strong>
          <span className="text-xs font-semibold text-(--color-text-muted)">{copy.providerHint(albums.length)}</span>
        </div>
        {canEdit ? (
          <Button type="button" onClick={onCreateAlbum}>
            <Icon name="plus" /> {copy.addAlbum}
          </Button>
        ) : null}
      </div>

      <div className={photoStyles.cardGridClassName} aria-label={copy.albumLinksLabel}>
        {albums.map((album) => (
          <PhotoAlbumCard
            key={album.id}
            album={album}
            trip={trip}
            selected={selectedAlbum?.id === album.id}
            canEdit={canEdit}
            onSelect={() => onSelectAlbum(album.id)}
            onEdit={() => onEditAlbum(album)}
            onDelete={() => onDeleteAlbum(album)}
            copy={copy}
          />
        ))}
        {!albums.length ? (
          <WorkspaceEmptyState
            title={copy.emptyTitle}
            detail={copy.emptyDetail}
            className="col-span-full min-h-[160px] rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle)"
          />
        ) : null}
      </div>
    </WorkspaceSurface>
  );
}
