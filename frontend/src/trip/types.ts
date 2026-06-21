import type {
  BookingDoc,
  Expense,
  ExpenseReminder,
  TripPhotoAlbumLink,
} from "./trip-record-types";
import type { ItineraryItem, ItineraryPath, StopNote } from "./trip-itinerary-types";
import type { Member } from "./members/member-types";
import type { PlanVariant, TripPlan } from "./trip-plans/trip-plan-types";
import type { TripCity } from "./places/place-types";
import type { TripTask } from "./records/task-types";
export type {
  BriefingCoordinates,
  BriefingSourceMeta,
  DailyBriefingOverrides,
  TextBriefingBlock,
  TripDailyBriefing,
  WeatherBriefingBlock,
} from "./trip-briefing-types";
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
} from "./trip-itinerary-types";
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
  BookingDoc,
  BookingDocExternalLink,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
  Expense,
  ExpenseCategory,
  ExpenseComment,
  ExpenseLineItem,
  ExpenseReminder,
  ExpenseSummary,
  SettlementSuggestion,
  TripPhotoAlbumAccess,
  TripPhotoAlbumLink,
  TripPhotoAlbumProvider,
} from "./trip-record-types";
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
  activePlanVariantId: string;
  mainTripPlanId?: string;
  planVariants: PlanVariant[];
  tripPlans?: TripPlan[];
  itineraryPaths?: ItineraryPath[];
  members: Member[];
  itineraryItems: ItineraryItem[];
  expenses: Expense[];
  bookingDocs?: BookingDoc[];
  photoAlbumLinks?: TripPhotoAlbumLink[];
  stopNotes?: StopNote[];
  tasks?: TripTask[];
  expenseReminders?: ExpenseReminder[];
  version?: number;
}
