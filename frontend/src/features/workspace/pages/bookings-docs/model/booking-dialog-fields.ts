import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/src/shared/date-time-local";
import { trimmedTextOrNull } from "@/src/shared/text-parts";
import type {
  BookingDoc,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
  Trip,
} from "@/src/trip/types";
import type { BookingDocInput } from "../BookingsDocsPage.types";

export interface BookingDialogFields {
  confirmationCode: string;
  currency: string;
  endsAt: string;
  externalUrl: string;
  noteIds: string[];
  notes: string;
  priceAmount: string;
  providerName: string;
  relatedExpenseIds: string[];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  startsAt: string;
  status: BookingDocStatus;
  title: string;
  travelerIds: string[];
  type: BookingDocType;
  visibility: BookingDocVisibility;
}

export function initialBookingDialogFields({
  booking,
  trip,
}: {
  booking: BookingDoc | null;
  trip: Trip;
}): BookingDialogFields {
  return {
    confirmationCode: booking?.confirmationCode ?? "",
    currency: booking?.currency ?? "HKD",
    endsAt: toDateTimeLocalValue(booking?.endsAt),
    externalUrl: booking?.externalLinks[0]?.url ?? "",
    noteIds: booking?.noteIds ?? [],
    notes: booking?.notes ?? "",
    priceAmount: booking?.priceAmount?.toString() ?? "",
    providerName: booking?.providerName ?? "",
    relatedExpenseIds: booking?.relatedExpenseIds ?? [],
    relatedItineraryItemIds: booking?.relatedItineraryItemIds ?? [],
    relatedTaskIds: booking?.relatedTaskIds ?? [],
    startsAt: toDateTimeLocalValue(booking?.startsAt),
    status: booking?.status ?? "draft",
    title: booking?.title ?? "",
    travelerIds: booking?.travelerIds ?? trip.members.slice(0, 1).map((member) => member.id),
    type: booking?.type ?? "flight",
    visibility: booking?.visibility ?? "shared",
  };
}

export function buildBookingDialogSubmitInput({
  booking,
  externalLinkLabel,
  fields,
}: {
  booking: BookingDoc | null;
  externalLinkLabel: string;
  fields: BookingDialogFields;
}): BookingDocInput | null {
  const title = fields.title.trim();
  if (!title) return null;

  const providerName = fields.providerName.trim();
  const linkUrl = fields.externalUrl.trim();

  return {
    type: fields.type,
    title,
    status: fields.status,
    visibility: fields.visibility,
    ownerMemberId:
      fields.visibility === "private"
        ? fields.travelerIds[0] || null
        : booking?.ownerMemberId ?? null,
    providerName: providerName || null,
    confirmationCode: trimmedTextOrNull(fields.confirmationCode),
    startsAt: fromDateTimeLocalValue(fields.startsAt),
    endsAt: fromDateTimeLocalValue(fields.endsAt),
    timezone: booking?.timezone ?? "Asia/Hong_Kong",
    priceAmount: fields.priceAmount ? Number(fields.priceAmount) : null,
    currency: trimmedTextOrNull(fields.currency),
    travelerIds: fields.travelerIds,
    externalLinks: linkUrl
      ? [
          {
            id: booking?.externalLinks[0]?.id ?? "link-local-1",
            label: externalLinkLabel,
            url: linkUrl,
            provider: providerName || null,
            accessNote: null,
          },
        ]
      : [],
    relatedItineraryItemIds: fields.relatedItineraryItemIds,
    relatedTaskIds: fields.relatedTaskIds,
    relatedExpenseIds: fields.relatedExpenseIds,
    noteIds: fields.noteIds,
    notes: trimmedTextOrNull(fields.notes),
  };
}
