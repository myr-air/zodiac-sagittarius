import { describe, expect, it } from "vitest";
import { buildBookingDoc } from "@/src/features/itinerary/testing";
import type { BookingDoc } from "@/src/trip/types";
import {
  buildBookingDocQuickFieldPatch,
  getBookingDocQuickFieldValue,
} from "./booking-doc-quick-fields";

function buildQuickFieldBookingDoc(fields: Partial<BookingDoc>) {
  return buildBookingDoc({
    ...fields,
    id: fields.id ?? "booking-dimdim-1",
    title: fields.title ?? "Dim Dim Sum reservation",
    type: fields.type ?? "activity_ticket",
  });
}

describe("booking doc quick fields", () => {
  it("reads nullable quick-field values as stable form strings", () => {
    const bookingDoc = buildQuickFieldBookingDoc({
      providerName: null,
      confirmationCode: "DDS-42",
    });

    expect(getBookingDocQuickFieldValue(bookingDoc, "providerName")).toBe("");
    expect(getBookingDocQuickFieldValue(bookingDoc, "confirmationCode")).toBe(
      "DDS-42",
    );
  });

  it("builds trimmed patches for changed quick fields", () => {
    const bookingDoc = buildQuickFieldBookingDoc({
      providerName: "Dim Dim Sum",
      confirmationCode: "DDS-42",
    });

    expect(
      buildBookingDocQuickFieldPatch(
        bookingDoc,
        "providerName",
        "  Updated supplier  ",
      ),
    ).toEqual({ providerName: "Updated supplier" });
    expect(
      buildBookingDocQuickFieldPatch(
        bookingDoc,
        "confirmationCode",
        "  DDS-99  ",
      ),
    ).toEqual({ confirmationCode: "DDS-99" });
  });

  it("uses null to clear fields and skips unchanged drafts", () => {
    const bookingDoc = buildQuickFieldBookingDoc({
      providerName: "Dim Dim Sum",
      confirmationCode: "",
    });

    expect(
      buildBookingDocQuickFieldPatch(bookingDoc, "providerName", "   "),
    ).toEqual({ providerName: null });
    expect(
      buildBookingDocQuickFieldPatch(bookingDoc, "providerName", "Dim Dim Sum"),
    ).toBeNull();
    expect(
      buildBookingDocQuickFieldPatch(bookingDoc, "confirmationCode", "   "),
    ).toBeNull();
  });
});
