import type {
  Expense,
  ExpenseReminder,
} from "./expenses/expense-types";
import type {
  BookingDoc,
} from "./booking-docs/booking-doc-types";
import type {
  TripPhotoAlbumLink,
} from "./photo-albums/photo-album-types";
import type { ItineraryItem, ItineraryPath, StopNote } from "./itinerary-core/itinerary-types";
import type { Member } from "./members/member-types";
import type { PlanVariant, TripPlan } from "./trip-plans/trip-plan-types";
import type { TripCity } from "./places/place-types";
import type { TripTask } from "./records/task-types";
import type { BudgetCategory } from "./budget/budget-types";
import type { Waypoint } from "./waypoints/waypoint-types";
export type {
  Waypoint,
} from "./waypoints/waypoint-types";
export type {
  BriefingCoordinates,
  BriefingSourceMeta,
  DailyBriefingOverrides,
  TextBriefingBlock,
  TripDailyBriefing,
  WeatherBriefingBlock,
} from "./weather/weather-briefing-types";
export type {
  ActivitySubtype,
  ActivityType,
  AdvisorySeverity,
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  ItineraryItemDetails,
  ItineraryItemKind,
  ItineraryItemPriority,
  ItineraryItemStatus,
  ItineraryPath,
  ItineraryPathRole,
  ItineraryPathScope,
  ItineraryTimeMode,
  NowNextState,
  StopNote,
  ValidationWarning,
  ValidationWarningCode,
} from "./itinerary-core/itinerary-types";
export type {
  Member,
  TripCapability,
  TripJoinCredential,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripInvitableRole,
  TripRole,
} from "./members/member-types";
export type {
  PlanStatus,
  PlanVariant,
  PlanVariantKind,
  TripPlan,
} from "./trip-plans/trip-plan-types";
export type {
  PlaceResolutionCandidate,
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  PlaceResolutionStatus,
  TripCity,
} from "./places/place-types";
export type {
  PlaceSuggestion,
  PlaceSuggestionKind,
} from "./places/place-suggestions";
export type {
  Expense,
  ExpenseCategory,
  ExpenseComment,
  ExpenseLineItem,
  ExpenseSettlementAllocation,
  ExpenseReminder,
  ExpenseSummary,
  SettlementSuggestion,
} from "./expenses/expense-types";
export type {
  BookingDoc,
  BookingDocExternalLink,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
} from "./booking-docs/booking-doc-types";
export type {
  TripPhotoAlbumAccess,
  TripPhotoAlbumLink,
  TripPhotoAlbumProvider,
} from "./photo-albums/photo-album-types";
export type {
  TripTask,
  TripTaskKind,
  TripTaskStatus,
  TripTaskVisibility,
} from "./records/task-types";
export type {
  EditableSuggestionPatch,
  Suggestion,
  SuggestionReviewDecision,
  SuggestionStatus,
  SuggestionType,
} from "./itinerary-core/itinerary-suggestion-types";
export type {
  LocalizedText,
  PlanCheck,
  PlanSuggestion,
  PlanSuggestionActionKind,
  PlanSuggestionScope,
  PlanSuggestionSeverity,
  PlanSuggestionStatus,
} from "./trip-plans/plan-suggestion-types";
export type { BudgetCategory } from "./budget/budget-types";

export interface Trip {
  id: string;
  joinId: string;
  joinPasswordHash: string;
  name: string;
  originLabel?: string;
  originCity?: string;
  originCountry?: string;
  originCountryCode?: string;
  destinationLabel: string;
  destinationCities?: TripCity[];
  countries?: string[];
  partySize?: number;
  defaultTimezone?: string;
  startDate: string;
  endDate: string;
  dateWindowStart?: string;
  dateWindowEnd?: string;
  budgetCategories?: BudgetCategory[];
  activePlanVariantId: string;
  mainTripPlanId?: string;
  planVariants: PlanVariant[];
  tripPlans?: TripPlan[];
  itineraryPaths?: ItineraryPath[];
  members: Member[];
  itineraryItems: ItineraryItem[];
  waypoints?: Waypoint[];
  expenses: Expense[];
  bookingDocs?: BookingDoc[];
  photoAlbumLinks?: TripPhotoAlbumLink[];
  stopNotes?: StopNote[];
  tasks?: TripTask[];
  expenseReminders?: ExpenseReminder[];
  version?: number;
}
