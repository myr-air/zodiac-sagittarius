import type { BookingDoc } from "@/src/trip/types";
import type { BookingStatusFilter } from "./booking-options";
import type { BookingFolderId } from "./booking-folders";

export interface BookingBrowserState {
  activeFolderId: BookingFolderId;
  mobilePreviewOpen: boolean;
  query: string;
  selectedBookingId: string;
  statusFilter: BookingStatusFilter;
  statusMenuOpen: boolean;
}

export interface BookingModalState {
  deleteBooking: BookingDoc | null;
  dialogBooking: BookingDoc | "new" | null;
}

type BooleanStateAction = boolean | ((current: boolean) => boolean);

export function initialBookingBrowserState(
  bookingDocs: BookingDoc[],
): BookingBrowserState {
  return {
    activeFolderId: "all",
    mobilePreviewOpen: false,
    query: "",
    selectedBookingId: bookingDocs[0]?.id ?? "",
    statusFilter: "all",
    statusMenuOpen: false,
  };
}

export const initialBookingModalState: BookingModalState = {
  deleteBooking: null,
  dialogBooking: null,
};

export function updateBookingBrowserState<Field extends keyof BookingBrowserState>(
  state: BookingBrowserState,
  field: Field,
  value: BookingBrowserState[Field],
): BookingBrowserState {
  return { ...state, [field]: value };
}

export function updateBookingModalState<Field extends keyof BookingModalState>(
  state: BookingModalState,
  field: Field,
  value: BookingModalState[Field],
): BookingModalState {
  return { ...state, [field]: value };
}

export function selectBookingBrowserState(
  state: BookingBrowserState,
  selectedBookingId: string,
): BookingBrowserState {
  return {
    ...state,
    mobilePreviewOpen: true,
    selectedBookingId,
  };
}

export function selectBookingFolderBrowserState(
  state: BookingBrowserState,
  activeFolderId: BookingFolderId,
): BookingBrowserState {
  return {
    ...state,
    activeFolderId,
    mobilePreviewOpen: false,
    statusMenuOpen: false,
  };
}

export function changeBookingQueryBrowserState(
  state: BookingBrowserState,
  query: string,
): BookingBrowserState {
  return {
    ...state,
    mobilePreviewOpen: false,
    query,
    statusMenuOpen: false,
  };
}

export function changeBookingStatusFilterBrowserState(
  state: BookingBrowserState,
  statusFilter: BookingStatusFilter,
): BookingBrowserState {
  return {
    ...state,
    mobilePreviewOpen: false,
    statusFilter,
    statusMenuOpen: false,
  };
}

export function setBookingStatusMenuOpenBrowserState(
  state: BookingBrowserState,
  nextOpen: BooleanStateAction,
): BookingBrowserState {
  return {
    ...state,
    statusMenuOpen:
      typeof nextOpen === "function" ? nextOpen(state.statusMenuOpen) : nextOpen,
  };
}
