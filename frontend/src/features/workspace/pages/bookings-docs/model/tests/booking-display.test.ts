import { describe, expect, it } from "vitest";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import {
  bookingConfirmationDisplay,
  bookingDateDisplay,
  bookingLinkedContextDisplay,
  bookingNotesDisplay,
  bookingProviderDisplay,
  bookingTravelerNamesDisplay,
  bookingTypeIcon,
  formatDateTime,
  statusBadgeClassName,
  typeIconClassName,
} from "../booking-display";

describe("booking display helpers", () => {
  it("formats booking date input values without changing stored semantics", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
    expect(formatDateTime("2026-06-18T12:30:00.000Z")).toContain("Jun");
  });

  it("centralizes booking quick-fact fallback labels", () => {
    expect(bookingDateDisplay(null, bookingCopy.en)).toBe("No date");
    expect(bookingDateDisplay("2026-06-18T12:30:00.000Z", bookingCopy.en)).toContain("Jun");
    expect(bookingProviderDisplay(null, bookingCopy.en)).toBe("No provider");
    expect(bookingProviderDisplay("Cathay Travel", bookingCopy.en)).toBe("Cathay Travel");
    expect(bookingConfirmationDisplay(null, bookingCopy.en)).toBe("No confirmation");
    expect(bookingConfirmationDisplay("QR349-HK", bookingCopy.en)).toBe("Confirmation: QR349-HK");
    expect(bookingLinkedContextDisplay("", bookingCopy.en)).toBe("No linked stop");
    expect(bookingLinkedContextDisplay("Day 2 · Ferry", bookingCopy.en)).toBe("Day 2 · Ferry");
    expect(bookingNotesDisplay(null, bookingCopy.en)).toBe(bookingCopy.en.noNotes);
    expect(bookingNotesDisplay("Print tickets", bookingCopy.en)).toBe("Print tickets");
    expect(bookingTravelerNamesDisplay([], bookingCopy.en)).toBe(bookingCopy.en.noTravelers);
    expect(bookingTravelerNamesDisplay([
      { displayName: "Aom" },
      { displayName: "Beam" },
    ], bookingCopy.en)).toBe("Aom, Beam");
  });

  it("keeps selection and visual token helpers centralized", () => {
    expect(bookingTypeIcon("hotel")).toBe("home");
    expect(typeIconClassName("passport")).toContain("text-(--color-primary-strong)");
    expect(statusBadgeClassName("needs_action")).toContain("text-(--color-warning-strong)");
    expect(statusBadgeClassName("expired")).toContain("text-[#b91c1c]");
  });
});
