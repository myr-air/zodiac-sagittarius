import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";

export interface ActivityTimeButtonProps {
  editable: boolean;
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onSave: (patch: InlineItineraryItemPatch) => ItineraryAsyncVoidResult;
}

export interface TimeEditModalProps {
  item: ItineraryItem;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  onClose: () => void;
  onSave: (patch: InlineItineraryItemPatch) => ItineraryAsyncVoidResult;
}
