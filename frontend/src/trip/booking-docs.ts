import type {
  BookingDoc,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
  Expense,
  ItineraryItem,
  Member,
  StopNote,
  Trip,
  TripTask,
} from "./types";
import { itineraryDateTime, shiftIsoDate } from "./itinerary-time";

export {
  buildCreateBookingDocRequest,
  buildPatchBookingDocRequest,
  serializeBookingDocInputForApi,
} from "./booking-doc-api";

export type ItineraryBookingTemplate =
  | "recommended"
  | "flight"
  | "train"
  | "hotel"
  | "activity_ticket";

export interface BookingDocInputLike {
  tripPlanId?: string | null;
  type: BookingDocType;
  title: string;
  status: BookingDocStatus;
  visibility: BookingDocVisibility;
  ownerMemberId?: string | null;
  providerName?: string | null;
  confirmationCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  travelerIds: string[];
  externalLinks: BookingDoc["externalLinks"];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  relatedExpenseIds: string[];
  noteIds: string[];
  notes?: string | null;
}

export interface ItineraryBookingTicketInputLike {
  bookingDocId?: string | null;
  itemId: string;
  template: ItineraryBookingTemplate;
  type: BookingDocType;
  title: string;
  status: BookingDoc["status"];
  visibility: BookingDoc["visibility"];
  providerName?: string | null;
  confirmationCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  travelerIds: string[];
  relatedItineraryItemIds: string[];
  notes?: string | null;
}

export type ItineraryBookingTicketInput = ItineraryBookingTicketInputLike;

export interface BookingDocsSummary {
  totalCostByCurrency: Record<string, number>;
  needsActionCount: number;
  sensitiveDocsTotal: number;
  sensitiveDocsReady: number;
  upcoming: BookingDoc | null;
}

export interface BookingDocFilters {
  query?: string;
  type?: BookingDocType | "all";
  status?: BookingDocStatus | "all";
  travelerId?: string | "all";
  day?: string | "all";
}

export interface BookingDocRelations {
  itineraryItems: ItineraryItem[];
  tasks: TripTask[];
  expenses: Expense[];
  notes: StopNote[];
  travelers: Member[];
}

export interface LocalBookingDocOptions {
  title: string;
  tripPlanId: BookingDoc["tripPlanId"];
  createdBy: string;
  updatedAt: string;
  nextBookingDocId: (bookingDocs: BookingDoc[]) => string;
}

export interface LocalBookingDocUpdateOptions {
  title: string;
  updatedAt: string;
}

export interface BuildCreateBookingDocRequestOptions {
  clientMutationId: string;
}

export interface BuildPatchBookingDocRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}

export interface ExpenseEstimateBookingContext {
  currentMemberId: string;
  defaultTimezone?: string | null;
  members: Pick<Member, "id">[];
  itineraryItems: Pick<ItineraryItem, "id">[];
  selectedTripPlanId?: string | null;
  mainTripPlanId?: string | null;
  activePlanVariantId?: string | null;
}

const readySensitiveStatuses = new Set<BookingDocStatus>(["booked", "confirmed", "paid"]);

export function buildBookingDocsSummary(docs: BookingDoc[], _members: Member[], nowIso: string): BookingDocsSummary {
  const totalCostByCurrency: Record<string, number> = {};
  let needsActionCount = 0;
  let sensitiveDocsTotal = 0;
  let sensitiveDocsReady = 0;
  const now = Date.parse(nowIso);
  let upcoming: BookingDoc | null = null;
  let upcomingTime = Number.POSITIVE_INFINITY;

  for (const doc of docs) {
    if (typeof doc.priceAmount === "number" && doc.currency) {
      totalCostByCurrency[doc.currency] = roundMoney((totalCostByCurrency[doc.currency] ?? 0) + doc.priceAmount);
    }

    if (doc.status === "needs_action") needsActionCount += 1;

    if (doc.visibility === "sensitive") {
      sensitiveDocsTotal += 1;
      if (readySensitiveStatuses.has(doc.status)) sensitiveDocsReady += 1;
    }

    const startsAt = doc.startsAt ? Date.parse(doc.startsAt) : Number.NaN;
    if (Number.isFinite(startsAt) && startsAt >= now && startsAt < upcomingTime && doc.status !== "cancelled") {
      upcoming = doc;
      upcomingTime = startsAt;
    }
  }

  return {
    totalCostByCurrency,
    needsActionCount,
    sensitiveDocsTotal,
    sensitiveDocsReady,
    upcoming,
  };
}

