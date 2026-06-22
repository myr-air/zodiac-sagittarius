import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bookingsDocsPageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readBookingsDocsPageSource(fileName: string) {
  return readFileSync(join(bookingsDocsPageDir, fileName), "utf8");
}

describe("bookings docs page state structure", () => {
  it("keeps browser and modal state grouped inside the page state hook", () => {
    const pageStateSource = readBookingsDocsPageSource(
      "use-bookings-docs-page-state.ts",
    );

    expect(pageStateSource).toContain("BookingBrowserState");
    expect(pageStateSource).toContain("BookingModalState");
    expect(pageStateSource).toContain("const [browserState, setBrowserState]");
    expect(pageStateSource).toContain("const [modalState, setModalState]");
    expect(pageStateSource).toContain("function updateBrowserState");
    expect(pageStateSource).toContain("function updateModalState");
    expect(pageStateSource).not.toContain("const [activeFolderId, setActiveFolderId]");
    expect(pageStateSource).not.toContain("const [dialogBooking, setDialogBooking]");
  });
});
