import { describe, expect, it } from "vitest";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import {
  applyTripCalendarDate,
  applyTripEndDate,
  applyTripStartDate,
  formatPreviewTravelDate,
  nextTripWizardDateSelectionStep,
  routeCalendarDays,
  tripNightCount,
  tripWizardDateSelectionStepValues,
} from "./account-trip-dates";

describe("account trip date helpers", () => {
  it("re-exports trip date helpers for account trip wizard callers", () => {
    expect(formatPreviewTravelDate("2026-06-21")).toBe("21 Jun 2026");
    expect(tripNightCount("2026-06-21", "2026-06-24", "en")).toBe("3 nights (4 days)");

    const days = routeCalendarDays("2026-06-21", "2026-06-21", "2026-06-24");
    expect(days).toHaveLength(30);
    expect(days.find((day) => day.value === "2026-06-21")).toMatchObject({ dateState: "start", tourDay: 1, tourTone: "odd" });
  });

  it("keeps date selection steps in calendar toggle order", () => {
    expect(tripWizardDateSelectionStepValues).toEqual(["depart", "return"]);
    expect(nextTripWizardDateSelectionStep("depart")).toBe("return");
    expect(nextTripWizardDateSelectionStep("return")).toBe("depart");
  });

  it("keeps trip date ranges ordered from direct date inputs", () => {
    const form = {
      ...baseTripForm(),
      endDate: "2026-06-24",
      startDate: "2026-06-21",
    };

    expect(applyTripStartDate(form, "2026-06-25")).toMatchObject({
      endDate: "2026-06-25",
      startDate: "2026-06-24",
    });
    expect(applyTripEndDate(form, "2026-06-20")).toMatchObject({
      endDate: "2026-06-21",
      startDate: "2026-06-20",
    });
  });

  it("advances calendar date selection between departure and return dates", () => {
    const form = {
      ...baseTripForm(),
      endDate: "2026-06-24",
      startDate: "2026-06-21",
    };

    expect(applyTripCalendarDate(form, "2026-06-25", "depart")).toMatchObject({
      form: {
        endDate: "2026-06-25",
        startDate: "2026-06-25",
      },
      selectingDateStep: "return",
    });

    expect(applyTripCalendarDate(form, "2026-06-20", "return")).toMatchObject({
      form: {
        endDate: "2026-06-21",
        startDate: "2026-06-20",
      },
      selectingDateStep: "depart",
    });
  });
});

function baseTripForm(): AccountTripCreateRequest {
  return {
    countries: [],
    defaultTimezone: "",
    destinationCities: [],
    destinationLabel: "",
    endDate: "2026-06-24",
    joinId: "0626-TYO-ABC",
    joinPassword: "ABCD-1234",
    name: "Summer trip",
    originCity: "Bangkok",
    originCountry: "Thailand",
    originCountryCode: "TH",
    originLabel: "Bangkok, Thailand",
    ownerDisplayName: "Owner",
    partySize: 2,
    startDate: "2026-06-21",
  };
}
