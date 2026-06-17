import type { BookingDoc, BookingDocStatus, BookingDocType, BookingDocVisibility } from "@/src/trip/types";

export interface BookingDocInput {
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
