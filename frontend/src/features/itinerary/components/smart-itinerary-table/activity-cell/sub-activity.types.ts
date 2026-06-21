import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type { InlineItineraryItemPatch } from "../../../lib/inline-itinerary-item-patch";
import type {
  ItineraryAsyncVoidResult,
  ItineraryBookingMutationResult,
} from "../itinerary-action.types";

export interface SubActivitySharedProps {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  subItems: ItineraryItem[];
  onAddSubActivity?: (parentItemId: string) => ItineraryAsyncVoidResult;
  onAddNoteForItem?: (itemId: string, body: string) => ItineraryAsyncVoidResult;
  onOpenNoteForItem?: (item: ItineraryItem, compact?: boolean) => void;
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
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => ItineraryAsyncVoidResult;
}

export interface SubActivityModalProps extends SubActivitySharedProps {
  onClose: () => void;
}

export interface SubActivityListProps extends SubActivitySharedProps {
  presentation?: "inline" | "modal";
  selected: boolean;
  visible?: boolean;
}
