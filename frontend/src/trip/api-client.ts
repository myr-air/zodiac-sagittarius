import type {
  ExpenseSummary,
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  Member,
  PlanVariant,
  StopNote,
  Suggestion,
  Trip,
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

export interface TripCockpitResponse {
  trip: TripSummaryResponse;
  members: TripMemberResponse[];
  planVariants: PlanVariantResponse[];
  itineraryItems: ItineraryItemResponse[];
  suggestions: SuggestionResponse[];
  tasks: TripTaskResponse[];
  expenseSummary: ExpenseSummary | null;
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
  claimMember(tripId: string, memberId: string, participantPassword: string, joinSessionToken: string): Promise<TripParticipantSession>;
  loginMember(tripId: string, memberId: string, participantPassword: string, joinSessionToken: string): Promise<TripParticipantSession>;
  logout(tripId: string, sessionToken: string): Promise<void>;
  loadTrip(tripId: string, sessionToken: string): Promise<TripCockpit>;
  createTask(tripId: string, sessionToken: string, request: CreateTaskApiRequest): Promise<TripTask>;
  patchTask(tripId: string, taskId: string, sessionToken: string, request: PatchTaskApiRequest): Promise<TripTask>;
  patchItineraryItem(tripId: string, itemId: string, sessionToken: string, request: PatchItineraryItemApiRequest): Promise<ItineraryItem>;
  createSuggestion(tripId: string, sessionToken: string, request: CreateSuggestionApiRequest): Promise<Suggestion>;
  approveSuggestion(tripId: string, suggestionId: string, sessionToken: string): Promise<Suggestion>;
  rejectSuggestion(tripId: string, suggestionId: string, sessionToken: string): Promise<Suggestion>;
}

export interface CreateTaskApiRequest {
  clientMutationId: string;
  title: string;
  visibility: TripTask["visibility"];
  kind?: TripTask["kind"];
  assigneeId?: string | null;
  relatedItemId?: string | null;
}

export interface PatchTaskApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<TripTask, "title" | "status" | "assigneeId" | "relatedItemId">>;
}

export interface PatchItineraryItemApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<ItineraryItem, "startTime" | "durationMinutes" | "activity" | "activityType" | "place" | "mapLink" | "transportation" | "note">>;
}

export interface CreateSuggestionApiRequest {
  clientMutationId: string;
  type: SuggestionType;
  targetItemId: string | null;
  planVariantId: string;
  sourceVersion: number | null;
  proposedPatch: EditableSuggestionPatch;
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
  };
}

export function mapCockpitResponse(response: TripCockpitResponse): TripCockpit {
  const activePlanVariantId = response.trip.activePlanVariantId ?? response.planVariants[0]?.id ?? "";
  return {
    trip: {
      id: response.trip.id,
      joinId: response.trip.joinId,
      joinPasswordHash: "",
      name: response.trip.name,
      destinationLabel: response.trip.destinationLabel,
      countries: response.trip.countries ?? [],
      startDate: response.trip.startDate,
      endDate: response.trip.endDate,
      activePlanVariantId,
      planVariants: response.planVariants.map(mapPlanVariant),
      members: response.members.map(mapMember),
      itineraryItems: response.itineraryItems.map(mapItineraryItem),
      expenses: [],
    },
    suggestions: response.suggestions,
    tasks: response.tasks.map(mapTask),
    stopNotes: [],
    expenseSummary: response.expenseSummary,
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
  };
}

function mapItineraryItem(item: ItineraryItemResponse): ItineraryItem {
  return {
    ...item,
    coordinates: item.coordinates ?? undefined,
    address: item.address ?? undefined,
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
