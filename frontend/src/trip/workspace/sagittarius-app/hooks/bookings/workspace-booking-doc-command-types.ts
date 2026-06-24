import type { BookingDocInputLike } from "@/src/trip/booking-docs";
import type { BookingDoc, Trip } from "@/src/trip/types";
import type { UseWorkspaceBookingDocUpdateCommandsOptions } from "./workspace-booking-doc-update-command-types";

export interface UseWorkspaceBookingDocCommandsOptions
  extends UseWorkspaceBookingDocUpdateCommandsOptions {
  currentMemberId: string;
  selectedTripPlanId: string;
  trip: Trip;
}

export type UseCreateBookingDocCommandOptions =
  UseWorkspaceBookingDocCommandsOptions;

export type UseDeleteBookingDocCommandOptions = Pick<
  UseWorkspaceBookingDocCommandsOptions,
  | "apiClient"
  | "canEditBookings"
  | "commitTrip"
  | "isApiMode"
  | "latestTripRef"
  | "participantSession"
  | "replaceApiTrip"
  | "trip"
>;

export type CreateBookingDocCommand = (
  input: BookingDocInputLike,
) => Promise<BookingDoc | null>;

export type DeleteBookingDocCommand = (
  bookingDocId: string,
) => Promise<void>;