export function canViewBookingDoc(doc: BookingDoc, member: Member): boolean {
  if (doc.visibility === "shared") return true;
  if (member.role === "owner") return true;

  if (doc.visibility === "private") {
    return doc.ownerMemberId === member.id || doc.createdBy === member.id;
  }

  if (doc.visibility === "sensitive") {
    if (member.role === "organizer") return true;
    return doc.ownerMemberId === member.id || doc.travelerIds.includes(member.id);
  }

  return false;
}

export function filterBookingDocs(docs: BookingDoc[], filters: BookingDocFilters, trip: Trip, member: Member): BookingDoc[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  const type = filters.type ?? "all";
  const status = filters.status ?? "all";
  const travelerId = filters.travelerId ?? "all";
  const day = filters.day ?? "all";
  const itemDayById = new Map(trip.itineraryItems.map((item) => [item.id, item.day]));

  return docs.filter((doc) => {
    if (!canViewBookingDoc(doc, member)) return false;
    if (type !== "all" && doc.type !== type) return false;
    if (status !== "all" && doc.status !== status) return false;
    if (travelerId !== "all" && !doc.travelerIds.includes(travelerId)) return false;

    if (day !== "all") {
      const docDay = doc.startsAt?.slice(0, 10);
      const linkedDay = doc.relatedItineraryItemIds.some((itemId) => itemDayById.get(itemId) === day);
      if (docDay !== day && !linkedDay) return false;
    }

    if (!query) return true;
    return searchableBookingDocText(doc, trip).includes(query);
  });
}

export function findBookingDocRelations(doc: BookingDoc, trip: Trip, tasks: TripTask[]): BookingDocRelations {
  const itineraryItemIds = new Set(doc.relatedItineraryItemIds);
  const taskIds = new Set(doc.relatedTaskIds);
  const expenseIds = new Set(doc.relatedExpenseIds);
  const noteIds = new Set(doc.noteIds);
  const travelerIds = new Set(doc.travelerIds);

  return {
    itineraryItems: trip.itineraryItems.filter((item) => itineraryItemIds.has(item.id)),
    tasks: tasks.filter((task) => taskIds.has(task.id)),
    expenses: trip.expenses.filter((expense) => expenseIds.has(expense.id)),
    notes: (trip.stopNotes ?? []).filter((note) => noteIds.has(note.id) || itineraryItemIds.has(note.itemId)),
    travelers: trip.members.filter((member) => travelerIds.has(member.id)),
  };
}

export function createLocalBookingDoc(
  trip: Pick<Trip, "id" | "bookingDocs">,
  input: BookingDocInputLike,
  options: LocalBookingDocOptions,
): BookingDoc {
  const bookingDocs = trip.bookingDocs ?? [];

  return {
    ...input,
    id: options.nextBookingDocId(bookingDocs),
    tripId: trip.id,
    tripPlanId: options.tripPlanId,
    title: options.title,
    externalLinks: input.externalLinks.map((link, index) => ({
      ...link,
      id: link.id || `link-local-${index + 1}`,
    })),
    createdBy: options.createdBy,
    updatedAt: options.updatedAt,
    version: 1,
  };
}

export function replaceBookingDocInTrip<T extends Pick<Trip, "bookingDocs">>(
  trip: T,
  bookingDoc: BookingDoc,
): T {
  return {
    ...trip,
    bookingDocs: (trip.bookingDocs ?? []).map((candidate) =>
      candidate.id === bookingDoc.id ? bookingDoc : candidate,
    ),
  };
}

