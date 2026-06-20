import type {
  BookingDoc,
  Expense,
  ExpenseReminder,
  TripPhotoAlbumLink,
} from "./trip-record-types";
import type { Member } from "./trip-member-types";
import type { TripTask } from "./trip-task-types";
export type {
  Member,
  TripCapability,
  TripJoinCredential,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripRole,
} from "./trip-member-types";
export type {
  BookingDoc,
  BookingDocExternalLink,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
  Expense,
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

export type PlanStatus = "main" | "backup" | "draft" | "proposal";
export type PlanVariantKind = "main" | "backup" | "draft" | "split";

export type ActivityType = "travel" | "food" | "shopping" | "attraction" | "experience" | "stay" | "default";
export type ActivitySubtype = "flight" | "train" | "bus" | "taxi" | "ferry" | "walk" | "car" | "shuttle";
export type ItineraryItemKind = "travel" | "activity" | "lodging" | "meal" | "note" | "preparation" | "foodRecommendation";
export type ItineraryTimeMode = "scheduled" | "flexible";
export type ItineraryItemStatus = "idea" | "planned" | "booked" | "confirmed" | "done" | "skipped";
export type ItineraryItemPriority = "low" | "normal" | "high" | "must";
export type ItineraryItemDetails = Record<string, unknown>;

export type AdvisorySeverity = "info" | "warning" | "critical";

export interface ItineraryAdvisory {
  code: string;
  label: string;
  severity: AdvisorySeverity;
}

export interface PlanVariant {
  id: string;
  tripId: string;
  name: string;
  kind: PlanVariantKind;
  status?: PlanStatus;
  description: string;
  version?: number;
}

export type TripPlan = PlanVariant;

export type ItineraryPathScope = "day" | "trip";
export type ItineraryPathRole = "main" | "alternative";

export interface ItineraryPath {
  id: string;
  tripId: string;
  name: string;
  scope: ItineraryPathScope;
  day?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryCoordinates {
  lat: number;
  lng: number;
}

export interface TripCity {
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export type PlaceResolutionStatus = "resolved" | "ambiguous" | "unresolved";

export interface PlaceResolutionCandidate {
  name: string;
  address: string;
  coordinates: ItineraryCoordinates;
  mapLink: string;
  confidence: number;
  source: string;
  evidence: string[];
}

export interface PlaceResolutionRequest {
  clientMutationId: string;
  activity: string;
  placeHint: string;
  destinationLabel: string;
  countries: string[];
  day: string;
}

export interface PlaceResolutionResponse {
  status: PlaceResolutionStatus;
  candidates: PlaceResolutionCandidate[];
}

export interface BriefingCoordinates {
  lat: number;
  lng: number;
}

export interface BriefingSourceMeta {
  source: string;
  sourceUrl: string | null;
  fetchedAt: string | null;
  expiresAt: string | null;
  confidence: "high" | "medium" | "low" | "unknown";
  unavailableReason: string | null;
}

export interface WeatherBriefingBlock {
  conditionCode: string;
  conditionLabel: string;
  temperatureMaxCelsius: number | null;
  temperatureMinCelsius: number | null;
  apparentTemperatureMaxCelsius?: number | null;
  apparentTemperatureMinCelsius?: number | null;
  sunrise: string | null;
  sunset: string | null;
  daylightDurationSeconds?: number | null;
  sunshineDurationSeconds?: number | null;
  uvIndexMax?: number | null;
  precipitationSumMm?: number | null;
  precipitationHours?: number | null;
  rainSumMm?: number | null;
  humidityPercent: number | null;
  windSpeedKph: number | null;
  windGustsKph?: number | null;
  windDirectionDegrees?: number | null;
  cloudCoverMeanPercent?: number | null;
  visibilityMeanMeters?: number | null;
  visibilityMinMeters?: number | null;
  dewPointMeanCelsius?: number | null;
  pressureMslMeanHpa?: number | null;
  rainChancePercent: number | null;
  meta: BriefingSourceMeta;
}

export interface TextBriefingBlock {
  title: string;
  body: string;
  meta: BriefingSourceMeta;
}

export interface DailyBriefingOverrides {
  dayTitle?: string | null;
  outfitAdvice?: string | null;
  festivalNote?: string | null;
  factsNote?: string | null;
}

export interface TripDailyBriefing {
  tripId: string;
  date: string;
  locationKey: string;
  locationLabel: string;
  coordinates: BriefingCoordinates | null;
  weather: WeatherBriefingBlock | null;
  holiday: TextBriefingBlock | null;
  festival: TextBriefingBlock | null;
  facts: TextBriefingBlock | null;
  outfitAdvice: TextBriefingBlock | null;
  manualOverrides: DailyBriefingOverrides;
  updatedAt: string;
  version: number;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  planVariantId: string;
  pathGroupId?: string;
  pathId?: string;
  pathName?: string;
  pathRole?: ItineraryPathRole;
  parentItemId?: string | null;
  itemKind?: ItineraryItemKind;
  timeMode?: ItineraryTimeMode;
  isPlanBlock?: boolean;
  status?: ItineraryItemStatus;
  priority?: ItineraryItemPriority;
  day: string;
  sortOrder: number;
  startTime: string;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: ActivityType;
  activitySubtype?: ActivitySubtype | null;
  place: string;
  linkLabel: string;
  mapLink: string;
  coordinates?: ItineraryCoordinates;
  address?: string;
  durationMinutes: number | null;
  transportation: string;
  details: ItineraryItemDetails;
  advisories?: ItineraryAdvisory[];
  note: string;
  createdBy: string;
  updatedAt: string;
  version: number;
}

export interface StopNote {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  itemId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  version?: number;
}

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

export type ValidationWarningCode =
  | "missing-start-time"
  | "invalid-start-time"
  | "missing-duration"
  | "missing-map-link"
  | "missing-transportation"
  | "time-order-conflict"
  | "overlap"
  | "missing-parent-item"
  | "invalid-parent-plan-block"
  | "nested-sub-activity"
  | "parent-scope-mismatch"
  | "child-outside-plan-block"
  | "unresolved-location"
  | "stale-location";

export interface ValidationWarning {
  code: ValidationWarningCode;
  message: string;
  itemId: string;
}

export interface NowNextState {
  current: ItineraryItem | null;
  next: ItineraryItem | null;
  fallbackReason: string | null;
}

export type SuggestionType = "add" | "edit" | "delete" | "reorder";
export type SuggestionStatus = "pending" | "approved" | "rejected" | "conflicted";

export interface LocalizedText {
  en: string;
  th: string;
}

export type PlanSuggestionSeverity = "info" | "warning" | "critical";
export type PlanSuggestionScope = "item" | "betweenItems" | "day" | "trip";
export type PlanSuggestionStatus = "pending" | "accepted" | "dismissed" | "snoozed";
export type PlanSuggestionActionKind = "accept" | "dismiss" | "snooze" | "convertToItem" | "editItem";

export interface PlanSuggestion {
  id: string;
  tripId: string;
  planCheckId: string;
  severity: PlanSuggestionSeverity;
  scope: PlanSuggestionScope;
  targetItemIds: string[];
  explanation: LocalizedText;
  recommendedAction: LocalizedText;
  actionKind?: PlanSuggestionActionKind | null;
  actionPayload: Record<string, unknown>;
  status: PlanSuggestionStatus;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PlanCheck {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  createdBy: string;
  itineraryFingerprint: string;
  stale: boolean;
  status: "running" | "complete" | "failed";
  languageMetadata: Record<string, unknown>;
  createdAt: string;
  completedAt?: string | null;
  version: number;
  suggestions: PlanSuggestion[];
}

export type EditableSuggestionPatch = Partial<
  Pick<
    ItineraryItem,
    "day" | "startTime" | "activity" | "activityType" | "activitySubtype" | "place" | "mapLink" | "durationMinutes" | "transportation" | "note"
  >
>;

export interface Suggestion {
  id: string;
  tripId: string;
  proposerId: string;
  type: SuggestionType;
  targetItemId: string | null;
  planVariantId: string;
  proposedPatch: EditableSuggestionPatch;
  sourceVersion: number | null;
  status: SuggestionStatus;
  createdAt: string;
}
