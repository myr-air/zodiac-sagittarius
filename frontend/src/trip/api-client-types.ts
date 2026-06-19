import type {
  BookingDoc,
  EditableSuggestionPatch,
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  ExpenseSummary,
  ItineraryCoordinates,
  ItineraryItem,
  Member,
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  PlanCheck,
  PlanStatus,
  PlanSuggestion,
  PlanVariant,
  StopNote,
  Suggestion,
  SuggestionType,
  Trip,
  TripDailyBriefing,
  TripJoinCredential,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripPhotoAlbumLink,
  TripRole,
  TripTask,
} from "./types";
import type {
  JoinTripResponse,
  TripCockpit,
} from "./api-response-types";
import type { ItineraryExportDocument } from "./itinerary-import-export";

export interface TripApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface JoinInviteTokenResponse {
  token: string;
  expiresAt: string;
}

export interface TripApiClient {
  joinTrip(credentials: TripJoinCredential): Promise<JoinTripResponse>;
  resolveJoinInviteToken?: (token: string) => Promise<JoinTripResponse>;
  rotateJoinInviteToken?: (tripId: string, sessionToken: string) => Promise<JoinInviteTokenResponse>;
  claimMember(tripId: string, memberId: string, participantPassword: string, joinSessionToken: string): Promise<TripParticipantSession>;
  loginMember(tripId: string, memberId: string, participantPassword: string, joinSessionToken: string): Promise<TripParticipantSession>;
  logout(tripId: string, sessionToken: string): Promise<void>;
  loadTrip(tripId: string, sessionToken: string): Promise<TripCockpit>;
  listDailyBriefings(tripId: string, sessionToken: string): Promise<TripDailyBriefing[]>;
  patchDailyBriefing(tripId: string, date: string, sessionToken: string, request: PatchDailyBriefingApiRequest): Promise<TripDailyBriefing>;
  patchTrip(tripId: string, sessionToken: string, request: PatchTripApiRequest): Promise<Trip>;
  createTripPlan?: (tripId: string, sessionToken: string, request: CreatePlanVariantApiRequest) => Promise<PlanVariant>;
  patchTripPlan?: (tripId: string, tripPlanId: string, sessionToken: string, request: PatchPlanVariantApiRequest) => Promise<PlanVariant>;
  setMainTripPlan?: (tripId: string, tripPlanId: string, sessionToken: string, request: PublishPlanVariantApiRequest) => Promise<Trip>;
  createPlanVariant(tripId: string, sessionToken: string, request: CreatePlanVariantApiRequest): Promise<PlanVariant>;
  patchPlanVariant(tripId: string, planVariantId: string, sessionToken: string, request: PatchPlanVariantApiRequest): Promise<PlanVariant>;
  publishPlanVariant(tripId: string, planVariantId: string, sessionToken: string, request: PublishPlanVariantApiRequest): Promise<Trip>;
  createTask(tripId: string, sessionToken: string, request: CreateTaskApiRequest): Promise<TripTask>;
  patchTask(tripId: string, taskId: string, sessionToken: string, request: PatchTaskApiRequest): Promise<TripTask>;
  createItineraryItem(tripId: string, sessionToken: string, request: CreateItineraryItemApiRequest): Promise<ItineraryItem>;
  patchItineraryItem(tripId: string, itemId: string, sessionToken: string, request: PatchItineraryItemApiRequest): Promise<ItineraryItem>;
  deleteItineraryItem(tripId: string, itemId: string, sessionToken: string): Promise<ItineraryItem>;
  reorderItineraryItems(tripId: string, sessionToken: string, request: ReorderItineraryItemsApiRequest): Promise<ItineraryItem[]>;
  runPlanCheck?: (tripId: string, sessionToken: string, tripPlanId?: string | null) => Promise<PlanCheck>;
  latestPlanCheck?: (tripId: string, sessionToken: string, tripPlanId?: string | null) => Promise<PlanCheck | null>;
  patchPlanSuggestion?: (tripId: string, suggestionId: string, sessionToken: string, request: PatchPlanSuggestionApiRequest) => Promise<PlanSuggestion>;
  resolvePlace?: (tripId: string, sessionToken: string, request: PlaceResolutionRequest) => Promise<PlaceResolutionResponse>;
  importItinerary(tripId: string, sessionToken: string, request: ImportItineraryApiRequest): Promise<ItineraryExportDocument>;
  createSuggestion(tripId: string, sessionToken: string, request: CreateSuggestionApiRequest): Promise<Suggestion>;
  approveSuggestion(tripId: string, suggestionId: string, sessionToken: string): Promise<Suggestion>;
  rejectSuggestion(tripId: string, suggestionId: string, sessionToken: string): Promise<Suggestion>;
  createStopNote(tripId: string, sessionToken: string, request: CreateStopNoteApiRequest): Promise<StopNote>;
  patchStopNote(tripId: string, noteId: string, sessionToken: string, request: PatchStopNoteApiRequest): Promise<StopNote>;
  deleteStopNote(tripId: string, noteId: string, sessionToken: string): Promise<StopNote>;
  listMembers(tripId: string, sessionToken: string): Promise<Member[]>;
  updatePresence(tripId: string, sessionToken: string, request: UpdatePresenceApiRequest): Promise<Member>;
  createMember(tripId: string, sessionToken: string, request: CreateMemberApiRequest): Promise<Member>;
  patchMember(tripId: string, memberId: string, sessionToken: string, request: PatchMemberApiRequest): Promise<Member>;
  resetMemberClaim(tripId: string, memberId: string, sessionToken: string): Promise<Member>;
  getExpenseSummary(tripId: string, sessionToken: string, tripPlanId?: string | null): Promise<ExpenseSummary>;
  recordExpenseReminder(tripId: string, sessionToken: string, request: RecordExpenseReminderApiRequest, tripPlanId?: string | null): Promise<ExpenseSummary>;
  createExpense(tripId: string, sessionToken: string, request: CreateExpenseApiRequest): Promise<Expense>;
  patchExpense(tripId: string, expenseId: string, sessionToken: string, request: PatchExpenseApiRequest): Promise<Expense>;
  deleteExpense(tripId: string, expenseId: string, sessionToken: string): Promise<Expense>;
  createBookingDoc(tripId: string, sessionToken: string, request: CreateBookingDocApiRequest): Promise<BookingDoc>;
  patchBookingDoc(tripId: string, bookingId: string, sessionToken: string, request: PatchBookingDocApiRequest): Promise<BookingDoc>;
  deleteBookingDoc(tripId: string, bookingId: string, sessionToken: string): Promise<BookingDoc>;
  createPhotoAlbum(tripId: string, sessionToken: string, request: CreatePhotoAlbumApiRequest): Promise<TripPhotoAlbumLink>;
  patchPhotoAlbum(tripId: string, albumId: string, sessionToken: string, request: PatchPhotoAlbumApiRequest): Promise<TripPhotoAlbumLink>;
  deletePhotoAlbum(tripId: string, albumId: string, sessionToken: string): Promise<TripPhotoAlbumLink>;
}

