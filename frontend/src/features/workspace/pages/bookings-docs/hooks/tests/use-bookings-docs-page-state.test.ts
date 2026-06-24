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
    const bookingModalActionsSource = readBookingsDocsPageSource(
      "hooks/useBookingModalActions.ts",
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
    expect(bookingModalStateSource).toContain("@/src/shared/hooks/use-form-fields");
    expect(bookingModalStateSource).toContain("useFormFields<BookingModalState>");
    expect(bookingModalStateSource).toContain("useBookingModalActions");
    expect(bookingModalStateSource).not.toContain("async function submitBooking");
    expect(bookingModalStateSource).not.toContain("async function confirmDelete");
    expect(bookingModalActionsSource).toContain("async function submitBooking");
    expect(bookingModalActionsSource).toContain("async function confirmDelete");
    expect(bookingModalActionsSource).toContain("BookingModalState");
    expect(bookingPageStateSource).toContain("export interface BookingBrowserState");
    expect(bookingPageStateSource).toContain("export interface BookingModalState");
    expect(bookingPageStateSource).not.toContain("updateBookingModalState");
    expect(bookingPageStateSource).toContain(
      "export function initialBookingBrowserState",
    );
    expect(bookingPageStateSource).toContain(
      "export function selectBookingBrowserState",
    );
  });
});
