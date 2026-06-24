import type {
  BookingDoc,
  Expense,
  ExpenseSummary,
  ItineraryItem,
  Member,
  PlaceResolutionRequest,
  PlaceResolutionResponse,
  PlanCheck,
  PlanSuggestion,
  PlanVariant,
  StopNote,
  Suggestion,
  Trip,
  TripDailyBriefing,
  TripJoinCredential,
  TripParticipantSession,
  TripPhotoAlbumLink,
  TripTask,
} from "../types";
import type {
  JoinTripResponse,
  TripCockpit,
} from "./api-response-types";
import type { ItineraryExportDocument } from "../itinerary-import-export";
import type {
  CreateBookingDocApiRequest,
  CreateExpenseApiRequest,
  CreatePhotoAlbumApiRequest,
  PatchBookingDocApiRequest,
  PatchExpenseApiRequest,
  PatchPhotoAlbumApiRequest,
  RecordExpenseReminderApiRequest,
} from "./api-client-record-types";
import type {
  CreateMemberApiRequest,
  JoinInviteTokenResponse,
  PatchMemberApiRequest,
  UpdatePresenceApiRequest,
} from "./api-client-member-types";
import type {
  CreateItineraryItemApiRequest,
  CreateStopNoteApiRequest,
  CreateSuggestionApiRequest,
  ImportItineraryApiRequest,
  PatchItineraryItemApiRequest,
  PatchStopNoteApiRequest,
  ReorderItineraryItemsApiRequest,
} from "./api-client-itinerary-types";
import type {
  CreatePlanVariantApiRequest,
  CreateTaskApiRequest,
  PatchPlanSuggestionApiRequest,
  PatchPlanVariantApiRequest,
  PatchTaskApiRequest,
  PublishPlanVariantApiRequest,
} from "./api-client-planning-types";
import type {
  PatchDailyBriefingApiRequest,
  PatchTripApiRequest,
} from "./api-client-trip-types";
export type {
  BookingDocExternalLinkApiRequest,
  CreateBookingDocApiRequest,
  CreateExpenseApiRequest,
  CreatePhotoAlbumApiRequest,
  PatchBookingDocApiRequest,
  PatchExpenseApiRequest,
  PatchPhotoAlbumApiRequest,
  RecordExpenseReminderApiRequest,
} from "./api-client-record-types";
export type {
  CreateMemberApiRequest,
  JoinInviteTokenResponse,
  PatchMemberApiRequest,
  UpdatePresenceApiRequest,
} from "./api-client-member-types";
export type {
  CreateItineraryItemApiRequest,
  CreateStopNoteApiRequest,
  CreateSuggestionApiRequest,
  ImportItineraryApiRequest,
  PatchItineraryItemApiRequest,
  PatchStopNoteApiRequest,
  ReorderItineraryItemsApiRequest,
} from "./api-client-itinerary-types";
export type {
  CreatePlanVariantApiRequest,
  CreateTaskApiRequest,
  PatchPlanSuggestionApiRequest,
  PatchPlanVariantApiRequest,
  PatchTaskApiRequest,
  PublishPlanVariantApiRequest,
} from "./api-client-planning-types";
export type {
  PatchDailyBriefingApiRequest,
  PatchTripApiRequest,
} from "./api-client-trip-types";

export interface TripApiClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
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