export interface CreateTaskApiRequest {
  clientMutationId: string;
  tripPlanId?: string | null;
  title: string;
  visibility: TripTask["visibility"];
  kind?: TripTask["kind"];
  assigneeId?: string | null;
  relatedItemId?: string | null;
}

export interface ImportItineraryApiRequest {
  fileName?: string;
  contentType?: string;
  mode?: "auto" | "json" | "ai";
  content: string;
}

export interface PatchTripApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  name?: string;
  destinationLabel?: string;
  countries?: string[];
  partySize?: number;
  defaultTimezone?: string;
  startDate?: string;
  endDate?: string;
  activePlanVariantId?: string;
}

export interface PatchDailyBriefingApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  dayTitle?: string | null;
  outfitAdvice?: string | null;
  festivalNote?: string | null;
  factsNote?: string | null;
}

export interface CreatePlanVariantApiRequest {
  clientMutationId: string;
  name: string;
  kind?: PlanVariant["kind"];
  status?: PlanStatus;
  description?: string;
  sourceTripPlanId?: string;
  creationMode?: "blank" | "duplicate-current" | "import";
}

export interface PatchPlanVariantApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<PlanVariant, "name" | "kind" | "status" | "description">>;
}

export interface PublishPlanVariantApiRequest {
  clientMutationId: string;
  previousMainNextStatus?: Exclude<PlanStatus, "main">;
}