export function updateLocalBookingDocInTrip<T extends Pick<Trip, "bookingDocs">>(
  trip: T,
  bookingDocId: string,
  input: BookingDocInputLike,
  options: LocalBookingDocUpdateOptions,
): T {
  return {
    ...trip,
    bookingDocs: (trip.bookingDocs ?? []).map((bookingDoc) =>
      bookingDoc.id === bookingDocId
        ? {
            ...bookingDoc,
            ...input,
            title: options.title,
            externalLinks: input.externalLinks.map((link, index) => ({
              ...link,
              id:
                link.id ||
                bookingDoc.externalLinks[index]?.id ||
                `link-local-${index + 1}`,
            })),
            updatedAt: options.updatedAt,
            version: bookingDoc.version + 1,
          }
        : bookingDoc,
    ),
  };
}

export function bookingDocInputFromRecord(
  bookingDoc: BookingDoc,
  overrides: Partial<BookingDocInputLike> = {},
): BookingDocInputLike {
  return {
    type: overrides.type ?? bookingDoc.type,
    title: overrides.title ?? bookingDoc.title,
    status: overrides.status ?? bookingDoc.status,
    visibility: overrides.visibility ?? bookingDoc.visibility,
    ownerMemberId: overrides.ownerMemberId !== undefined ? overrides.ownerMemberId : bookingDoc.ownerMemberId,
    providerName: overrides.providerName !== undefined ? overrides.providerName : bookingDoc.providerName,
    confirmationCode: overrides.confirmationCode !== undefined ? overrides.confirmationCode : bookingDoc.confirmationCode,
    startsAt: overrides.startsAt !== undefined ? overrides.startsAt : bookingDoc.startsAt,
    endsAt: overrides.endsAt !== undefined ? overrides.endsAt : bookingDoc.endsAt,
    timezone: overrides.timezone !== undefined ? overrides.timezone : bookingDoc.timezone,
    priceAmount: overrides.priceAmount !== undefined ? overrides.priceAmount : bookingDoc.priceAmount,
    currency: overrides.currency !== undefined ? overrides.currency : bookingDoc.currency,
    travelerIds: overrides.travelerIds ?? bookingDoc.travelerIds,
    externalLinks: overrides.externalLinks ?? bookingDoc.externalLinks,
    relatedItineraryItemIds: overrides.relatedItineraryItemIds ?? bookingDoc.relatedItineraryItemIds,
    relatedTaskIds: overrides.relatedTaskIds ?? bookingDoc.relatedTaskIds,
    relatedExpenseIds: overrides.relatedExpenseIds ?? bookingDoc.relatedExpenseIds,
    noteIds: overrides.noteIds ?? bookingDoc.noteIds,
    notes: overrides.notes !== undefined ? overrides.notes : bookingDoc.notes,
    tripPlanId: overrides.tripPlanId !== undefined ? overrides.tripPlanId : bookingDoc.tripPlanId,
  };
}

export function removeBookingDocFromTrip<T extends Pick<Trip, "bookingDocs">>(
  trip: T,
  bookingDocId: string,
): T {
  return {
    ...trip,
    bookingDocs: (trip.bookingDocs ?? []).filter(
      (bookingDoc) => bookingDoc.id !== bookingDocId,
    ),
  };
}

export function bookingTypeForItineraryItem(item: ItineraryItem): BookingDocType {
  const mode = typeof item.details?.mode === "string" ? item.details.mode.toLowerCase() : "";
  const transportation = item.transportation.toLowerCase();
  const activity = item.activity.toLowerCase();
  const haystack = `${mode} ${transportation} ${activity}`;
  if (/\bflight\b|\bplane\b|\bairline\b|เครื่องบิน|สายการบิน|(^|\s)บิน/.test(haystack))
    return "flight";
  if (/\btrain\b|\brail\b|\bmtr\b|รถไฟ|ราง|สถานีรถไฟ/.test(haystack)) return "train";
  if (/\bbus\b|\bferry\b|\bshuttle\b|\btram\b|\btaxi\b|รถบัส|บัส|เรือ|เฟอร์รี่|รถรับส่ง|แท็กซี่|รถราง/.test(haystack))
    return "public_transport";
  if (
    item.activityType === "stay" ||
    item.itemKind === "lodging" ||
    /โรงแรม|ที่พัก|พักค้างคืน|เช็คอิน|check[-\s]?in/.test(haystack)
  )
    return "hotel";
  if (item.activityType === "attraction" || item.itemKind === "activity") return "activity_ticket";
  return "other";
}

