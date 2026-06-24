import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type {
  ItineraryBookingActionProps,
  ItineraryInlineItemEditProps,
  ItineraryNestedActivityActionProps,
} from "../itinerary-action.types";

export interface SubActivitySharedProps
  extends ItineraryBookingActionProps,
    ItineraryInlineItemEditProps,
    ItineraryNestedActivityActionProps {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  subItems: ItineraryItem[];
  onOpenNoteForItem?: (item: ItineraryItem, compact?: boolean) => void;
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
}

export interface SubActivityModalProps extends SubActivitySharedProps {
  onClose: () => void;
}

export interface SubActivityListProps extends SubActivitySharedProps {
  presentation?: "inline" | "modal";
  selected: boolean;
  visible?: boolean;
}
