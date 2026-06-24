import { useMemo } from "react";
import type { BookingDoc, Member, Trip, TripTask } from "@/src/trip/types";
import type {
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "../BookingsDocsPage.types";
import { countBookingFolders, findBookingFolder } from "../model/booking-folders";
import {
  filterBookingPageDocs,
  lockedBookingDocsForMember,
  selectedBookingPageDoc,
  selectedBookingPageRelations,
  visibleBookingDocsForMember,
} from "../model/booking-page-selectors";
import { useBookingBrowserState } from "./useBookingBrowserState";
import { useBookingModalState } from "./useBookingModalState";

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
    statusFilter,
  } = useBookingBrowserState({ bookingDocs });
  const {
    confirmDelete,
    deleteBooking,
    dialogBooking,
    setDeleteBooking,
    setDialogBooking,
    submitBooking,
  } = useBookingModalState({
    onCreateBookingDoc,
    onDeleteBookingDoc,
    onUpdateBookingDoc,
  });
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

  return {
    activeFolder,
    activeFolderId,
    changeQuery,
    changeStatusFilter,
    confirmDelete,
    deleteBooking,
    dialogBooking,
    folderCounts,
    folderDocs,
    lockedDocs,
    mobilePreviewOpen,
    query,
    selectedBooking,
    selectedRelations,
    selectBooking,
    selectFolder,
    setDeleteBooking,
    setDialogBooking,
    setMobilePreviewOpen,
    statusFilter,
    submitBooking,
  };
}
