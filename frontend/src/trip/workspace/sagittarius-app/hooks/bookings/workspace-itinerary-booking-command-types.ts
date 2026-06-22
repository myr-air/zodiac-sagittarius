import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { InlineItineraryItemPatch } from "@/src/features/itinerary/lib/inline-itinerary-item-patch";
import type {
  BookingDocInputLike,
  ItineraryBookingTemplate,
  ItineraryBookingTicketInput,
} from "@/src/trip/booking-docs";
import type { BookingDoc, Trip } from "@/src/trip/types";
import type { WorkspaceContextRailPrimaryTab } from "@/src/trip/workspace/context-rail-tabs";

export interface UseWorkspaceItineraryBookingCommandsOptions {
  canEditBookings: boolean;
  createBookingDoc: (input: BookingDocInputLike) => Promise<BookingDoc | null>;
  currentMemberId: string;
  latestTripRef: MutableRefObject<Trip>;
  setContextRailPreferredTab: (tab: WorkspaceContextRailPrimaryTab) => void;
  setSelectedItemId: Dispatch<SetStateAction<string>>;
  trip: Trip;
  updateBookingDoc: (
    bookingDocId: string,
    input: BookingDocInputLike,
  ) => Promise<void>;
  updateItineraryItemInline: (
    itemId: string,
    patch: InlineItineraryItemPatch,
  ) => Promise<void>;
}

export type CreateItineraryBookingDraftCommand = (
  itemId: string,
  template?: ItineraryBookingTemplate,
) => Promise<string | undefined>;

export type SaveItineraryBookingTicketCommand = (
  input: ItineraryBookingTicketInput,
) => Promise<string | undefined>;

export type UnlinkItineraryBookingCommand = (
  bookingDocId: string,
  itemId: string,
) => Promise<void>;