export function syncItineraryDetailsWithBookingTicket(
  item: ItineraryItem,
  input: ItineraryBookingTicketInputLike,
): ItineraryItem["details"] {
  const nextDetails = { ...(item.details ?? {}) };
  const mode = itineraryTravelModeForTicket(item, input);
  if (mode) nextDetails.mode = mode;

  if (input.providerName?.trim()) nextDetails.provider = input.providerName.trim();
  else delete nextDetails.provider;

  if (input.confirmationCode?.trim()) {
    nextDetails.bookingRef = input.confirmationCode.trim();
    nextDetails.ticketRef = input.confirmationCode.trim();
  } else {
    delete nextDetails.bookingRef;
    delete nextDetails.ticketRef;
  }

  if (input.startsAt) nextDetails.ticketStartsAt = input.startsAt;
  else delete nextDetails.ticketStartsAt;
  if (input.endsAt) nextDetails.ticketEndsAt = input.endsAt;
  else delete nextDetails.ticketEndsAt;

  return nextDetails;
}

export function clearItineraryBookingTicketDetails(
  item: ItineraryItem,
): ItineraryItem["details"] {
  const nextDetails = { ...(item.details ?? {}) };
  delete nextDetails.provider;
  delete nextDetails.bookingRef;
  delete nextDetails.ticketRef;
  delete nextDetails.ticketStartsAt;
  delete nextDetails.ticketEndsAt;
  return nextDetails;
}

export function uniqueStringIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

export function findDuplicateBookingDoc(
  bookingDocs: BookingDoc[],
  input: BookingDocInputLike,
): BookingDoc | null {
  const title = normalizeBookingMatchValue(input.title);
  const startsAt = normalizeBookingDateTimeMatchValue(input.startsAt);
  const endsAt = normalizeBookingDateTimeMatchValue(input.endsAt);
  const relatedItemIds = new Set(input.relatedItineraryItemIds);
  return (
    bookingDocs.find((bookingDoc) => {
      if (bookingDoc.type !== input.type) return false;
      if (normalizeBookingMatchValue(bookingDoc.title) !== title) return false;
      if (normalizeBookingDateTimeMatchValue(bookingDoc.startsAt) !== startsAt) return false;
      if (normalizeBookingDateTimeMatchValue(bookingDoc.endsAt) !== endsAt) return false;
      return bookingDoc.relatedItineraryItemIds.some((itemId) =>
        relatedItemIds.has(itemId),
      );
    }) ?? null
  );
}

export function bookingTypeForBookingTemplate(
  template: Exclude<ItineraryBookingTemplate, "recommended">,
): BookingDocType {
  if (template === "activity_ticket") return "activity_ticket";
  return template;
}

export function bookingDraftTitleForItineraryItem(
  item: ItineraryItem,
  bookingType: BookingDocType,
): string {
  const suffixByType: Partial<Record<BookingDocType, string>> = {
    activity_ticket: "ticket draft",
    flight: "flight ticket draft",
    hotel: "hotel booking draft",
    public_transport: "transport booking draft",
    train: "train ticket draft",
  };
  return `${item.activity} ${suffixByType[bookingType] ?? "booking draft"}`;
}

export function bookingTypeForExpenseEstimate(expense: Expense): BookingDocType {
  if (expense.category === "stay") return "hotel";
  if (expense.category === "tickets") return "activity_ticket";
  if (expense.category === "transport") return "public_transport";
  return "other";
}

