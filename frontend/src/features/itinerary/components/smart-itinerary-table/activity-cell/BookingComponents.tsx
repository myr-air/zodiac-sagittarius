import { useState } from "react";

import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";

import {
  bookingIconForItem,
  bookingTemplateForItem,
  bookingTemplateLabel,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import {
  activityBookingButtonClassName,
  activityBookingButtonEmptyClassName,
  activityBookingButtonLinkedClassName,
} from "../smart-itinerary-table.styles";
import { ItineraryTicketModal } from "./ItineraryTicketModal";

export function ItineraryBookingButton({
  bookingDocs,
  bookingLinkItems,
  item,
  itineraryLabels,
  locale,
  onAddBookingForItem,
  onSaveBookingForItem,
  onUnlinkBookingForItem,
}: {
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onAddBookingForItem?: (
    itemId: string,
    template?: ItineraryBookingTemplate,
  ) => string | void | Promise<string | void>;
  onSaveBookingForItem?: (
    input: ItineraryBookingTicketInput,
  ) => string | void | Promise<string | void>;
  onUnlinkBookingForItem?: (
    bookingDocId: string,
    itemId: string,
  ) => void | Promise<void>;
}) {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  if (!onAddBookingForItem && !onSaveBookingForItem) return null;
  const icon = bookingIconForItem(item);
  const linkedBooking = bookingDocs.find((booking) =>
    booking.relatedItineraryItemIds.includes(item.id),
  );
  const label = itineraryLabels.row.createBookingDraft({
    activity: item.activity,
    template: bookingTemplateLabel(item, locale),
  });
  return (
    <>
      <button
        type="button"
        className={cn(
          activityBookingButtonClassName,
          linkedBooking
            ? activityBookingButtonLinkedClassName
            : activityBookingButtonEmptyClassName,
        )}
        aria-label={label}
        title={label}
        onClick={(event) => {
          event.stopPropagation();
          if (onSaveBookingForItem) {
            setTicketModalOpen(true);
            return;
          }
          void onAddBookingForItem?.(item.id, bookingTemplateForItem(item));
        }}
      >
        <Icon name={icon} />
        <span className="min-w-0 truncate">{bookingTemplateLabel(item, locale)}</span>
      </button>
      {ticketModalOpen && onSaveBookingForItem ? (
        <ItineraryTicketModal
          bookingDocs={bookingDocs}
          bookingLinkItems={bookingLinkItems}
          item={item}
          locale={locale}
          onClose={() => setTicketModalOpen(false)}
          onUnlink={
            onUnlinkBookingForItem
              ? async (bookingDocId) => {
                  await onUnlinkBookingForItem(bookingDocId, item.id);
                  setTicketModalOpen(false);
                }
              : undefined
          }
          onSave={async (input) => {
            await onSaveBookingForItem(input);
            setTicketModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export { ItineraryTicketModal } from "./ItineraryTicketModal";
