import { useMemo, useState } from "react";
import {
  buildPhotoAlbumSummary,
  filterPhotoAlbumLinks,
  findPhotoAlbumRelations,
} from "@/src/trip/photo-albums";
import type { Trip, TripPhotoAlbumLink } from "@/src/trip/types";
import type { PhotoProviderFilter } from "./photo-page-options";
import { countPhotoProviders } from "./photo-page-selectors";
import type { TripPhotoAlbumInput } from "./TripPhotosPage.types";

interface UseTripPhotosPageStateInput {
  onCreatePhotoAlbum: (input: TripPhotoAlbumInput) => void | Promise<void>;
  onDeletePhotoAlbum: (albumId: string) => void | Promise<void>;
  onUpdatePhotoAlbum: (albumId: string, input: TripPhotoAlbumInput) => void | Promise<void>;
  photoAlbumLinks: TripPhotoAlbumLink[];
  trip: Trip;
}

export function useTripPhotosPageState({
  onCreatePhotoAlbum,
  onDeletePhotoAlbum,
  onUpdatePhotoAlbum,
  photoAlbumLinks,
  trip,
}: UseTripPhotosPageStateInput) {
  const [activeProvider, setActiveProvider] = useState<PhotoProviderFilter>("all");
  const [selectedAlbumId, setSelectedAlbumId] = useState(photoAlbumLinks[0]?.id ?? "");
  const [dialogAlbum, setDialogAlbum] = useState<TripPhotoAlbumLink | "new" | null>(null);
  const [deleteAlbum, setDeleteAlbum] = useState<TripPhotoAlbumLink | null>(null);
  const summary = useMemo(() => buildPhotoAlbumSummary(photoAlbumLinks), [photoAlbumLinks]);
  const providerCounts = useMemo(() => countPhotoProviders(photoAlbumLinks), [photoAlbumLinks]);
  const visibleAlbums = useMemo(
    () => filterPhotoAlbumLinks(photoAlbumLinks, { provider: activeProvider }),
    [activeProvider, photoAlbumLinks],
  );
  const selectedAlbum = visibleAlbums.find((album) => album.id === selectedAlbumId) ?? visibleAlbums[0] ?? null;
  const selectedRelations = selectedAlbum ? findPhotoAlbumRelations(selectedAlbum, trip) : null;

  async function submitAlbum(input: TripPhotoAlbumInput) {
    if (dialogAlbum === "new") {
      await onCreatePhotoAlbum(input);
    } else if (dialogAlbum) {
      await onUpdatePhotoAlbum(dialogAlbum.id, input);
    }
    setDialogAlbum(null);
  }

  async function confirmDelete() {
    if (!deleteAlbum) return;
    await onDeletePhotoAlbum(deleteAlbum.id);
    setDeleteAlbum(null);
  }

  return {
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
  };
}
