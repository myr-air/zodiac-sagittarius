import type { Trip } from "@/src/trip/types";
import type { PhotoCopy } from "../TripPhotosPage.copy";
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
    <fieldset className="grid gap-2 rounded-(--radius-md) border border-(--color-border) p-3">
      <legend className="px-1 text-xs font-extrabold text-(--color-text-muted)">{copy.relatedItinerary}</legend>
      <div className="grid max-h-48 gap-2 overflow-auto">
        {trip.itineraryItems.map((item) => (
          <label key={item.id} className="flex items-start gap-2 text-sm font-semibold text-(--color-text-muted)">
            <input type="checkbox" checked={state.relatedItineraryItemIds.includes(item.id)} onChange={() => state.toggleRelatedItem(item.id)} />
            <span>{item.day} · {item.activity}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
