import { describe, expect, it } from "vitest";
import type { BookingDoc } from "../../types";
import {
  bookingDocQuickFieldKeys,
  buildBookingDocQuickFieldPatch,
  getBookingDocQuickFieldValue,
} from "../../booking-docs";
import { createBookingDocFixture as bookingDoc } from "./booking-docs.test-support";

function buildQuickFieldBookingDoc(fields: Partial<BookingDoc>) {
  return bookingDoc({
    ...fields,
    id: fields.id ?? "booking-dimdim-1",
    title: fields.title ?? "Dim Dim Sum reservation",
    type: fields.type ?? "activity_ticket",
  });
}

describe("booking doc quick fields", () => {
  it("keeps quick fields in inline edit order", () => {
    expect(bookingDocQuickFieldKeys).toEqual([
      "providerName",
      "confirmationCode",
    ]);
  });

  it("reads nullable quick-field values as stable form strings", () => {
    const doc = buildQuickFieldBookingDoc({
      providerName: null,
      confirmationCode: "DDS-42",
    });

    expect(getBookingDocQuickFieldValue(doc, "providerName")).toBe("");
    expect(getBookingDocQuickFieldValue(doc, "confirmationCode")).toBe(
      "DDS-42",
    );
  });

  it("builds trimmed patches for changed quick fields", () => {
    const doc = buildQuickFieldBookingDoc({
      providerName: "Dim Dim Sum",
      confirmationCode: "DDS-42",
    });

    expect(
      buildBookingDocQuickFieldPatch(
        doc,
        "providerName",
        "  Updated supplier  ",
      ),
    ).toEqual({ providerName: "Updated supplier" });
    expect(
      buildBookingDocQuickFieldPatch(doc, "confirmationCode", "  DDS-99  "),
    ).toEqual({ confirmationCode: "DDS-99" });
  });

  it("uses null to clear fields and skips unchanged drafts", () => {
    const doc = buildQuickFieldBookingDoc({
      providerName: "Dim Dim Sum",
      confirmationCode: "",
    });

    expect(buildBookingDocQuickFieldPatch(doc, "providerName", "   ")).toEqual(
      { providerName: null },
    );
    expect(
      buildBookingDocQuickFieldPatch(doc, "providerName", "Dim Dim Sum"),
    ).toBeNull();
    expect(
      buildBookingDocQuickFieldPatch(doc, "confirmationCode", "   "),
    ).toBeNull();
  });
});
