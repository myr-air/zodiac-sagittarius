import { TripApiError } from "./api-error";
import { normalizeExpenseSplitsFromMinor } from "./expenses";
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
  const canonicalPlanResponses = (response.tripPlans ?? []).map(assertTripPlanResponse);
  assertMainPlanPointerAliasesMatch(response.trip);
  const mainTripPlanIdForAliasCheck =
    response.trip.mainTripPlanId ??
    response.trip.activePlanVariantId ??
    canonicalPlanResponses[0]?.id ??
    legacyPlanResponses[0]?.id ??
    "";
  assertTripPlanResponseAliasesMatch(
    canonicalPlanResponses,
    legacyPlanResponses,
    mainTripPlanIdForAliasCheck,
  );
  const planResponses = canonicalPlanResponses.length ? canonicalPlanResponses : legacyPlanResponses;
  const mainTripPlanId = response.trip.mainTripPlanId ?? response.trip.activePlanVariantId ?? planResponses[0]?.id ?? "";
  const activePlanVariantId = response.trip.activePlanVariantId ?? mainTripPlanId;
  const mappedPlanVariants = planResponses.map((plan) =>
    normalizePlanVariantForMainPointer(mapPlanVariant(plan), mainTripPlanId),
  );
  const mappedTripPlans = planResponses.map((plan) =>
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

export function mapTripSummary(trip: TripSummaryResponse): Trip {
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

export function mapJoinTripResponse(response: JoinTripResponse): JoinTripResponse {
  assertMainPlanPointerAliasesMatch(response.trip);
  return response;
}

export function mapTask(task: TripTaskResponse): TripTask {
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

export function mapMember(member: TripMemberResponse): Member {
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

export function mapTripPlanResponse(variant: TripPlanResponse): PlanVariant {
  return mapPlanVariant(assertTripPlanResponse(variant));
}

function assertTripPlanResponse(variant: PlanVariantResponse): TripPlanResponse {
  if (!variant.status) {
    throw new TripApiError({
      code: "invalid_response",
      message: "canonical trip plan response is missing status",
      status: 0,
    });
  }
  return variant as TripPlanResponse;
}

function assertTripPlanResponseAliasesMatch(
  canonicalPlans: TripPlanResponse[],
  legacyPlans: PlanVariantResponse[],
  mainTripPlanId: string,
): void {
  if (canonicalPlans.length === 0 || legacyPlans.length === 0) return;
  if (canonicalPlans.length !== legacyPlans.length) {
    throwInvalidTripPlanAliasDrift();
  }
  for (const [index, canonicalPlan] of canonicalPlans.entries()) {
    const legacyPlan = legacyPlans[index];
    const mappedCanonicalPlan = normalizePlanVariantForMainPointer(mapPlanVariant(canonicalPlan), mainTripPlanId);
    const mappedLegacyPlan = normalizePlanVariantForMainPointer(mapPlanVariant(legacyPlan), mainTripPlanId);
    if (
      !legacyPlan ||
      canonicalPlan.id !== legacyPlan.id ||
      canonicalPlan.name !== legacyPlan.name ||
      canonicalPlan.version !== legacyPlan.version ||
      mappedCanonicalPlan.kind !== mappedLegacyPlan.kind ||
      mappedCanonicalPlan.status !== mappedLegacyPlan.status
    ) {
      throwInvalidTripPlanAliasDrift();
    }
  }
}

export function assertMainPlanPointerAliasesMatch(trip: TripSummaryResponse): void {
  if (
    trip.activePlanVariantId &&
    trip.mainTripPlanId &&
    trip.activePlanVariantId !== trip.mainTripPlanId
  ) {
    throwInvalidTripPlanAliasDrift();
  }
}

function throwInvalidTripPlanAliasDrift(): never {
  throw new TripApiError({
    code: "invalid_response",
    message: "Trip Plan compatibility aliases do not match",
    status: 0,
  });
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

export function mapItineraryItem(item: ItineraryItemResponse): ItineraryItem {
  return {
    ...item,
    itemKind: item.itemKind ?? "activity",
    timeMode: item.timeMode ?? "scheduled",
    isPlanBlock: item.isPlanBlock ?? false,
    status: item.status ?? "idea",
    priority: item.priority ?? "normal",
    endTime: item.endTime ?? null,
    endOffsetDays: item.endOffsetDays ?? 0,
    activitySubtype: item.activitySubtype ?? null,
    coordinates: item.coordinates ?? undefined,
    address: item.address ?? undefined,
    details: item.details ?? {},
  };
}

export function mapExpense(expense: ExpenseResponse): Expense {
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
