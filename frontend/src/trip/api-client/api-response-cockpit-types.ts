import type {
  BookingDoc,
  ExpenseSummary,
  PlanCheck,
  StopNote,
  Suggestion,
  Trip,
  TripPhotoAlbumLink,
  TripTask,
} from "../types";
import type {
  ItineraryItemResponse,
  SuggestionResponse,
} from "./api-response-itinerary-types";
import type {
  PlanVariantResponse,
  TripMemberResponse,
  TripPlanResponse,
  TripSummaryResponse,
  TripTaskResponse,
} from "./api-response-planning-types";
import type { ExpenseResponse } from "./api-response-record-types";

export interface TripCockpitResponse {
  trip: TripSummaryResponse;
  members: TripMemberResponse[];
  planVariants?: PlanVariantResponse[];
  tripPlans?: TripPlanResponse[];
  itineraryItems: ItineraryItemResponse[];
  suggestions: SuggestionResponse[];
  tasks: TripTaskResponse[];
  stopNotes: StopNote[];
  expenses: ExpenseResponse[];
  expenseSummary: ExpenseSummary | null;
  bookingDocs: BookingDoc[];
  photoAlbumLinks: TripPhotoAlbumLink[];
  latestPlanCheck?: PlanCheck | null;
}

export interface TripCockpit {
  trip: Trip;
  suggestions: Suggestion[];
  tasks: TripTask[];
  stopNotes: StopNote[];
  expenseSummary: ExpenseSummary | null;
  latestPlanCheck?: PlanCheck | null;
}
