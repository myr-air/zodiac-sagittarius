import type { Member, Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { Button, WorkspacePage, WorkspaceSurface } from "@/src/ui";
import { WorkspaceSummaryStat } from "@/src/features/workspace/components/summary-stat";
import { PhotoAlbumDialog } from "./components/PhotoAlbumDialog";
import { PhotoAlbumCard } from "./components/PhotoAlbumCard";
import { PhotoAlbumInspector } from "./components/PhotoAlbumInspector";
import { photoCopy } from "./TripPhotosPage.copy";
import * as photoStyles from "./TripPhotosPage.styles";
import {
  photoProviderLabel,
  photoProviders,
} from "./TripPhotosPage.support";
import type { TripPhotoAlbumInput } from "./TripPhotosPage.types";
import { useTripPhotosPageState } from "./use-trip-photos-page-state";

export type { TripPhotoAlbumInput } from "./TripPhotosPage.types";

interface TripPhotosPageProps {
  trip: Trip;
  currentMember: Member;
  photoAlbumLinks: TripPhotoAlbumLink[];
  canEditPhotoAlbums: boolean;
  onCreatePhotoAlbum: (input: TripPhotoAlbumInput) => void | Promise<void>;
  onUpdatePhotoAlbum: (albumId: string, input: TripPhotoAlbumInput) => void | Promise<void>;
  onDeletePhotoAlbum: (albumId: string) => void | Promise<void>;
}

export function TripPhotosPage({
  trip,
  currentMember,
  photoAlbumLinks,
  canEditPhotoAlbums,
  onCreatePhotoAlbum,
  onUpdatePhotoAlbum,
  onDeletePhotoAlbum,
}: TripPhotosPageProps) {
  const { locale } = useI18n();
  const copy = photoCopy[locale];
  const {
    activeProvider,
    confirmDelete,
    deleteAlbum,
    dialogAlbum,
    providerCounts,
    selectedAlbum,
    selectedRelations,
    setActiveProvider,
    setDeleteAlbum,
    setDialogAlbum,
    setSelectedAlbumId,
    submitAlbum,
    summary,
    visibleAlbums,
  } = useTripPhotosPageState({
    onCreatePhotoAlbum,
    onDeletePhotoAlbum,
    onUpdatePhotoAlbum,
    photoAlbumLinks,
    trip,
  });

  return (
    <WorkspacePage className={photoStyles.pageClassName} aria-label={copy.pageLabel} role="region">
      <PageHeader
        title={copy.title}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="cloud" /> {copy.albumLinks(photoAlbumLinks.length)}</span>
          </>
        )}
      />

      <div className={photoStyles.summaryClassName} aria-label={copy.summaryLabel}>
        <WorkspaceSummaryStat
          className={photoStyles.statClassName}
          icon="cloud"
          label={copy.savedDestinations}
          value={copy.albums(summary.total)}
        />
        <WorkspaceSummaryStat
          className={photoStyles.statClassName}
          icon="users"
          label={copy.sharedUploads}
          value={copy.collaborative(summary.collaborative)}
        />
        <WorkspaceSummaryStat
          className={photoStyles.statClassName}
          icon="import"
          label={copy.uploadRequests}
          value={copy.requests(summary.uploadRequests)}
        />
        <WorkspaceSummaryStat
          className={photoStyles.statClassName}
          icon="warning"
          label={copy.needsAccessNote}
          value={copy.missing(summary.missingAccessNotes)}
        />
      </div>

      <div className={photoStyles.contentClassName}>
        <WorkspaceSurface as="div" className={photoStyles.panelClassName} density="compact">
          <div className={photoStyles.providerGridClassName} aria-label={copy.providersLabel}>
            {photoProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                className={cn(photoStyles.providerButtonClassName, activeProvider === provider && photoStyles.selectedProviderClassName)}
                onClick={() => setActiveProvider(provider)}
                aria-pressed={activeProvider === provider}
                aria-label={copy.providerCount(photoProviderLabel(provider, copy), providerCounts[provider] ?? 0)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="grid size-9 place-items-center rounded-(--radius-md) border border-(--color-primary-border) bg-(--color-surface-subtle) text-(--color-primary-strong)">
                    <Icon name={provider === "all" ? "layout" : provider === "dropbox" ? "import" : "cloud"} />
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
              <span className="text-xs font-semibold text-(--color-text-muted)">{copy.providerHint(visibleAlbums.length)}</span>
            </div>
            {canEditPhotoAlbums ? <Button type="button" onClick={() => setDialogAlbum("new")}><Icon name="plus" /> {copy.addAlbum}</Button> : null}
          </div>

          <div className={photoStyles.cardGridClassName} aria-label={copy.albumLinksLabel}>
            {visibleAlbums.map((album) => (
              <PhotoAlbumCard
                key={album.id}
                album={album}
                trip={trip}
                selected={selectedAlbum?.id === album.id}
                canEdit={canEditPhotoAlbums}
                onSelect={() => setSelectedAlbumId(album.id)}
                onEdit={() => setDialogAlbum(album)}
                onDelete={() => setDeleteAlbum(album)}
                copy={copy}
              />
            ))}
            {!visibleAlbums.length ? (
              <div className="col-span-full grid min-h-[160px] place-items-center rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle) p-5 text-center">
                <div className="grid max-w-[360px] gap-1">
                  <strong className="text-(--color-text)">{copy.emptyTitle}</strong>
                  <span className="text-sm font-medium leading-6 text-(--color-text-muted)">{copy.emptyDetail}</span>
                </div>
              </div>
            ) : null}
          </div>
        </WorkspaceSurface>

        <PhotoAlbumInspector album={selectedAlbum} relations={selectedRelations} trip={trip} copy={copy} />
      </div>

      {dialogAlbum ? (
        <PhotoAlbumDialog
          album={dialogAlbum === "new" ? null : dialogAlbum}
          currentMember={currentMember}
          trip={trip}
          onCancel={() => setDialogAlbum(null)}
          onSubmit={submitAlbum}
          copy={copy}
        />
      ) : null}

      {deleteAlbum ? (
        <div className={photoStyles.dialogBackdropClassName}>
          <div className={photoStyles.deleteDialogClassName} role="dialog" aria-modal="true" aria-label={copy.deleteAlbum}>
            <h2 className="m-0 text-lg font-extrabold text-(--color-text)">{copy.deleteAlbum}</h2>
            <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{copy.deletePrompt(deleteAlbum.title)}</p>
            <div className={photoStyles.dialogActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => setDeleteAlbum(null)}>{copy.cancel}</Button>
              <Button type="button" variant="danger" onClick={() => void confirmDelete()}>{copy.deleteAlbum}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspacePage>
  );
}
