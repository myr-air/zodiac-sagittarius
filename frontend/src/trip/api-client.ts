import type {
  ExpenseSummary,
  Expense,
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  Member,
  PlanVariant,
  StopNote,
  Suggestion,
  Trip,
  TripDailyBriefing,
  TripJoinCredential,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripRole,
  TripTask,
  EditableSuggestionPatch,
  SuggestionType,
} from "./types";
import { tripApiRoutes } from "./api-routes";

export interface TripApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface TripSummaryResponse {
  id: string;
  name: string;
  destinationLabel: string;
  countries?: string[];
  startDate: string;
  endDate: string;
  joinId: string;
  activePlanVariantId: string | null;
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
  description: string;
  version: number;
}

export interface ItineraryItemResponse {
  id: string;
  tripId: string;
  planVariantId: string;
  day: string;
  sortOrder: number;
  startTime: string;
  activity: string;
  activityType: ItineraryItem["activityType"];
  place: string;
  linkLabel: string;
  mapLink: string;
  coordinates: ItineraryCoordinates | null;
  address: string | null;
  durationMinutes: number | null;
  transportation: string;
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
  title: string;
  amountMinor: number;
  currency: string;
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId: string | null;
  version: number;
}

export interface TripCockpitResponse {
  trip: TripSummaryResponse;
  members: TripMemberResponse[];
  planVariants: PlanVariantResponse[];
  itineraryItems: ItineraryItemResponse[];
  suggestions: SuggestionResponse[];
  tasks: TripTaskResponse[];
  stopNotes: StopNote[];
  expenses: ExpenseResponse[];
  expenseSummary: ExpenseSummary | null;
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
  createExpense(tripId: string, sessionToken: string, request: CreateExpenseApiRequest): Promise<Expense>;
  patchExpense(tripId: string, expenseId: string, sessionToken: string, request: PatchExpenseApiRequest): Promise<Expense>;
  deleteExpense(tripId: string, expenseId: string, sessionToken: string): Promise<Expense>;
}

export interface CreateTaskApiRequest {
  clientMutationId: string;
  title: string;
  visibility: TripTask["visibility"];
  kind?: TripTask["kind"];
  assigneeId?: string | null;
  relatedItemId?: string | null;
}

export interface PatchTripApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  name?: string;
  destinationLabel?: string;
  countries?: string[];
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
  kind: PlanVariant["kind"];
  description?: string;
}

export interface PatchPlanVariantApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<PlanVariant, "name" | "kind" | "description">>;
}

export interface PublishPlanVariantApiRequest {
  clientMutationId: string;
}

export interface PatchTaskApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<TripTask, "title" | "status" | "assigneeId" | "relatedItemId">>;
}

export interface PatchItineraryItemApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<ItineraryItem, "day" | "startTime" | "durationMinutes" | "activity" | "activityType" | "place" | "mapLink" | "transportation" | "note">>;
}

export interface CreateItineraryItemApiRequest {
  clientMutationId: string;
  planVariantId: string;
  day: string;
  startTime?: string | null;
  activity: string;
  activityType: ItineraryItem["activityType"];
  place: string;
  mapLink?: string | null;
  durationMinutes?: number | null;
  transportation?: string | null;
  note?: string | null;
}

export interface ReorderItineraryItemsApiRequest {
  clientMutationId: string;
  planVariantId: string;
  day: string;
  itemIds: string[];
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
  title: string;
  amountMinor: number;
  currency?: string;
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
  itineraryItemId?: string | null;
}

export interface PatchExpenseApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  title?: string;
  amountMinor?: number;
  currency?: string;
  paidBy?: string;
  category?: Expense["category"];
  splits?: Record<string, number>;
  itineraryItemId?: string | null;
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
      const variant = await request<PlanVariantResponse>(tripApiRoutes.planVariants(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(planRequest),
      });
      return mapPlanVariant(variant);
    },
    async patchPlanVariant(tripId, planVariantId, sessionToken, planRequest) {
      const variant = await request<PlanVariantResponse>(tripApiRoutes.planVariant(tripId, planVariantId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(planRequest),
      });
      return mapPlanVariant(variant);
    },
    async publishPlanVariant(tripId, planVariantId, sessionToken, publishRequest) {
      const trip = await request<TripSummaryResponse>(tripApiRoutes.planVariantPublications(tripId, planVariantId), {
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
        body: JSON.stringify(itemRequest),
      });
      return mapItineraryItem(item);
    },
    async createItineraryItem(tripId, sessionToken, itemRequest) {
      const item = await request<ItineraryItemResponse>(tripApiRoutes.itineraryItems(tripId), {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(itemRequest),
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
    async reorderItineraryItems(tripId, sessionToken, reorderRequest) {
      const items = await request<ItineraryItemResponse[]>(tripApiRoutes.reorderItineraryItems(tripId), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(reorderRequest),
      });
      return items.map(mapItineraryItem);
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
  };
}

export function mapCockpitResponse(response: TripCockpitResponse): TripCockpit {
  const activePlanVariantId = response.trip.activePlanVariantId ?? response.planVariants[0]?.id ?? "";
  return {
    trip: {
      ...mapTripSummary(response.trip),
      activePlanVariantId,
      planVariants: response.planVariants.map(mapPlanVariant),
      members: response.members.map(mapMember),
      itineraryItems: response.itineraryItems.map(mapItineraryItem),
      expenses: response.expenses.map(mapExpense),
    },
    suggestions: response.suggestions,
    tasks: response.tasks.map(mapTask),
    stopNotes: response.stopNotes,
    expenseSummary: response.expenseSummary,
  };
}

function mapTripSummary(trip: TripSummaryResponse): Trip {
  return {
    id: trip.id,
    joinId: trip.joinId,
    joinPasswordHash: "",
    name: trip.name,
    destinationLabel: trip.destinationLabel,
    countries: trip.countries ?? [],
    startDate: trip.startDate,
    endDate: trip.endDate,
    activePlanVariantId: trip.activePlanVariantId ?? "",
    planVariants: [],
    members: [],
    itineraryItems: [],
    expenses: [],
    version: trip.version,
  };
}

function mapTask(task: TripTaskResponse): TripTask {
  return {
    id: task.id,
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
  return {
    id: variant.id,
    tripId: variant.tripId,
    name: variant.name,
    kind: variant.kind,
    description: variant.description,
    version: variant.version,
  };
}

function mapItineraryItem(item: ItineraryItemResponse): ItineraryItem {
  return {
    ...item,
    coordinates: item.coordinates ?? undefined,
    address: item.address ?? undefined,
  };
}

function mapExpense(expense: ExpenseResponse): Expense {
  return {
    id: expense.id,
    tripId: expense.tripId,
    title: expense.title,
    amount: expense.amountMinor / 100,
    amountMinor: expense.amountMinor,
    currency: expense.currency,
    paidBy: expense.paidBy,
    splits: expense.splits,
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
