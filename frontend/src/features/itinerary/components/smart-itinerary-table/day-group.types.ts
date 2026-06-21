import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type {
  BookingDoc,
  ItineraryItem,
  TripDailyBriefing,
} from "@/src/trip/types";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type {
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import type { InlineItineraryItemPatch } from "../../lib/inline-itinerary-item-patch";
import type {
  ItineraryAsyncVoidResult,
  ItineraryBookingMutationResult,
} from "./itinerary-action.types";

export interface DayGroupProps {
  graphColumnWidth: number;
  graphItems: ItineraryItem[];
  group: { day: string; items: ItineraryItem[]; warningCount: number };
  dailyBriefing: TripDailyBriefing | null;
  hasTopSpacer: boolean;
  itineraryLabels: Messages["itinerary"];
  locale: Locale;
  startDate: string;
  pathOptions: ItineraryPathOption[];
  dayPathOverride?: string;
  showAllPaths: boolean;
  selectedItemId: string;
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  canEdit: boolean;
  collapsed: boolean;
  onAddStop?: (day?: string) => void;
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
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onSaveDayTitle?: (
    date: string,
    version: number,
    title: string | null,
  ) => ItineraryAsyncVoidResult;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => ItineraryAsyncVoidResult;
  onToggleDay: (day: string) => void;
}
