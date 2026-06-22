import { describe, expect, it } from "vitest";
import { tripPartySizeRange } from "@/src/trip/settings";
import { tripWizardDefaultTimezone, tripWizardPartySizeFromInput } from "../portal-trip-wizard-date-fields";

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

  it("normalizes party size input through trip settings rules", () => {
    expect(tripWizardPartySizeFromInput("2.8")).toBe(2);
    expect(tripWizardPartySizeFromInput("")).toBe(tripPartySizeRange.min);
    expect(tripWizardPartySizeFromInput("0")).toBe(tripPartySizeRange.min);
  });
});
