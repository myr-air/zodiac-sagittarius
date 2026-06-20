import { useMemo, useState } from "react";
import {
  canViewBookingDoc,
  findBookingDocRelations,
} from "@/src/trip/booking-docs";
import type { BookingDoc, Member, Trip, TripTask } from "@/src/trip/types";
import type { BookingDocInput } from "./BookingsDocsPage.types";
import type { BookingStatusFilter } from "./booking-options";
import {
  bookingDocMatchesFolder,
  bookingFolders,
  countBookingFolders,
  type BookingFolderId,
} from "./booking-folders";
import {
  bookingDocMatchesQuery,
  compareBookingStartWithUndated,
} from "./booking-list";

interface UseBookingsDocsPageStateInput {
  bookingDocs: BookingDoc[];
  currentMember: Member;
  onCreateBookingDoc: (input: BookingDocInput) => void | Promise<void>;
  onDeleteBookingDoc: (bookingDocId: string) => void | Promise<void>;
  onUpdateBookingDoc: (bookingDocId: string, input: BookingDocInput) => void | Promise<void>;
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
  const visibleDocs = useMemo(() => bookingDocs.filter((doc) => canViewBookingDoc(doc, currentMember)), [bookingDocs, currentMember]);
  const folderDocs = useMemo(() => visibleDocs
    .filter((doc) => bookingDocMatchesFolder(doc, activeFolderId))
    .filter((doc) => statusFilter === "all" || doc.status === statusFilter)
    .filter((doc) => bookingDocMatchesQuery(doc, trip, query))
    .sort(compareBookingStartWithUndated), [activeFolderId, query, statusFilter, trip, visibleDocs]);
  const folderCounts = useMemo(() => countBookingFolders(visibleDocs), [visibleDocs]);
  const lockedDocs = bookingDocs.filter((doc) => !canViewBookingDoc(doc, currentMember));
  const selectedBooking = folderDocs.find((doc) => doc.id === selectedBookingId) ?? folderDocs[0] ?? null;
  const selectedRelations = selectedBooking ? findBookingDocRelations(selectedBooking, trip, tasks) : null;
  const activeFolder = bookingFolders.find((folder) => folder.id === activeFolderId) ?? bookingFolders[0];

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
