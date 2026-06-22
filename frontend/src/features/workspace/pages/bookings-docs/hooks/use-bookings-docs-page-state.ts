import { useMemo, useState } from "react";
import type { BookingDoc, Member, Trip, TripTask } from "@/src/trip/types";
import type {
  BookingDocInput,
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "../BookingsDocsPage.types";
import {
  initialBookingModalState,
  updateBookingModalState,
  type BookingModalState,
} from "../model/booking-page-state";
import { countBookingFolders, findBookingFolder } from "../model/booking-folders";
import {
  filterBookingPageDocs,
  lockedBookingDocsForMember,
  selectedBookingPageDoc,
  selectedBookingPageRelations,
  visibleBookingDocsForMember,
} from "../model/booking-page-selectors";
import { useBookingBrowserState } from "./useBookingBrowserState";

interface UseBookingsDocsPageStateInput {
  bookingDocs: BookingDoc[];
  currentMember: Member;
  onCreateBookingDoc: CreateBookingDocHandler;
  onDeleteBookingDoc: DeleteBookingDocHandler;
  onUpdateBookingDoc: UpdateBookingDocHandler;
  tasks: TripTask[];
  trip: Trip;
}

export function useBookingsDocsPageState({
  bookingDocs,
  currentMember,
  onCreateBookingDoc,
  onDeleteBookingDoc,
  onUpdateBookingDoc,
  tasks,
  trip,
}: UseBookingsDocsPageStateInput) {
  const {
    activeFolderId,
    changeQuery,
    changeStatusFilter,
    mobilePreviewOpen,
    query,
    selectedBookingId,
    selectBooking,
    selectFolder,
    setMobilePreviewOpen,
    setStatusMenuOpen,
    statusFilter,
    statusMenuOpen,
  } = useBookingBrowserState({ bookingDocs });
  const [modalState, setModalState] = useState<BookingModalState>(
    initialBookingModalState,
  );
  const visibleDocs = useMemo(
    () => visibleBookingDocsForMember(bookingDocs, currentMember),
    [bookingDocs, currentMember],
  );
  const folderDocs = useMemo(
    () => filterBookingPageDocs({
      activeFolderId,
      docs: visibleDocs,
      query,
      statusFilter,
      trip,
    }),
    [activeFolderId, query, statusFilter, trip, visibleDocs],
  );
  const folderCounts = useMemo(() => countBookingFolders(visibleDocs), [visibleDocs]);
  const lockedDocs = lockedBookingDocsForMember(bookingDocs, currentMember);
  const selectedBooking = selectedBookingPageDoc(
    folderDocs,
    selectedBookingId,
  );
  const selectedRelations = selectedBookingPageRelations({
    booking: selectedBooking,
    tasks,
    trip,
  });
  const activeFolder = findBookingFolder(activeFolderId);

  function updateModalState<Field extends keyof BookingModalState>(
    field: Field,
    value: BookingModalState[Field],
  ) {
    setModalState((current) => updateBookingModalState(current, field, value));
  }

  async function submitBooking(input: BookingDocInput) {
    if (modalState.dialogBooking === "new") {
      await onCreateBookingDoc(input);
    } else if (modalState.dialogBooking) {
      await onUpdateBookingDoc(modalState.dialogBooking.id, input);
    }
    updateModalState("dialogBooking", null);
  }

  async function confirmDelete() {
    if (!modalState.deleteBooking) return;
    await onDeleteBookingDoc(modalState.deleteBooking.id);
    updateModalState("deleteBooking", null);
  }

  return {
    activeFolder,
    activeFolderId,
    changeQuery,
    changeStatusFilter,
    confirmDelete,
    deleteBooking: modalState.deleteBooking,
    dialogBooking: modalState.dialogBooking,
    folderCounts,
    folderDocs,
    lockedDocs,
    mobilePreviewOpen,
    query,
    selectedBooking,
    selectedRelations,
    selectBooking,
    selectFolder,
    setDeleteBooking: (deleteBooking: BookingDoc | null) =>
      updateModalState("deleteBooking", deleteBooking),
    setDialogBooking: (dialogBooking: BookingDoc | "new" | null) =>
      updateModalState("dialogBooking", dialogBooking),
    setMobilePreviewOpen,
    setStatusMenuOpen,
    statusFilter,
    statusMenuOpen,
    submitBooking,
  };
}
