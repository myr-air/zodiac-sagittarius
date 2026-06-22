import { type SetStateAction, useState } from "react";
import type { BookingDoc } from "@/src/trip/types";
import type { BookingStatusFilter } from "../model/booking-options";
import {
  changeBookingQueryBrowserState,
  changeBookingStatusFilterBrowserState,
  initialBookingBrowserState,
  selectBookingBrowserState,
  selectBookingFolderBrowserState,
  setBookingStatusMenuOpenBrowserState,
  updateBookingBrowserState,
  type BookingBrowserState,
} from "../model/booking-page-state";
import type { BookingFolderId } from "../model/booking-folders";

interface UseBookingBrowserStateInput {
  bookingDocs: BookingDoc[];
}

export function useBookingBrowserState({
  bookingDocs,
}: UseBookingBrowserStateInput) {
  const [browserState, setBrowserState] = useState<BookingBrowserState>(() =>
    initialBookingBrowserState(bookingDocs),
  );

  function updateBrowserState<Field extends keyof BookingBrowserState>(
    field: Field,
    value: BookingBrowserState[Field],
  ) {
    setBrowserState((current) =>
      updateBookingBrowserState(current, field, value),
    );
  }

  function selectBooking(bookingDocId: string) {
    setBrowserState((current) =>
      selectBookingBrowserState(current, bookingDocId),
    );
  }

  function selectFolder(folderId: BookingFolderId) {
    setBrowserState((current) =>
      selectBookingFolderBrowserState(current, folderId),
    );
  }

  function changeQuery(nextQuery: string) {
    setBrowserState((current) =>
      changeBookingQueryBrowserState(current, nextQuery),
    );
  }

  function changeStatusFilter(nextStatus: BookingStatusFilter) {
    setBrowserState((current) =>
      changeBookingStatusFilterBrowserState(current, nextStatus),
    );
  }

  function setMobilePreviewOpen(nextOpen: boolean) {
    updateBrowserState("mobilePreviewOpen", nextOpen);
  }

  function setStatusMenuOpen(nextOpen: SetStateAction<boolean>) {
    setBrowserState((current) =>
      setBookingStatusMenuOpenBrowserState(current, nextOpen),
    );
  }

  return {
    activeFolderId: browserState.activeFolderId,
    changeQuery,
    changeStatusFilter,
    mobilePreviewOpen: browserState.mobilePreviewOpen,
    query: browserState.query,
    selectedBookingId: browserState.selectedBookingId,
    selectBooking,
    selectFolder,
    setMobilePreviewOpen,
    setStatusMenuOpen,
    statusFilter: browserState.statusFilter,
    statusMenuOpen: browserState.statusMenuOpen,
  };
}
