import { describe, expect, it } from "vitest";
import { bookingCopy } from "../../content/BookingsDocsPage.copy";
import {
  bookingStatusFilterValues,
  bookingStatusFilterSelectOptions,
  bookingStatusSelectOptions,
  bookingStatuses,
  bookingTypeSelectOptions,
  bookingTypes,
  bookingVisibilitySelectOptions,
  bookingVisibilities,
  formatEnumLabel,
} from "../booking-options";

describe("booking options", () => {
  it("keeps dialog select options in stable domain order", () => {
    expect(bookingTypes).toEqual([
      "flight",
      "train",
      "public_transport",
      "hotel",
      "insurance",
      "passport",
      "visa",
      "activity_ticket",
      "other",
    ]);
    expect(bookingStatuses).toEqual(["draft", "needs_action", "booked", "confirmed", "paid", "cancelled", "expired"]);
    expect(bookingVisibilities).toEqual(["shared", "sensitive", "private"]);
  });

  it("derives status filter options from the shared status order", () => {
    expect(bookingStatusFilterValues).toEqual(["all", ...bookingStatuses]);
    expect(bookingStatusFilterSelectOptions(bookingCopy.en)[0]).toEqual({
      value: "all",
      label: "All statuses",
    });
    expect(bookingStatusFilterSelectOptions(bookingCopy.en)).toContainEqual({
      value: "confirmed",
      label: "Confirmed",
    });
  });

  it("formats enum labels from the selected locale copy", () => {
    expect(formatEnumLabel("flight", bookingCopy.en)).toBe("Flight");
    expect(formatEnumLabel("needs_action", bookingCopy.en)).toBe("Needs Action");
    expect(formatEnumLabel("flight", bookingCopy.th)).toBe(bookingCopy.th.enumLabels.flight);
    expect(formatEnumLabel("needs_action", bookingCopy.th)).toBe(bookingCopy.th.enumLabels.needs_action);
  });

  it("builds dialog select options from the shared enum labels", () => {
    expect(bookingTypeSelectOptions(bookingCopy.en)[0]).toEqual({ value: "flight", label: "Flight" });
    expect(bookingStatusSelectOptions(bookingCopy.en)).toContainEqual({
      value: "needs_action",
      label: "Needs Action",
    });
    expect(bookingVisibilitySelectOptions(bookingCopy.th)).toEqual([
      { value: "shared", label: bookingCopy.th.enumLabels.shared },
      { value: "sensitive", label: bookingCopy.th.enumLabels.sensitive },
      { value: "private", label: bookingCopy.th.enumLabels.private },
    ]);
  });
});
