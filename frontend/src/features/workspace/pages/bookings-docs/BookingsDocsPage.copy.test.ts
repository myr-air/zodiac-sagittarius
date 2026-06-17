import { describe, expect, it } from "vitest";
import {
  bookingCopy,
  bookingStatuses,
  bookingTypes,
  bookingVisibilities,
  formatEnumLabel,
} from "./BookingsDocsPage.copy";

describe("bookings docs page copy", () => {
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

  it("formats enum labels from the selected locale copy", () => {
    expect(formatEnumLabel("flight", bookingCopy.en)).toBe("Flight");
    expect(formatEnumLabel("needs_action", bookingCopy.en)).toBe("Needs Action");
    expect(formatEnumLabel("flight", bookingCopy.th)).toBe("เที่ยวบิน");
    expect(formatEnumLabel("needs_action", bookingCopy.th)).toBe("ต้องดำเนินการ");
  });
});
