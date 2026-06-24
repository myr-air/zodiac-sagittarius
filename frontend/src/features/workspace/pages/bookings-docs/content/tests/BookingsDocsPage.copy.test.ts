import { describe, expect, it } from "vitest";
import { bookingCopy } from "../BookingsDocsPage.copy";
import { enBookingCopy } from "../BookingsDocsPage.copy.en";
import { thBookingCopy } from "../BookingsDocsPage.copy.th";

describe("bookings docs page copy", () => {
  it("keeps locale copy payloads split behind the stable aggregate export", () => {
    expect(bookingCopy.en).toBe(enBookingCopy);
    expect(bookingCopy.th).toBe(thBookingCopy);
  });

  it("keeps localized booking page labels available for each supported workspace locale", () => {
    expect(bookingCopy.en.title).toBe("Bookings & Docs");
    expect(bookingCopy.th.title).toBe("การจองและเอกสาร");
    expect(bookingCopy.en.enumLabels.flight).toBe("Flight");
    expect(bookingCopy.th.enumLabels.flight).toBe("เที่ยวบิน");
  });
});
