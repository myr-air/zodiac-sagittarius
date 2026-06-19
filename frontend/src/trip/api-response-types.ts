import type {
  BookingDoc,
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  ExpenseSummary,
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  Member,
  PlanCheck,
  PlanStatus,
  PlanVariant,
  StopNote,
  Suggestion,
  Trip,
  TripCity,
  TripMemberAccessStatus,
  TripPhotoAlbumLink,
  TripRole,
  TripTask,
} from "./types";

export interface TripSummaryResponse {
  id: string;
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
  joinId: string;
  activePlanVariantId: string | null;
  mainTripPlanId?: string | null;
  ownerMemberId: string;
  version: number;
}

export interface TripMemberResponse {
  id: string;
  tripId: string;
  displayName: string;
  role: TripRole;
  accessStatus: TripMemberAccessStatus;
  presence: Member["presence"];
  color: string;
  userId: string | null;
  claimedAt: string | null;
  lastSeenAt: string | null;
}

export interface PlanVariantResponse {
  id: string;
  tripId: string;
  name: string;
  kind: PlanVariant["kind"];
  status?: PlanStatus;
  description: string;
  version: number;
}

export interface TripPlanResponse extends PlanVariantResponse {
  status: PlanStatus;
}

export interface ItineraryItemResponse {
  id: string;
  tripId: string;
  planVariantId: string;
  pathGroupId?: string;
  pathId?: string;
  pathName?: string;
  pathRole?: ItineraryItem["pathRole"];
  parentItemId?: string | null;
  itemKind?: ItineraryItem["itemKind"];
  timeMode?: ItineraryItem["timeMode"];
  isPlanBlock?: boolean;
  status?: ItineraryItem["status"];
  priority?: ItineraryItem["priority"];
  day: string;
  sortOrder: number;
  startTime: string;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: ItineraryItem["activityType"];
  activitySubtype?: ItineraryItem["activitySubtype"];
  place: string;
  linkLabel: string;
  mapLink: string;
  coordinates: ItineraryCoordinates | null;
  address: string | null;
  durationMinutes: number | null;
  transportation: string;
  details: ItineraryItem["details"];
  advisories: ItineraryAdvisory[];
  note: string;
  createdBy: string;
  updatedAt: string;
  version: number;
}

export type SuggestionResponse = Suggestion;

export interface TripTaskResponse extends TripTask {
  tripId: string;
  version: number;
}

export interface ExpenseResponse {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  title: string;
  amountMinor: number;
  currency: string;
  exchangeRateToSettlementCurrency: number;
  notes: string | null;
  receiptUrl: string | null;
  lineItems: ExpenseLineItem[];
  comments: ExpenseComment[];
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId: string | null;
  version: number;
}

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

export interface JoinTripResponse {
  trip: TripSummaryResponse;
  claimableMembers: TripMemberResponse[];
  joinSessionToken: string;
  expiresAt: string;
}

export interface TripCockpit {
  trip: Trip;
  suggestions: Suggestion[];
  tasks: TripTask[];
  stopNotes: StopNote[];
  expenseSummary: ExpenseSummary | null;
  latestPlanCheck?: PlanCheck | null;
}
