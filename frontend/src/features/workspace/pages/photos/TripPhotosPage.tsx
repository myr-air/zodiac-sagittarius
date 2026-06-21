import type { Member, Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { WorkspaceSummaryStat } from "@/src/shared/components/workspace-summary-stat";
import { Button, WorkspacePage } from "@/src/ui";
import { PhotoAlbumDialog } from "./components/PhotoAlbumDialog";
import { PhotoAlbumBrowser } from "./components/PhotoAlbumBrowser";
import { PhotoAlbumInspector } from "./components/PhotoAlbumInspector";
import { photoCopy } from "./content/TripPhotosPage.copy";
import * as photoStyles from "./TripPhotosPage.styles";
import type {
  CreatePhotoAlbumHandler,
  DeletePhotoAlbumHandler,
  UpdatePhotoAlbumHandler,
} from "./TripPhotosPage.types";
import { useTripPhotosPageState } from "./use-trip-photos-page-state";

export type {
  CreatePhotoAlbumHandler,
  DeletePhotoAlbumHandler,
  TripPhotoAlbumInput,
  UpdatePhotoAlbumHandler,
} from "./TripPhotosPage.types";

interface TripPhotosPageProps {
  trip: Trip;
  currentMember: Member;
  photoAlbumLinks: TripPhotoAlbumLink[];
  canEditPhotoAlbums: boolean;
  onCreatePhotoAlbum: CreatePhotoAlbumHandler;
  onUpdatePhotoAlbum: UpdatePhotoAlbumHandler;
  onDeletePhotoAlbum: DeletePhotoAlbumHandler;
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
        <PhotoAlbumBrowser
          activeProvider={activeProvider}
          albums={visibleAlbums}
          canEdit={canEditPhotoAlbums}
          copy={copy}
          providerCounts={providerCounts}
          selectedAlbum={selectedAlbum}
          trip={trip}
          onChangeProvider={setActiveProvider}
          onCreateAlbum={() => setDialogAlbum("new")}
          onDeleteAlbum={setDeleteAlbum}
          onEditAlbum={setDialogAlbum}
          onSelectAlbum={setSelectedAlbumId}
        />

        <PhotoAlbumInspector album={selectedAlbum} relations={selectedRelations} copy={copy} />
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
            <p className={photoStyles.deleteDialogBodyClassName}>{copy.deletePrompt(deleteAlbum.title)}</p>
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
