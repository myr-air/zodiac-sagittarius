import type {
  BookingDoc,
  BookingDocStatus,
  BookingDocType,
  BookingDocVisibility,
  Member,
  Trip,
  TripTask,
} from "@/src/trip/types";
import type { WorkspaceMutationResult } from "../../model/workspace-action-types";

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

export type BookingDocMutationResult = WorkspaceMutationResult;

export type CreateBookingDocHandler = (
  input: BookingDocInput,
) => BookingDocMutationResult;

export type UpdateBookingDocHandler = (
  bookingDocId: string,
  input: BookingDocInput,
) => BookingDocMutationResult;

export type DeleteBookingDocHandler = (
  bookingDocId: string,
) => BookingDocMutationResult;

export type SubmitBookingDocHandler = (
  input: BookingDocInput,
) => BookingDocMutationResult;

export interface BookingsDocsPageProps {
  trip: Trip;
  tasks: TripTask[];
  currentMember: Member;
  bookingDocs: BookingDoc[];
  canEditBookings: boolean;
  onCreateBookingDoc: CreateBookingDocHandler;
  onUpdateBookingDoc: UpdateBookingDocHandler;
  onDeleteBookingDoc: DeleteBookingDocHandler;
}
