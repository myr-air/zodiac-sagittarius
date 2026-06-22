import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bookingsDocsPageDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readBookingsDocsPageSource(fileName: string) {
  return readFileSync(join(bookingsDocsPageDir, fileName), "utf8");
}

describe("bookings docs page state structure", () => {
  it("keeps browser and modal transitions grouped in the page state model", () => {
    const pageStateSource = readBookingsDocsPageSource(
      "hooks/use-bookings-docs-page-state.ts",
    );
    const bookingPageStateSource = readBookingsDocsPageSource(
      "model/booking-page-state.ts",
    );
    const bookingBrowserStateSource = readBookingsDocsPageSource(
      "hooks/useBookingBrowserState.ts",
    );
    const bookingModalStateSource = readBookingsDocsPageSource(
      "hooks/useBookingModalState.ts",
    );

    expect(pageStateSource).toContain("useBookingBrowserState");
    expect(pageStateSource).toContain("useBookingModalState");
    expect(pageStateSource).not.toContain("const [browserState, setBrowserState]");
    expect(pageStateSource).not.toContain("const [modalState, setModalState]");
    expect(pageStateSource).not.toContain("const [activeFolderId, setActiveFolderId]");
    expect(pageStateSource).not.toContain("const [dialogBooking, setDialogBooking]");
    expect(bookingBrowserStateSource).toContain("initialBookingBrowserState");
    expect(bookingBrowserStateSource).toContain("updateBookingBrowserState");
    expect(bookingBrowserStateSource).toContain("selectBookingBrowserState");
    expect(bookingBrowserStateSource).toContain("selectBookingFolderBrowserState");
    expect(bookingBrowserStateSource).toContain("changeBookingQueryBrowserState");
    expect(bookingBrowserStateSource).toContain("changeBookingStatusFilterBrowserState");
    expect(bookingBrowserStateSource).toContain("setBookingStatusMenuOpenBrowserState");
    expect(bookingBrowserStateSource).toContain("const [browserState, setBrowserState]");
    expect(bookingModalStateSource).toContain("initialBookingModalState");
    expect(bookingModalStateSource).toContain("updateBookingModalState");
    expect(bookingModalStateSource).toContain("const [modalState, setModalState]");
    expect(bookingModalStateSource).toContain("async function submitBooking");
    expect(bookingModalStateSource).toContain("async function confirmDelete");
    expect(bookingPageStateSource).toContain("export interface BookingBrowserState");
    expect(bookingPageStateSource).toContain("export interface BookingModalState");
    expect(bookingPageStateSource).toContain(
      "export function initialBookingBrowserState",
    );
    expect(bookingPageStateSource).toContain(
      "export function selectBookingBrowserState",
    );
  });
});
