import { describe, expect, it } from "vitest";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import {
  applyTripCalendarDate,
  applyTripDestinationCities,
  applyTripEndDate,
  applyTripStartDate,
  citySuggestions,
  buildInviteEmailHref,
  buildInviteLink,
  destinationRouteCode,
  generateJoinIdForTrip,
  nextTripWizardDateSelectionStep,
  normalizedTripForm,
  routeCalendarDays,
  tripDestinationCards,
  tripNightCount,
  tripWizardDateSelectionStepValues,
} from "./account-trip-wizard-support";

describe("account trip wizard support", () => {
  it("keeps date selection steps in calendar toggle order", () => {
    expect(tripWizardDateSelectionStepValues).toEqual(["depart", "return"]);
    expect(nextTripWizardDateSelectionStep("depart")).toBe("return");
    expect(nextTripWizardDateSelectionStep("return")).toBe("depart");
  });

  it("generates route-aware join codes from destination cities", () => {
    expect(destinationRouteCode(["Thailand", "Tokyo"])).toBe("TYO");
    expect(destinationRouteCode(["Japan"])).toBe("JP");
    expect(generateJoinIdForTrip("2026-06-21", ["Thailand", "Tokyo"], "ABC")).toBe("0626-TYO-ABC");
    expect(buildInviteLink("0626-TYO-ABC", "token value")).toBe("http://localhost/join?token=token%20value");
    expect(buildInviteEmailHref("Tokyo", "http://localhost/join/TYO")).toContain("subject=Join%20Tokyo");
  });

  it("normalizes create-trip forms around city destinations", () => {
    const form: AccountTripCreateRequest = {
      name: "  Summer trip  ",
      originLabel: "",
      originCity: "",
      originCountry: "",
      originCountryCode: "",
      destinationLabel: "",
      destinationCities: [
        { city: " Tokyo ", country: " Japan ", countryCode: " jp ", timezone: " Asia/Tokyo ", latitude: 35.6762, longitude: 139.6503 },
      ],
      countries: [],
      partySize: 2.8,
      defaultTimezone: "",
      startDate: "2026-06-21",
      endDate: "2026-06-24",
      ownerDisplayName: "",
      joinId: " 0626-tyo-abc ",
      joinPassword: " abcd-2345 ",
    };

    expect(normalizedTripForm(form, "Owner")).toMatchObject({
      name: "Summer trip",
      originLabel: "Bangkok, Thailand",
      originCity: "Bangkok",
      originCountryCode: "TH",
      countries: ["Japan"],
      partySize: 2,
      defaultTimezone: "Asia/Tokyo",
      destinationLabel: "Tokyo",
      ownerDisplayName: "Owner",
      joinId: "0626-TYO-ABC",
      joinPassword: "ABCD-2345",
    });
  });

  it("derives destination cards, city suggestions, and trip timing labels", () => {
    expect(citySuggestions("tok", []).map((city) => city.city)).toContain("Tokyo");
    expect(tripDestinationCards(["Japan"], ["Tokyo"], "en")[0]).toMatchObject({
      title: "Tokyo",
      detail: "Japan",
      nights: "2 nights",
      countryName: "Japan",
    });
    expect(tripNightCount("2026-06-21", "2026-06-24", "en")).toBe("3 nights (4 days)");

    const days = routeCalendarDays("2026-06-21", "2026-06-21", "2026-06-24");
    expect(days.find((day) => day.value === "2026-06-21")).toMatchObject({ dateState: "start", tourDay: 1 });
    expect(days.find((day) => day.value === "2026-06-24")).toMatchObject({ dateState: "end", tourDay: 4 });
  });

  it("keeps destination city and country fields in sync", () => {
    const form = {
      ...baseTripForm(),
      destinationLabel: "Old",
    };

    expect(
      applyTripDestinationCities(form, [
        { city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503 },
        { city: "Kyoto", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.0116, longitude: 135.7681 },
      ]),
    ).toMatchObject({
      countries: ["Japan"],
      destinationLabel: "Tokyo, Kyoto",
    });
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
