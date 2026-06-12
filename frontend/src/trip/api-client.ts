import type {
  BookingDoc,
  ExpenseSummary,
  Expense,
  ExpenseComment,
  ExpenseLineItem,
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  PlanCheck,
  PlanSuggestion,
  Member,
  PlanStatus,
  PlanVariant,
  StopNote,
  Suggestion,
  Trip, TripCity,
  TripDailyBriefing,
  TripJoinCredential,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripPhotoAlbumLink,
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  TripRole,
  TripTask,
  EditableSuggestionPatch,
  SuggestionType,
} from "./types";
import { parseItineraryImportDocument, type ItineraryExportDocument } from "./itinerary-import-export";
import { tripApiRoutes } from "./api-routes";
import { normalizeExpenseSplitsFromMinor } from "./expenses";

export interface TripApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

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

export interface JoinInviteTokenResponse {
  token: string;
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

export class TripApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(input: { code: string; message: string; status: number }) {
    super(input.message);
    this.name = "TripApiError";
    this.code = input.code;
    this.status = input.status;
  }
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
  createPlanVariant(tripId: string, sessionToken: string, request: CreatePlanVariantApiRequest): Promise<PlanVariant>;
  patchPlanVariant(tripId: string, planVariantId: string, sessionToken: string, request: PatchPlanVariantApiRequest): Promise<PlanVariant>;
  publishPlanVariant(tripId: string, planVariantId: string, sessionToken: string, request: PublishPlanVariantApiRequest): Promise<Trip>;
  createTask(tripId: string, sessionToken: string, request: CreateTaskApiRequest): Promise<TripTask>;
  patchTask(tripId: string, taskId: string, sessionToken: string, request: PatchTaskApiRequest): Promise<TripTask>;
  createItineraryItem(tripId: string, sessionToken: string, request: CreateItineraryItemApiRequest): Promise<ItineraryItem>;
  patchItineraryItem(tripId: string, itemId: string, sessionToken: string, request: PatchItineraryItemApiRequest): Promise<ItineraryItem>;
  deleteItineraryItem(tripId: string, itemId: string, sessionToken: string): Promise<ItineraryItem>;
  reorderItineraryItems(tripId: string, sessionToken: string, request: ReorderItineraryItemsApiRequest): Promise<ItineraryItem[]>;
  runPlanCheck?: (tripId: string, sessionToken: string) => Promise<PlanCheck>;
  latestPlanCheck?: (tripId: string, sessionToken: string) => Promise<PlanCheck | null>;
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
  getExpenseSummary(tripId: string, sessionToken: string): Promise<ExpenseSummary>;
  recordExpenseReminder(tripId: string, sessionToken: string, request: RecordExpenseReminderApiRequest): Promise<ExpenseSummary>;
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
  patch: Partial<Pick<ItineraryItem, "pathGroupId" | "pathId" | "pathName" | "pathRole" | "parentItemId" | "itemKind" | "timeMode" | "isPlanBlock" | "status" | "priority" | "day" | "sortOrder" | "durationMinutes" | "activity" | "activityType" | "place" | "transportation" | "details" | "note">> & {
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

export function createTripApiClient(options: TripApiClientOptions = {}): TripApiClient {
  const fetcher = options.fetchImpl ?? fetch;
  const baseUrl = trimTrailingSlash(options.baseUrl ?? "");

  async function request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw await toTripApiError(response);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  return {
    joinTrip(credentials) {
      return request<JoinTripResponse>(tripApiRoutes.joinSession(), {
        method: "POST",
        body: JSON.stringify({ joinCode: credentials.joinId, tripPassword: credentials.password }),
      });
    },
    resolveJoinInviteToken(token) {
      return request<JoinTripResponse>(tripApiRoutes.joinInviteTokenCurrent(token), {
        method: "GET",
      });
    },
    rotateJoinInviteToken(tripId, sessionToken) {
      return request<JoinInviteTokenResponse>(tripApiRoutes.joinInviteTokens(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    claimMember(tripId, memberId, participantPassword, joinSessionToken) {
      return request<TripParticipantSession>(tripApiRoutes.claimMember(tripId, memberId), {
        method: "POST",
        body: JSON.stringify({ participantPassword, joinSessionToken }),
      });
    },
    loginMember(tripId, memberId, participantPassword, joinSessionToken) {
      return request<TripParticipantSession>(tripApiRoutes.memberSessions(tripId), {
        method: "POST",
        body: JSON.stringify({ memberId, participantPassword, joinSessionToken }),
      });
    },
    async logout(tripId, sessionToken) {
      await request<void>(tripApiRoutes.currentMemberSession(tripId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    async loadTrip(tripId, sessionToken) {
      const cockpit = await request<TripCockpitResponse>(tripApiRoutes.trip(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapCockpitResponse(cockpit);
    },
    listDailyBriefings(tripId, sessionToken) {
      return request<TripDailyBriefing[]>(tripApiRoutes.dailyBriefings(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    patchDailyBriefing(tripId, date, sessionToken, patchRequest) {
      return request<TripDailyBriefing>(tripApiRoutes.dailyBriefing(tripId, date), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(patchRequest),
      });
    },
    async patchTrip(tripId, sessionToken, tripRequest) {
      const trip = await request<TripSummaryResponse>(tripApiRoutes.trip(tripId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(tripRequest),
      });
      return mapTripSummary(trip);
    },
    async createPlanVariant(tripId, sessionToken, planRequest) {
      const variant = await request<PlanVariantResponse>(tripApiRoutes.tripPlans(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(planRequest),
      });
      return mapPlanVariant(variant);
    },
    async patchPlanVariant(tripId, planVariantId, sessionToken, planRequest) {
      const variant = await request<PlanVariantResponse>(tripApiRoutes.tripPlan(tripId, planVariantId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(planRequest),
      });
      return mapPlanVariant(variant);
    },
    async publishPlanVariant(tripId, planVariantId, sessionToken, publishRequest) {
      const trip = await request<TripSummaryResponse>(tripApiRoutes.setMainTripPlan(tripId, planVariantId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(publishRequest),
      });
      return mapTripSummary(trip);
    },
    async createTask(tripId, sessionToken, taskRequest) {
      const task = await request<TripTaskResponse>(tripApiRoutes.tasks(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(taskRequest),
      });
      return mapTask(task);
    },
    async patchTask(tripId, taskId, sessionToken, taskRequest) {
      const task = await request<TripTaskResponse>(tripApiRoutes.task(tripId, taskId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(taskRequest),
      });
      return mapTask(task);
    },
    async patchItineraryItem(tripId, itemId, sessionToken, itemRequest) {
      const item = await request<ItineraryItemResponse>(tripApiRoutes.itineraryItem(tripId, itemId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          ...itemRequest,
          patch: serializeItineraryLocation(itemRequest.patch),
        }),
      });
      return mapItineraryItem(item);
    },
    async createItineraryItem(tripId, sessionToken, itemRequest) {
      const item = await request<ItineraryItemResponse>(tripApiRoutes.itineraryItems(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(serializeItineraryLocation(itemRequest)),
      });
      return mapItineraryItem(item);
    },
    async deleteItineraryItem(tripId, itemId, sessionToken) {
      const item = await request<ItineraryItemResponse>(tripApiRoutes.itineraryItem(tripId, itemId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapItineraryItem(item);
    },
    async importItinerary(tripId, sessionToken, importRequest) {
      const document = await request<unknown>(tripApiRoutes.itineraryImports(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(importRequest),
      });
      return parseItineraryImportDocument(JSON.stringify(document));
    },
    async reorderItineraryItems(tripId, sessionToken, reorderRequest) {
      const items = await request<ItineraryItemResponse[]>(tripApiRoutes.reorderItineraryItems(tripId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(reorderRequest),
      });
      return items.map(mapItineraryItem);
    },
    runPlanCheck(tripId, sessionToken) {
      return request<PlanCheck>(tripApiRoutes.planChecks(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    latestPlanCheck(tripId, sessionToken) {
      return request<PlanCheck | null>(tripApiRoutes.latestPlanCheck(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    patchPlanSuggestion(tripId, suggestionId, sessionToken, suggestionRequest) {
      return request<PlanSuggestion>(tripApiRoutes.planSuggestion(tripId, suggestionId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(suggestionRequest),
      });
    },
    resolvePlace(tripId, sessionToken, resolveRequest) {
      return request<PlaceResolutionResponse>(tripApiRoutes.resolvePlace(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(resolveRequest),
      });
    },
    createSuggestion(tripId, sessionToken, suggestionRequest) {
      return request<Suggestion>(tripApiRoutes.suggestions(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(suggestionRequest),
      });
    },
    approveSuggestion(tripId, suggestionId, sessionToken) {
      return request<Suggestion>(tripApiRoutes.suggestion(tripId, suggestionId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ status: "approved" }),
      });
    },
    rejectSuggestion(tripId, suggestionId, sessionToken) {
      return request<Suggestion>(tripApiRoutes.suggestion(tripId, suggestionId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ status: "rejected" }),
      });
    },
    createStopNote(tripId, sessionToken, noteRequest) {
      return request<StopNote>(tripApiRoutes.stopNotes(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(noteRequest),
      });
    },
    patchStopNote(tripId, noteId, sessionToken, noteRequest) {
      return request<StopNote>(tripApiRoutes.stopNote(tripId, noteId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(noteRequest),
      });
    },
    deleteStopNote(tripId, noteId, sessionToken) {
      return request<StopNote>(tripApiRoutes.stopNote(tripId, noteId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    async listMembers(tripId, sessionToken) {
      const members = await request<TripMemberResponse[]>(tripApiRoutes.members(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return members.map(mapMember);
    },
    async updatePresence(tripId, sessionToken, presenceRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.presence(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(presenceRequest),
      });
      return mapMember(member);
    },
    async createMember(tripId, sessionToken, memberRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.members(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(memberRequest),
      });
      return mapMember(member);
    },
    async patchMember(tripId, memberId, sessionToken, memberRequest) {
      const member = await request<TripMemberResponse>(tripApiRoutes.member(tripId, memberId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(memberRequest),
      });
      return mapMember(member);
    },
    async resetMemberClaim(tripId, memberId, sessionToken) {
      const member = await request<TripMemberResponse>(tripApiRoutes.resetMemberClaim(tripId, memberId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapMember(member);
    },
    getExpenseSummary(tripId, sessionToken) {
      return request<ExpenseSummary>(tripApiRoutes.expensesSummary(tripId), {
        method: "GET",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    recordExpenseReminder(tripId, sessionToken, reminderRequest) {
      return request<ExpenseSummary>(tripApiRoutes.expenseReminders(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(reminderRequest),
      });
    },
    async createExpense(tripId, sessionToken, expenseRequest) {
      const expense = await request<ExpenseResponse>(tripApiRoutes.expenses(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(expenseRequest),
      });
      return mapExpense(expense);
    },
    async patchExpense(tripId, expenseId, sessionToken, expenseRequest) {
      const expense = await request<ExpenseResponse>(tripApiRoutes.expense(tripId, expenseId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(expenseRequest),
      });
      return mapExpense(expense);
    },
    async deleteExpense(tripId, expenseId, sessionToken) {
      const expense = await request<ExpenseResponse>(tripApiRoutes.expense(tripId, expenseId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      return mapExpense(expense);
    },
    createBookingDoc(tripId, sessionToken, bookingRequest) {
      return request<BookingDoc>(tripApiRoutes.bookings(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(bookingRequest),
      });
    },
    patchBookingDoc(tripId, bookingId, sessionToken, bookingRequest) {
      return request<BookingDoc>(tripApiRoutes.booking(tripId, bookingId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(bookingRequest),
      });
    },
    deleteBookingDoc(tripId, bookingId, sessionToken) {
      return request<BookingDoc>(tripApiRoutes.booking(tripId, bookingId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
    createPhotoAlbum(tripId, sessionToken, albumRequest) {
      return request<TripPhotoAlbumLink>(tripApiRoutes.photoAlbums(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(albumRequest),
      });
    },
    patchPhotoAlbum(tripId, albumId, sessionToken, albumRequest) {
      return request<TripPhotoAlbumLink>(tripApiRoutes.photoAlbum(tripId, albumId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(albumRequest),
      });
    },
    deletePhotoAlbum(tripId, albumId, sessionToken) {
      return request<TripPhotoAlbumLink>(tripApiRoutes.photoAlbum(tripId, albumId), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
    },
  };
}

export function mapCockpitResponse(response: TripCockpitResponse): TripCockpit {
  if (!Array.isArray(response.bookingDocs)) {
    throw new TripApiError({
      code: "invalid_response",
      message: "cockpit response is missing bookingDocs",
      status: 0,
    });
  }
  if (!Array.isArray(response.photoAlbumLinks)) {
    throw new TripApiError({
      code: "invalid_response",
      message: "cockpit response is missing photoAlbumLinks",
      status: 0,
    });
  }
  const legacyPlanResponses = response.planVariants ?? [];
  const canonicalPlanResponses = response.tripPlans ?? [];
  const planResponses = canonicalPlanResponses.length ? canonicalPlanResponses : legacyPlanResponses;
  const mainTripPlanId = response.trip.mainTripPlanId ?? response.trip.activePlanVariantId ?? planResponses[0]?.id ?? "";
  const activePlanVariantId = response.trip.activePlanVariantId ?? mainTripPlanId;
  const planVariants = legacyPlanResponses.length ? legacyPlanResponses : planResponses;
  const tripPlans = canonicalPlanResponses.length ? canonicalPlanResponses : legacyPlanResponses;
  const mappedPlanVariants = planVariants.map((plan) =>
    normalizePlanVariantForMainPointer(mapPlanVariant(plan), mainTripPlanId),
  );
  const mappedTripPlans = tripPlans.map((plan) =>
    normalizePlanVariantForMainPointer(mapPlanVariant(plan), mainTripPlanId),
  );
  return {
    trip: {
      ...mapTripSummary(response.trip),
      activePlanVariantId,
      mainTripPlanId,
      planVariants: mappedPlanVariants,
      tripPlans: mappedTripPlans,
      members: response.members.map(mapMember),
      itineraryItems: response.itineraryItems.map(mapItineraryItem),
      expenses: response.expenses.map(mapExpense),
      bookingDocs: response.bookingDocs,
      photoAlbumLinks: response.photoAlbumLinks,
    },
    suggestions: response.suggestions,
    tasks: response.tasks.map(mapTask),
    stopNotes: response.stopNotes,
    expenseSummary: response.expenseSummary,
    latestPlanCheck: response.latestPlanCheck ?? null,
  };
}

function serializeItineraryLocation<T extends { coordinates?: ItineraryCoordinates | null; address?: string | null }>(request: T) {
  const { coordinates, ...rest } = request;
  return {
    ...rest,
    ...(request.address !== undefined ? { address: request.address } : {}),
    ...(coordinates !== undefined
      ? {
          latitude: coordinates?.lat ?? null,
          longitude: coordinates?.lng ?? null,
        }
      : {}),
  };
}

function mapTripSummary(trip: TripSummaryResponse): Trip {
  return {
    id: trip.id,
    joinId: trip.joinId,
    joinPasswordHash: "",
    name: trip.name,
    originLabel: trip.originLabel,
    originCity: trip.originCity,
    originCountry: trip.originCountry,
    originCountryCode: trip.originCountryCode,
    destinationLabel: trip.destinationLabel,
    destinationCities: trip.destinationCities ?? [],
    countries: trip.countries ?? [],
    partySize: trip.partySize ?? 1,
    defaultTimezone: trip.defaultTimezone ?? trip.destinationCities?.[0]?.timezone ?? "Asia/Bangkok",
    startDate: trip.startDate,
    endDate: trip.endDate,
    activePlanVariantId: trip.activePlanVariantId ?? "",
    mainTripPlanId: trip.mainTripPlanId ?? trip.activePlanVariantId ?? "",
    planVariants: [],
    tripPlans: [],
    members: [],
    itineraryItems: [],
    expenses: [],
    version: trip.version,
  };
}

function mapTask(task: TripTaskResponse): TripTask {
  return {
    id: task.id,
    tripPlanId: task.tripPlanId,
    title: task.title,
    status: task.status,
    visibility: task.visibility,
    kind: task.kind,
    createdBy: task.createdBy,
    assigneeId: task.assigneeId,
    relatedItemId: task.relatedItemId,
    version: task.version,
  };
}

function mapMember(member: TripMemberResponse): Member {
  return {
    id: member.id,
    displayName: member.displayName,
    role: member.role,
    presence: member.presence,
    color: member.color,
    userId: member.userId,
    claimedAt: member.claimedAt,
    lastSeenAt: member.lastSeenAt,
    accessStatus: member.accessStatus,
  };
}

function mapPlanVariant(variant: PlanVariantResponse): PlanVariant {
  const status = variant.status ?? statusForLegacyKind(variant.kind);
  return {
    id: variant.id,
    tripId: variant.tripId,
    name: variant.name,
    kind: legacyKindForPlanStatus(status),
    status,
    description: variant.description,
    version: variant.version,
  };
}

function statusForLegacyKind(kind: PlanVariant["kind"]): PlanStatus {
  return kind === "split" ? "proposal" : kind;
}

function legacyKindForPlanStatus(status: PlanStatus): PlanVariant["kind"] {
  return status === "proposal" ? "split" : status;
}

function normalizePlanVariantForMainPointer(
  plan: PlanVariant,
  mainTripPlanId: string,
): PlanVariant {
  const status =
    plan.id === mainTripPlanId
      ? "main"
      : plan.status === "main"
        ? "backup"
        : plan.status ?? statusForLegacyKind(plan.kind);
  return {
    ...plan,
    kind: legacyKindForPlanStatus(status),
    status,
  };
}

function mapItineraryItem(item: ItineraryItemResponse): ItineraryItem {
  return {
    ...item,
    itemKind: item.itemKind ?? "activity",
    timeMode: item.timeMode ?? "scheduled",
    isPlanBlock: item.isPlanBlock ?? false,
    status: item.status ?? "idea",
    priority: item.priority ?? "normal",
    endTime: item.endTime ?? null,
    endOffsetDays: item.endOffsetDays ?? 0,
    coordinates: item.coordinates ?? undefined,
    address: item.address ?? undefined,
    details: item.details ?? {},
  };
}

function mapExpense(expense: ExpenseResponse): Expense {
  return {
    id: expense.id,
    tripId: expense.tripId,
    tripPlanId: expense.tripPlanId,
    title: expense.title,
    amount: expense.amountMinor / 100,
    amountMinor: expense.amountMinor,
    currency: expense.currency,
    exchangeRateToSettlementCurrency: expense.exchangeRateToSettlementCurrency,
    notes: expense.notes ?? "",
    receiptUrl: expense.receiptUrl,
    lineItems: expense.lineItems ?? [],
    comments: expense.comments ?? [],
    paidBy: expense.paidBy,
    splits: normalizeExpenseSplitsFromMinor(expense.splits),
    category: expense.category,
    itineraryItemId: expense.itineraryItemId,
    version: expense.version,
  };
}

async function toTripApiError(response: Response): Promise<TripApiError> {
  const fallback = { code: "request_failed", message: `request failed with ${response.status}` };
  const body = await response.json().catch(() => fallback) as Partial<typeof fallback>;
  return new TripApiError({
    code: body.code ?? fallback.code,
    message: body.message ?? fallback.message,
    status: response.status,
  });
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
