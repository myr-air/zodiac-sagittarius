import { useState } from "react";
import type { TripPhotoAlbumLink } from "@/src/trip/types";
import type { PhotoProviderFilter } from "../model/photo-page-options";
import {
  initialPhotoAlbumBrowserState,
  updatePhotoAlbumBrowserState,
  type PhotoAlbumBrowserState,
} from "../model/photo-page-state";

interface UsePhotoAlbumBrowserStateInput {
  photoAlbumLinks: TripPhotoAlbumLink[];
}

export function usePhotoAlbumBrowserState({
  photoAlbumLinks,
}: UsePhotoAlbumBrowserStateInput) {
  const [browserState, setBrowserState] = useState<PhotoAlbumBrowserState>(() =>
    initialPhotoAlbumBrowserState(photoAlbumLinks),
  );

  function updateBrowserState<Field extends keyof PhotoAlbumBrowserState>(
    field: Field,
    value: PhotoAlbumBrowserState[Field],
  ) {
    setBrowserState((current) =>
      updatePhotoAlbumBrowserState(current, field, value),
    );
  }

  return {
    activeProvider: browserState.activeProvider,
    selectedAlbumId: browserState.selectedAlbumId,
    setActiveProvider: (activeProvider: PhotoProviderFilter) =>
      updateBrowserState("activeProvider", activeProvider),
    setSelectedAlbumId: (selectedAlbumId: string) =>
      updateBrowserState("selectedAlbumId", selectedAlbumId),
  };
}
