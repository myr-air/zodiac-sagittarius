import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryBookingTemplate, ItineraryBookingTicketInput } from "@/src/trip/booking-docs";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { InlineItineraryItemPatch } from "../../../lib/inline-itinerary-item-patch";
import type {
  ItineraryAsyncVoidResult,
  ItineraryBookingMutationResult,
} from "../itinerary-action.types";

export interface ActivityCellProps {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  selected: boolean;
  subItems: ItineraryItem[];
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => ItineraryAsyncVoidResult;
  onAddNoteForItem?: (itemId: string, body: string) => ItineraryAsyncVoidResult;
  onAddBookingForItem?: (
    itemId: string,
    template?: ItineraryBookingTemplate,
  ) => ItineraryBookingMutationResult;
  onSaveBookingForItem?: (
    input: ItineraryBookingTicketInput,
  ) => ItineraryBookingMutationResult;
  onUnlinkBookingForItem?: (
    bookingDocId: string,
    itemId: string,
  ) => ItineraryAsyncVoidResult;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => ItineraryAsyncVoidResult;
}
