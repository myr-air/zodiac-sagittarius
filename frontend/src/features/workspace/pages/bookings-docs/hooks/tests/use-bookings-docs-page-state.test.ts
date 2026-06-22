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

    expect(pageStateSource).toContain("initialBookingBrowserState");
    expect(pageStateSource).toContain("initialBookingModalState");
    expect(pageStateSource).toContain("updateBookingBrowserState");
    expect(pageStateSource).toContain("updateBookingModalState");
    expect(pageStateSource).toContain("selectBookingBrowserState");
    expect(pageStateSource).toContain("selectBookingFolderBrowserState");
    expect(pageStateSource).toContain("changeBookingQueryBrowserState");
    expect(pageStateSource).toContain("changeBookingStatusFilterBrowserState");
    expect(pageStateSource).toContain("setBookingStatusMenuOpenBrowserState");
    expect(pageStateSource).toContain("const [browserState, setBrowserState]");
    expect(pageStateSource).toContain("const [modalState, setModalState]");
    expect(pageStateSource).not.toContain("const [activeFolderId, setActiveFolderId]");
    expect(pageStateSource).not.toContain("const [dialogBooking, setDialogBooking]");
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
