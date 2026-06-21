import type { ItineraryItem } from "@/src/trip/types";
import { toggleId } from "@/src/features/itinerary/lib/itinerary-item-helpers";
import {
  ticketLinkedItemsClassName,
  ticketLinkedOptionClassName,
} from "../smart-itinerary-table.styles";
import type { TicketModalCopy } from "./itinerary-ticket-modal.types";

interface LinkedActivitiesPickerProps {
  bookingLinkItems: ItineraryItem[];
  copy: TicketModalCopy;
  itemId: string;
  relatedItineraryItemIds: string[];
  onRelatedItineraryItemIdsChange: (
    updater: (current: string[]) => string[],
  ) => void;
}

export function LinkedActivitiesPicker({
  bookingLinkItems,
  copy,
  itemId,
  relatedItineraryItemIds,
  onRelatedItineraryItemIdsChange,
}: LinkedActivitiesPickerProps) {
  return (
    <section className="grid gap-1.5" aria-label={copy.linkedActivities}>
      <strong className="text-xs font-extrabold text-(--color-text-muted)">
        {copy.linkedActivities}
      </strong>
      <div className={ticketLinkedItemsClassName}>
        {bookingLinkItems.map((candidate) => (
          <label className={ticketLinkedOptionClassName} key={candidate.id}>
            <input
              type="checkbox"
              checked={relatedItineraryItemIds.includes(candidate.id)}
              disabled={candidate.id === itemId}
              onChange={() =>
                onRelatedItineraryItemIdsChange((current) =>
                  toggleId(current, candidate.id),
                )
              }
            />
            <span>
              {candidate.day} · {candidate.activity}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
