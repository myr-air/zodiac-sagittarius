import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspaceSummaryStat } from "@/src/shared/components/workspace-summary-stat";
import { WorkspacePage } from "@/src/ui";
import { PhotoAlbumBrowser } from "./components/PhotoAlbumBrowser";
import { PhotoAlbumDialogLayer } from "./components/PhotoAlbumDialogLayer";
import { PhotoAlbumInspector } from "./components/PhotoAlbumInspector";
import { PhotoPageHeader } from "./components/PhotoPageHeader";
import { photoCopy } from "./content/TripPhotosPage.copy";
import * as photoStyles from "./TripPhotosPage.styles";
import type { TripPhotosPageProps } from "./TripPhotosPage.types";
import { useTripPhotosPageState } from "./hooks/use-trip-photos-page-state";

export type {
  CreatePhotoAlbumHandler,
  DeletePhotoAlbumHandler,
  TripPhotoAlbumInput,
  TripPhotosPageProps,
  UpdatePhotoAlbumHandler,
} from "./TripPhotosPage.types";

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
      <PhotoPageHeader
        albumCount={photoAlbumLinks.length}
        copy={copy}
        locale={locale}
        tripEndDate={trip.endDate}
        tripName={trip.name}
        tripStartDate={trip.startDate}
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

      <PhotoAlbumDialogLayer
        copy={copy}
        currentMember={currentMember}
        deleteAlbum={deleteAlbum}
        dialogAlbum={dialogAlbum}
        trip={trip}
        onCancelDelete={() => setDeleteAlbum(null)}
        onCancelDialog={() => setDialogAlbum(null)}
        onConfirmDelete={() => void confirmDelete()}
        onSubmitAlbum={submitAlbum}
      />
    </WorkspacePage>
  );
}
