import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";

export type ItineraryAsyncVoidResult = void | Promise<void>;
export type ItineraryBookingMutationResult = string | void | Promise<string | void>;

export interface ItineraryBookingActionProps {
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
}

export interface ItineraryNestedActivityActionProps {
  onAddSubActivity?: (parentItemId: string) => ItineraryAsyncVoidResult;
  onAddNoteForItem?: (itemId: string, body: string) => ItineraryAsyncVoidResult;
}

export interface ItineraryItemInteractionProps {
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
}

export interface ItineraryInlineItemEditProps {
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => ItineraryAsyncVoidResult;
}
