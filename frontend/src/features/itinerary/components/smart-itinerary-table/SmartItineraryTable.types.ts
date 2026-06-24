import type { BookingDoc, ItineraryItem, PlanStatus, PlanVariant, TripDailyBriefing, TripRole } from "@/src/trip/types";
import type { ItineraryView } from "@/src/trip/itinerary-core";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type {
  ItineraryAsyncVoidResult,
  ItineraryBookingActionProps,
  ItineraryInlineItemEditProps,
  ItineraryItemInteractionProps,
  ItineraryNestedActivityActionProps,
} from "./itinerary-action.types";
import type { TripPlanMutationResult } from "./trip-plan-controls.types";

export interface SmartItineraryTableProps
  extends ItineraryBookingActionProps,
    ItineraryInlineItemEditProps,
    ItineraryItemInteractionProps,
    ItineraryNestedActivityActionProps {
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
  onAddStop: (day?: string) => void;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onChangeTripPlan: (tripPlanId: string) => TripPlanMutationResult;
  onChangeTripPlanStatus: (
    tripPlanId: string,
    status: Exclude<PlanStatus, "main">,
  ) => TripPlanMutationResult;
  onSetMainTripPlan: (tripPlanId: string) => TripPlanMutationResult;
  onCreateTripPlan: (name: string) => TripPlanMutationResult;
  onRenameTripPlan: (tripPlanId: string, name: string) => TripPlanMutationResult;
  onSaveDayTitle?: (date: string, version: number, title: string | null) => ItineraryAsyncVoidResult;
  onChangeDayPath?: (day: string, pathId: string) => void;
  onClearDayPath?: (day: string) => void;
  onToggleShowAllPaths?: (showAll: boolean) => void;
}
