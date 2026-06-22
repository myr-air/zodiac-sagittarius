import { type SetStateAction, useMemo, useState } from "react";
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
  selectedBookingPageRelations,
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

interface BookingBrowserState {
  activeFolderId: BookingFolderId;
  mobilePreviewOpen: boolean;
  query: string;
  selectedBookingId: string;
  statusFilter: BookingStatusFilter;
  statusMenuOpen: boolean;
}

interface BookingModalState {
  deleteBooking: BookingDoc | null;
  dialogBooking: BookingDoc | "new" | null;
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
  const [browserState, setBrowserState] = useState<BookingBrowserState>({
    activeFolderId: "all",
    mobilePreviewOpen: false,
    query: "",
    selectedBookingId: bookingDocs[0]?.id ?? "",
    statusFilter: "all",
    statusMenuOpen: false,
  });
  const [modalState, setModalState] = useState<BookingModalState>({
    deleteBooking: null,
    dialogBooking: null,
  });
  const visibleDocs = useMemo(
    () => visibleBookingDocsForMember(bookingDocs, currentMember),
    [bookingDocs, currentMember],
  );
  const folderDocs = useMemo(
    () => filterBookingPageDocs({
      activeFolderId: browserState.activeFolderId,
      docs: visibleDocs,
      query: browserState.query,
      statusFilter: browserState.statusFilter,
      trip,
    }),
    [
      browserState.activeFolderId,
      browserState.query,
      browserState.statusFilter,
      trip,
      visibleDocs,
    ],
  );
  const folderCounts = useMemo(() => countBookingFolders(visibleDocs), [visibleDocs]);
  const lockedDocs = lockedBookingDocsForMember(bookingDocs, currentMember);
  const selectedBooking = selectedBookingPageDoc(
    folderDocs,
    browserState.selectedBookingId,
  );
  const selectedRelations = selectedBookingPageRelations({
    booking: selectedBooking,
    tasks,
    trip,
  });
  const activeFolder = findBookingFolder(browserState.activeFolderId);

  function updateBrowserState<Field extends keyof BookingBrowserState>(
    field: Field,
    value: BookingBrowserState[Field],
  ) {
    setBrowserState((current) => ({ ...current, [field]: value }));
  }

  function updateModalState<Field extends keyof BookingModalState>(
    field: Field,
    value: BookingModalState[Field],
  ) {
    setModalState((current) => ({ ...current, [field]: value }));
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

  function selectBooking(bookingDocId: string) {
    setBrowserState((current) => ({
      ...current,
      mobilePreviewOpen: true,
      selectedBookingId: bookingDocId,
    }));
  }

  function selectFolder(folderId: BookingFolderId) {
    setBrowserState((current) => ({
      ...current,
      activeFolderId: folderId,
      mobilePreviewOpen: false,
      statusMenuOpen: false,
    }));
  }

  function changeQuery(nextQuery: string) {
    setBrowserState((current) => ({
      ...current,
      mobilePreviewOpen: false,
      query: nextQuery,
      statusMenuOpen: false,
    }));
  }

  function changeStatusFilter(nextStatus: BookingStatusFilter) {
    setBrowserState((current) => ({
      ...current,
      mobilePreviewOpen: false,
      statusFilter: nextStatus,
      statusMenuOpen: false,
    }));
  }

  function setMobilePreviewOpen(nextOpen: boolean) {
    updateBrowserState("mobilePreviewOpen", nextOpen);
  }

  function setStatusMenuOpen(nextOpen: SetStateAction<boolean>) {
    setBrowserState((current) => ({
      ...current,
      statusMenuOpen:
        typeof nextOpen === "function"
          ? nextOpen(current.statusMenuOpen)
          : nextOpen,
    }));
  }

  return {
    activeFolder,
    activeFolderId: browserState.activeFolderId,
    changeQuery,
    changeStatusFilter,
    confirmDelete,
    deleteBooking: modalState.deleteBooking,
    dialogBooking: modalState.dialogBooking,
    folderCounts,
    folderDocs,
    lockedDocs,
    mobilePreviewOpen: browserState.mobilePreviewOpen,
    query: browserState.query,
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
    statusFilter: browserState.statusFilter,
    statusMenuOpen: browserState.statusMenuOpen,
    submitBooking,
  };
}