export function bookingDocInputForExpenseEstimate(
  expense: Expense,
  context: ExpenseEstimateBookingContext,
): BookingDocInputLike {
  const sourceTripPlanId =
    expense.tripPlanId ||
    context.selectedTripPlanId ||
    context.mainTripPlanId ||
    context.activePlanVariantId;
  const linkedItem = expense.itineraryItemId
    ? context.itineraryItems.find((item) => item.id === expense.itineraryItemId)
    : null;

  return {
    tripPlanId: sourceTripPlanId,
    type: bookingTypeForExpenseEstimate(expense),
    title: `Estimate: ${expense.title}`,
    status: "draft",
    visibility: "shared",
    ownerMemberId: context.currentMemberId,
    providerName: null,
    confirmationCode: null,
    startsAt: null,
    endsAt: null,
    timezone: context.defaultTimezone ?? null,
    priceAmount: expense.amount,
    currency: expense.currency ?? "HKD",
    travelerIds: context.members.map((member) => member.id),
    externalLinks: [],
    relatedItineraryItemIds: linkedItem ? [linkedItem.id] : [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: [
      "Plan estimate copied from an Actual Expense. This does not create or move real money.",
      `Source actual expense: ${expense.title}`,
    ].join("\n"),
  };
}

export function bookingDraftDetailsForItineraryItem(item: ItineraryItem): {
  confirmationCode: string | null;
  notes: string;
  providerName: string | null;
} {
  const providerName =
    readItineraryDetailString(item.details, "provider") ||
    readItineraryDetailString(item.details, "mode") ||
    null;
  const confirmationCode =
    readItineraryDetailString(item.details, "bookingRef") ||
    readItineraryDetailString(item.details, "ticketRef") ||
    null;
  const notes = [
    item.place ? `Draft from itinerary: ${item.place}` : "Draft from itinerary",
    readItineraryDetailString(item.details, "entryWindow"),
    readItineraryDetailString(item.details, "costNote"),
    readItineraryDetailString(item.details, "detail"),
  ].filter((value): value is string => Boolean(value));

  return {
    confirmationCode,
    notes: notes.join("\n"),
    providerName,
  };
}

export function bookingDraftTimeWindowForItineraryItem(item: ItineraryItem): {
  endsAt: string | null;
  startsAt: string | null;
} {
  const startTime = item.startTime?.trim();
  const endTime = item.endTime?.trim();
  return {
    startsAt: startTime ? itineraryDateTime(item.day, startTime) : null,
    endsAt: endTime
      ? itineraryDateTime(
          shiftIsoDate(item.day, item.endOffsetDays ?? 0),
          endTime,
        )
      : null,
  };
}

function searchableBookingDocText(doc: BookingDoc, trip: Trip): string {
  const linkedItems = new Set(doc.relatedItineraryItemIds);
  const linkedActivities = trip.itineraryItems
    .filter((item) => linkedItems.has(item.id))
    .map((item) => `${item.activity} ${item.place}`)
    .join(" ");
  const travelerNames = trip.members
    .filter((member) => doc.travelerIds.includes(member.id))
    .map((member) => member.displayName)
    .join(" ");

  return [
    doc.title,
    doc.providerName,
    doc.confirmationCode,
    doc.notes,
    linkedActivities,
    travelerNames,
    ...doc.externalLinks.flatMap((link) => [link.label, link.provider, link.accessNote]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function itineraryTravelModeForTicket(
  item: ItineraryItem,
  input: ItineraryBookingTicketInputLike,
): string | null {
  if (item.activityType !== "travel") return null;
  const existingMode = readItineraryDetailString(item.details, "mode");
  if (input.itemId !== item.id && existingMode) return existingMode;
  if (input.template === "flight" || input.type === "flight") return "flight";
  if (input.template === "train" || input.type === "train") return "train";
  if (existingMode) return existingMode;
  if (input.type === "public_transport") return "transport";
  return null;
}

function normalizeBookingMatchValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeBookingDateTimeMatchValue(
  value: string | null | undefined,
): string {
  return normalizeBookingMatchValue(value).replace(
    /(\d{2}:\d{2}):00(?=(?:[+-]\d\d:?\d\d|z)?$)/,
    "$1",
  );
}

function readItineraryDetailString(
  details: ItineraryItem["details"] | null | undefined,
  key: string,
): string {
  const value = details?.[key];
  return typeof value === "string" ? value.trim() : "";
}
