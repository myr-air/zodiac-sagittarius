import { CheckboxGroup } from "@/src/shared/components/checkbox-group";
import type { Trip } from "@/src/trip/types";
import { buildItineraryItemOptions } from "@/src/features/workspace/model/related-checkbox-options";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";
import type { PhotoAlbumDialogState } from "./usePhotoAlbumDialogState";

interface PhotoAlbumDialogRelatedItemsProps {
  copy: PhotoCopy;
  state: PhotoAlbumDialogState;
  trip: Trip;
}

export function PhotoAlbumDialogRelatedItems({
  copy,
  state,
  trip,
}: PhotoAlbumDialogRelatedItemsProps) {
  return (
    <CheckboxGroup
      label={copy.relatedItinerary}
      maxHeightClassName="max-h-48"
      options={buildItineraryItemOptions(trip.itineraryItems)}
      selectedIds={state.relatedItineraryItemIds}
      onToggle={state.toggleRelatedItem}
    />
  );
}
