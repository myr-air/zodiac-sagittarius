import type { Locale } from "@/src/i18n/types";
import type { Messages } from "@/src/i18n/messages";
import type {
  BookingDoc,
  ItineraryItem,
  TripDailyBriefing,
} from "@/src/trip/types";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type {
  ItineraryAsyncVoidResult,
  ItineraryBookingActionProps,
  ItineraryInlineItemEditProps,
  ItineraryItemInteractionProps,
  ItineraryNestedActivityActionProps,
} from "./itinerary-action.types";

export interface DayGroupProps
  extends ItineraryBookingActionProps,
    ItineraryInlineItemEditProps,
    ItineraryItemInteractionProps,
    ItineraryNestedActivityActionProps {
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
  contextRailOpen?: boolean;
  bookingDocs: BookingDoc[];
  bookingLinkItems: ItineraryItem[];
  canEdit: boolean;
  collapsed: boolean;
  onAddStop?: (day?: string) => void;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onSaveDayTitle?: (
    date: string,
    version: number,
    title: string | null,
  ) => ItineraryAsyncVoidResult;
  onToggleDay: (day: string) => void;
}
