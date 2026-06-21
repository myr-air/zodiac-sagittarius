import {
  type BookingDocInputLike,
  type ItineraryBookingTemplate,
  type ItineraryBookingTicketInputLike,
  bookingDraftDetailsForItineraryItem,
  bookingDraftTimeWindowForItineraryItem,
  bookingDraftTitleForItineraryItem,
  bookingTypeForBookingTemplate,
  bookingTypeForItineraryItem,
  findDuplicateBookingDoc,
  normalizeBookingDocTitle,
  resolveBookingDocCreateTripPlanId,
  uniqueStringIds,
} from "@/src/trip/booking-docs";
import type { BookingDoc, ItineraryItem, Member, Trip } from "@/src/trip/types";
import { tripPlanIdForBookingRecord } from "@/src/trip/workspace/trip-plan-records";

interface BookingDraftInputContext {
  currentMemberId: string;
  defaultTimezone?: string | null;
  item: ItineraryItem;
  members: Pick<Member, "id">[];
  template: ItineraryBookingTemplate;
}

interface BookingTicketInputContext {
  currentMemberId: string;
  defaultTimezone?: string | null;
  existingBookingDoc?: BookingDoc | null;
  members: Pick<Member, "id">[];
}

interface ResolveItineraryBookingTicketCommandInputContext
  extends Omit<BookingTicketInputContext, "existingBookingDoc"> {
  bookingDocs: BookingDoc[];
}

interface ItineraryBookingTicketCommandInput {
  bookingDocInput: BookingDocInputLike;
  existingBookingDoc: BookingDoc | null;
}

interface WorkspaceBookingDocCreateInputContext {
  selectedTripPlanId: string;
  trip: Trip;
}

interface WorkspaceBookingDocCreateInput {
  title: string;
  tripPlanId: string | null;
}

export function buildWorkspaceBookingDocCreateInput(
  input: BookingDocInputLike,
  { selectedTripPlanId, trip }: WorkspaceBookingDocCreateInputContext,
): WorkspaceBookingDocCreateInput | null {
  const title = normalizeBookingDocTitle(input);
  if (!title) return null;

  return {
    title,
    tripPlanId: resolveBookingDocCreateTripPlanId(trip, input, {
      resolveTripPlanId: tripPlanIdForBookingRecord,
      selectedTripPlanId,
    }) ?? null,
  };
}

export function buildItineraryBookingDraftInput({
  currentMemberId,
  defaultTimezone,
  item,
  members,
  template,
}: BookingDraftInputContext): BookingDocInputLike {
  const draftDetails = bookingDraftDetailsForItineraryItem(item);
  const timeWindow = bookingDraftTimeWindowForItineraryItem(item);
  const bookingType =
    template === "recommended"
      ? bookingTypeForItineraryItem(item)
      : bookingTypeForBookingTemplate(template);

  return {
    type: bookingType,
    title: bookingDraftTitleForItineraryItem(item, bookingType),
    status: "draft",
    visibility: "shared",
    ownerMemberId: currentMemberId,
    providerName: draftDetails.providerName,
    confirmationCode: draftDetails.confirmationCode,
    startsAt: timeWindow.startsAt,
    endsAt: timeWindow.endsAt,
    timezone: defaultTimezone ?? null,
    priceAmount: null,
    currency: null,
    travelerIds: members.map((member) => member.id),
    externalLinks: [],
    relatedItineraryItemIds: [item.id],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: draftDetails.notes,
  };
}

export function buildItineraryBookingTicketDocInput(
  input: ItineraryBookingTicketInputLike,
  {
    currentMemberId,
    defaultTimezone,
    existingBookingDoc,
    members,
  }: BookingTicketInputContext,
): BookingDocInputLike {
  const relatedItineraryItemIds = uniqueStringIds([
    ...input.relatedItineraryItemIds,
    input.itemId,
  ]);

  return {
    tripPlanId: existingBookingDoc?.tripPlanId,
    type: existingBookingDoc?.type ?? input.type,
    title: input.title,
    status: existingBookingDoc?.status ?? input.status,
    visibility: existingBookingDoc?.visibility ?? input.visibility,
    ownerMemberId: existingBookingDoc?.ownerMemberId ?? currentMemberId,
    providerName: input.providerName,
    confirmationCode: input.confirmationCode,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    timezone: existingBookingDoc?.timezone ?? defaultTimezone ?? null,
    priceAmount: existingBookingDoc?.priceAmount ?? null,
    currency: existingBookingDoc?.currency ?? null,
    travelerIds:
      existingBookingDoc?.travelerIds.length || input.travelerIds.length
        ? existingBookingDoc?.travelerIds.length
          ? existingBookingDoc.travelerIds
          : input.travelerIds
        : members.map((member) => member.id),
    externalLinks: existingBookingDoc?.externalLinks ?? [],
    relatedItineraryItemIds,
    relatedTaskIds: existingBookingDoc?.relatedTaskIds ?? [],
    relatedExpenseIds: existingBookingDoc?.relatedExpenseIds ?? [],
    noteIds: existingBookingDoc?.noteIds ?? [],
    notes: input.notes,
  };
}

export function resolveItineraryBookingTicketCommandInput(
  input: ItineraryBookingTicketInputLike,
  {
    bookingDocs,
    currentMemberId,
    defaultTimezone,
    members,
  }: ResolveItineraryBookingTicketCommandInputContext,
): ItineraryBookingTicketCommandInput {
  const explicitBookingDoc = input.bookingDocId
    ? bookingDocs.find((candidate) => candidate.id === input.bookingDocId) ??
      null
    : null;
  const bookingDocInput = buildItineraryBookingTicketDocInput(input, {
    currentMemberId,
    defaultTimezone,
    existingBookingDoc: explicitBookingDoc,
    members,
  });

  return {
    bookingDocInput,
    existingBookingDoc:
      explicitBookingDoc ??
      findDuplicateBookingDoc(bookingDocs, bookingDocInput),
  };
}
