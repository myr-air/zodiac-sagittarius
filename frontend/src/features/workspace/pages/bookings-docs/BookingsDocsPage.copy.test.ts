import { describe, expect, it } from "vitest";
import { bookingCopy } from "./BookingsDocsPage.copy";

describe("bookings docs page copy", () => {
  it("keeps localized booking page labels available for each supported workspace locale", () => {
    expect(bookingCopy.en.title).toBe("Bookings & Docs");
    expect(bookingCopy.th.title).toBe("การจองและเอกสาร");
    expect(bookingCopy.en.enumLabels.flight).toBe("Flight");
    expect(bookingCopy.th.enumLabels.flight).toBe("เที่ยวบิน");
  });
});
