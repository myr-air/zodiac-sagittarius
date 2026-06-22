import {
  type BookingDocInputLike,
  type ItineraryBookingTicketInputLike,
  findDuplicateBookingDoc,
  uniqueStringIds,
} from "@/src/trip/booking-docs";
import type { BookingDoc, Member } from "@/src/trip/types";

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
