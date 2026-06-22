import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { BookingDoc, ItineraryItem } from "@/src/trip/types";
import type {
  ItineraryBookingActionProps,
  ItineraryInlineItemEditProps,
  ItineraryItemInteractionProps,
  ItineraryNestedActivityActionProps,
} from "../itinerary-action.types";

export interface ActivityCellProps
  extends ItineraryBookingActionProps,
    ItineraryInlineItemEditProps,
    ItineraryItemInteractionProps,
    ItineraryNestedActivityActionProps {
  canEdit: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  selected: boolean;
  subItems: ItineraryItem[];
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
}
