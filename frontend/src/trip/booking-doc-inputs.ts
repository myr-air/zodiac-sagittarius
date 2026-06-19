import type {
  BookingDoc,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
} from "./types";

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

export interface BuildCreateBookingDocRequestOptions {
  clientMutationId: string;
}

export interface BuildPatchBookingDocRequestOptions {
  clientMutationId: string;
  expectedVersion: number;
}
