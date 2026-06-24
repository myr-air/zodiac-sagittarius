import { describe, expect, it } from "vitest";
import { buildBookingDoc } from "@/src/features/itinerary/testing";
import {
  bookingDocQuickFieldCopy,
  bookingDocQuickFieldPatchFromDraft,
  getBookingDocQuickFieldDraftValue,
  shouldCommitBookingDocQuickField,
} from "../context-rail-booking-doc-item-model";

const copy = {
  provider: "Provider",
  providerFor: ({ title }: { title: string }) => `Provider for ${title}`,
  providerPlaceholder: "Add provider",
  reference: "Reference",
  referenceFor: ({ title }: { title: string }) => `Reference for ${title}`,
  referencePlaceholder: "Add reference",
};

function draftInput(value: string, draftValue?: string): HTMLInputElement {
  const input = document.createElement("input");
  input.value = value;
  if (draftValue !== undefined) {
    input.dataset.draftValue = draftValue;
  }
  return input;
}

describe("context rail booking doc item model", () => {
  it("maps quick-field copy by field type", () => {
    expect(bookingDocQuickFieldCopy(copy, "providerName")).toEqual({
      ariaLabel: copy.providerFor,
      label: "Provider",
      placeholder: "Add provider",
    });
    expect(bookingDocQuickFieldCopy(copy, "confirmationCode")).toEqual({
      ariaLabel: copy.referenceFor,
      label: "Reference",
      placeholder: "Add reference",
    });
  });

  it("reads trimmed draft values before committed input values", () => {
    expect(getBookingDocQuickFieldDraftValue(draftInput("Current"))).toBe(
      "Current",
    );
    expect(
      getBookingDocQuickFieldDraftValue(draftInput("Current", "  Draft  ")),
    ).toBe("Draft");
  });

  it("commits blur and Enter while ignoring other keys", () => {
    expect(shouldCommitBookingDocQuickField()).toBe(true);
    expect(shouldCommitBookingDocQuickField("Enter")).toBe(true);
    expect(shouldCommitBookingDocQuickField("Escape")).toBe(false);
  });

  it("builds quick-field patches only when the draft changes", () => {
    const bookingDoc = buildBookingDoc({
      id: "booking-1",
      type: "activity_ticket",
      title: "Dim Dim Sum",
      providerName: "Dim Dim Sum",
    });

    expect(
      bookingDocQuickFieldPatchFromDraft({
        bookingDoc,
        key: "providerName",
        target: draftInput("Dim Dim Sum", " Updated supplier "),
      }),
    ).toEqual({ providerName: "Updated supplier" });
    expect(
      bookingDocQuickFieldPatchFromDraft({
        bookingDoc,
        key: "providerName",
        target: draftInput("Dim Dim Sum"),
      }),
    ).toBeNull();
  });
});
