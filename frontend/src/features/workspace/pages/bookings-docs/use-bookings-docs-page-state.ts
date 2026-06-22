import { useMemo, useState } from "react";
import { findBookingDocRelations } from "@/src/trip/booking-docs";
import type { BookingDoc, Member, Trip, TripTask } from "@/src/trip/types";
import type {
  BookingDocInput,
  CreateBookingDocHandler,
  DeleteBookingDocHandler,
  UpdateBookingDocHandler,
} from "./BookingsDocsPage.types";
import type { BookingStatusFilter } from "./model/booking-options";
import {
  countBookingFolders,
  findBookingFolder,
  type BookingFolderId,
} from "./model/booking-folders";
import {
  filterBookingPageDocs,
  lockedBookingDocsForMember,
  selectedBookingPageDoc,
  visibleBookingDocsForMember,
} from "./model/booking-page-selectors";

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
  const [activeFolderId, setActiveFolderId] = useState<BookingFolderId>("all");
  const [selectedBookingId, setSelectedBookingId] = useState(bookingDocs[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [dialogBooking, setDialogBooking] = useState<BookingDoc | "new" | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<BookingDoc | null>(null);
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
  const selectedBooking = selectedBookingPageDoc(folderDocs, selectedBookingId);
  const selectedRelations = selectedBooking ? findBookingDocRelations(selectedBooking, trip, tasks) : null;
  const activeFolder = findBookingFolder(activeFolderId);

  async function submitBooking(input: BookingDocInput) {
    if (dialogBooking === "new") {
      await onCreateBookingDoc(input);
    } else if (dialogBooking) {
      await onUpdateBookingDoc(dialogBooking.id, input);
    }
    setDialogBooking(null);
  }

  async function confirmDelete() {
    if (!deleteBooking) return;
    await onDeleteBookingDoc(deleteBooking.id);
    setDeleteBooking(null);
  }

  function selectBooking(bookingDocId: string) {
    setSelectedBookingId(bookingDocId);
    setMobilePreviewOpen(true);
  }

  function selectFolder(folderId: BookingFolderId) {
    setActiveFolderId(folderId);
    setMobilePreviewOpen(false);
    setStatusMenuOpen(false);
  }

  function changeQuery(nextQuery: string) {
    setQuery(nextQuery);
    setMobilePreviewOpen(false);
    setStatusMenuOpen(false);
  }

  function changeStatusFilter(nextStatus: BookingStatusFilter) {
    setStatusFilter(nextStatus);
    setStatusMenuOpen(false);
    setMobilePreviewOpen(false);
  }

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
    setStatusMenuOpen,
    statusFilter,
    statusMenuOpen,
    submitBooking,
  };
}
