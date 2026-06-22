import type { MutableRefObject } from "react";
import type {
  BookingDocInputLike,
  BookingDocQuickFieldsPatch,
} from "@/src/trip/booking-docs";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type {
  BookingDocType,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

export interface UseWorkspaceBookingDocUpdateCommandsOptions {
  apiClient?: TripApiClient;
  canEditBookings: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  latestTripRef: MutableRefObject<Trip>;
  nextClientMutationId: (purpose: string) => string;
  participantSession: TripParticipantSession | null;
  replaceApiTrip: (nextTrip: Trip) => void;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
}

export type RunBookingDocUpdate = (
  bookingDocId: string,
  input: BookingDocInputLike,
) => Promise<void>;

export type QueueBookingDocUpdate = (
  bookingDocId: string,
  update: () => void | Promise<void>,
) => Promise<void>;

export type UpdateBookingDocCommand = RunBookingDocUpdate;

export type ChangeBookingDocTypeCommand = (
  bookingDocId: string,
  type: BookingDocType,
) => Promise<void>;

export type ChangeBookingDocQuickFieldsCommand = (
  bookingDocId: string,
  patch: BookingDocQuickFieldsPatch,
) => Promise<void>;
