import type {
  BookingDoc,
  Expense,
  ExpenseReminder,
  TripPhotoAlbumLink,
} from "./trip-record-types";
import type { ItineraryItem, ItineraryPath, StopNote } from "./trip-itinerary-types";
import type { Member } from "./trip-member-types";
import type { PlanVariant, TripPlan } from "./trip-plan-types";
import type { TripCity } from "./trip-place-types";
import type { TripTask } from "./trip-task-types";
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
  TripRole,
} from "./trip-member-types";
export type {
  PlanStatus,
  PlanVariant,
  PlanVariantKind,
  TripPlan,
} from "./trip-plan-types";
export type {
  PlaceResolutionCandidate,
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  PlaceResolutionStatus,
  TripCity,
} from "./trip-place-types";
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
} from "./trip-task-types";
export type {
  EditableSuggestionPatch,
  LocalizedText,
  PlanCheck,
  PlanSuggestion,
  PlanSuggestionActionKind,
  PlanSuggestionScope,
  PlanSuggestionSeverity,
  PlanSuggestionStatus,
  Suggestion,
  SuggestionStatus,
  SuggestionType,
} from "./trip-suggestion-types";

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
