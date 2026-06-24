import { describe, expect, it } from "vitest";
import type { BookingDoc } from "@/src/trip/types";
import {
  changeBookingQueryBrowserState,
  changeBookingStatusFilterBrowserState,
  initialBookingBrowserState,
  initialBookingModalState,
  selectBookingBrowserState,
  selectBookingFolderBrowserState,
} from "../booking-page-state";

const bookingDocs = [
  { id: "booking-flight" },
  { id: "booking-hotel" },
] as BookingDoc[];

describe("booking page state", () => {
  it("initializes browser and modal state from current bookings", () => {
    expect(initialBookingBrowserState(bookingDocs)).toMatchObject({
      activeFolderId: "all",
      mobilePreviewOpen: false,
      query: "",
      selectedBookingId: "booking-flight",
      statusFilter: "all",
    });
    expect(initialBookingBrowserState([]).selectedBookingId).toBe("");
    expect(initialBookingModalState).toEqual({
      deleteBooking: null,
      dialogBooking: null,
    });
  });

  it("updates browser state for selection and filters", () => {
    const state = {
      ...initialBookingBrowserState(bookingDocs),
      mobilePreviewOpen: true,
      query: "hotel",
    };

    expect(selectBookingBrowserState(state, "booking-hotel")).toMatchObject({
      mobilePreviewOpen: true,
      selectedBookingId: "booking-hotel",
    });
    expect(selectBookingFolderBrowserState(state, "transport")).toMatchObject({
      activeFolderId: "transport",
      mobilePreviewOpen: false,
    });
    expect(changeBookingQueryBrowserState(state, "flight")).toMatchObject({
      mobilePreviewOpen: false,
      query: "flight",
    });
    expect(changeBookingStatusFilterBrowserState(state, "confirmed")).toMatchObject({
      mobilePreviewOpen: false,
      statusFilter: "confirmed",
    });
  });
});
