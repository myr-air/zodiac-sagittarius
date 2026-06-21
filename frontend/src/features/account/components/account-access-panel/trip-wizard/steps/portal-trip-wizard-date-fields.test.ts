import { describe, expect, it } from "vitest";
import { tripWizardDefaultTimezone } from "./portal-trip-wizard-date-fields";

describe("trip wizard date fields", () => {
  it("prefers the explicit trip timezone", () => {
    expect(
      tripWizardDefaultTimezone(
        { defaultTimezone: "Asia/Tokyo" },
        [{ timezone: "Asia/Seoul" }],
      ),
    ).toBe("Asia/Tokyo");
  });

  it("falls back to the first selected destination timezone", () => {
    expect(
      tripWizardDefaultTimezone(
        { defaultTimezone: "" },
        [{ timezone: "Asia/Seoul" }],
      ),
    ).toBe("Asia/Seoul");
  });

  it("uses the origin timezone when no trip or destination timezone exists", () => {
    expect(tripWizardDefaultTimezone({ defaultTimezone: "" }, [])).toBe("Asia/Bangkok");
  });
});