export interface PatchTaskApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<TripTask, "title" | "status" | "assigneeId" | "relatedItemId">>;
}

export interface PatchItineraryItemApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<ItineraryItem, "pathGroupId" | "pathId" | "pathName" | "pathRole" | "parentItemId" | "itemKind" | "timeMode" | "isPlanBlock" | "status" | "priority" | "day" | "sortOrder" | "durationMinutes" | "activity" | "activityType" | "activitySubtype" | "place" | "transportation" | "details" | "note">> & {
    startTime?: string | null;
    endTime?: string | null;
    endOffsetDays?: number;
    address?: string | null;
    coordinates?: ItineraryCoordinates | null;
    mapLink?: string | null;
  };
}

export interface CreateItineraryItemApiRequest {
  clientMutationId: string;
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
  startTime?: string | null;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: ItineraryItem["activityType"];
  activitySubtype?: ItineraryItem["activitySubtype"] | null;
  place: string;
  mapLink?: string | null;
  address?: string | null;
  coordinates?: ItineraryCoordinates | null;
  durationMinutes?: number | null;
  transportation?: string | null;
  details?: ItineraryItem["details"] | null;
  note?: string | null;
}

export interface ReorderItineraryItemsApiRequest {
  clientMutationId: string;
  planVariantId: string;
  day: string;
  itemIds: string[];
}

export interface PatchPlanSuggestionApiRequest {
  expectedVersion: number;
  status: PlanSuggestion["status"];
  snoozedUntil?: string | null;
}

export interface CreateSuggestionApiRequest {
  clientMutationId: string;
  type: SuggestionType;
  targetItemId: string | null;
  planVariantId: string;
  sourceVersion: number | null;
  proposedPatch: EditableSuggestionPatch;
}

export interface CreateStopNoteApiRequest {
  clientMutationId: string;
  tripPlanId?: string | null;
  itineraryItemId: string;
  body: string;
}

export interface PatchStopNoteApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  body: string;
}

export interface CreateMemberApiRequest {
  displayName: string;
  role: Exclude<TripRole, "owner">;
  color: string;
  participantPassword?: string;
}

export interface PatchMemberApiRequest {
  displayName?: string;
  role?: Exclude<TripRole, "owner">;
  accessStatus?: TripMemberAccessStatus;
  participantPassword?: string;
}

export interface UpdatePresenceApiRequest {
  clientMutationId: string;
  presence: Member["presence"];
}

export interface CreateExpenseApiRequest {
  clientMutationId: string;
  tripPlanId?: string | null;
  title: string;
  amountMinor: number;
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string | null;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId?: string | null;
}

export interface RecordExpenseReminderApiRequest {
  clientMutationId: string;
  from: string;
  to: string;
  amountMinor: number;
}

export interface PatchExpenseApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  tripPlanId?: string | null;
  title?: string;
  amountMinor?: number;
  currency?: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string | null;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  paidBy?: string;
  category?: Expense["category"];
  splits?: Record<string, number>;
  itineraryItemId?: string | null;
}

export type BookingDocExternalLinkApiRequest = Omit<BookingDoc["externalLinks"][number], "id"> & {
  id?: string;
};

export interface CreateBookingDocApiRequest extends Omit<BookingDoc, "id" | "tripId" | "createdBy" | "updatedAt" | "version" | "externalLinks"> {
  clientMutationId: string;
  externalLinks: BookingDocExternalLinkApiRequest[];
}

export interface PatchBookingDocApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Omit<CreateBookingDocApiRequest, "clientMutationId">>;
}

export interface CreatePhotoAlbumApiRequest extends Omit<TripPhotoAlbumLink, "id" | "tripId" | "createdBy" | "updatedAt" | "version"> {
  clientMutationId: string;
}

export interface PatchPhotoAlbumApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Omit<CreatePhotoAlbumApiRequest, "clientMutationId">>;
}
