import type { BookingDoc, ItineraryItem, PlanStatus, PlanVariant, TripDailyBriefing, TripRole } from "@/src/trip/types";
import type { ItineraryBookingTemplate, ItineraryBookingTicketInput } from "@/src/trip/booking-docs";
import type { ItineraryView } from "@/src/trip/itinerary-core";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type { InlineItineraryItemPatch } from "../../lib/inline-itinerary-item-patch";
import type { TripPlanMutationResult } from "./trip-plan-controls.types";

export interface SmartItineraryTableProps {
  canRestructure?: boolean;
  endDate: string;
  graphItems?: ItineraryItem[];
  items: ItineraryItem[];
  bookingDocs?: BookingDoc[];
  dailyBriefings?: TripDailyBriefing[];
  tripPlans: PlanVariant[];
  selectedTripPlanId: string;
  mainTripPlanId: string;
  tripPlanError: string | null;
  isTripPlanBusy: boolean;
  role: TripRole;
  startDate: string;
  itineraryView?: ItineraryView;
  pathOptions?: ItineraryPathOption[];
  selectedItemId: string;
  dayPathOverrides?: Record<string, string | undefined>;
  showAllPaths?: boolean;
  tripName: string;
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
  onAddStop: (day?: string) => void;
  onAddSubActivity?: (parentItemId: string) => void | Promise<void>;
  onAddNoteForItem?: (itemId: string, body: string) => void | Promise<void>;
  onOpenItemDetails: (itemId: string) => void;
  onSelectItem: (itemId: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onUpdateItemInline?: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => void | Promise<void>;
  onEditItem?: (itemId: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onChangeTripPlan: (tripPlanId: string) => TripPlanMutationResult;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => TripPlanMutationResult;
  onSetMainTripPlan: (tripPlanId: string) => TripPlanMutationResult;
  onCreateTripPlan: (name: string) => TripPlanMutationResult;
  onRenameTripPlan: (tripPlanId: string, name: string) => TripPlanMutationResult;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => void | Promise<void>;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onToggleShowAllPaths?: (showAll: boolean) => void;
}
