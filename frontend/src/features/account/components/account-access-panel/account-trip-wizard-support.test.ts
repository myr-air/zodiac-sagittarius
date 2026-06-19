import { describe, expect, it } from "vitest";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import {
  citySuggestions,
  buildInviteLink,
  destinationRouteCode,
  generateJoinIdForTrip,
  normalizedTripForm,
  routeCalendarDays,
  tripDestinationCards,
  tripNightCount,
} from "./account-trip-wizard-support";

describe("account trip wizard support", () => {
  it("generates route-aware join codes from destination cities", () => {
    expect(destinationRouteCode(["Thailand", "Tokyo"])).toBe("TYO");
    expect(destinationRouteCode(["Japan"])).toBe("JP");
    expect(generateJoinIdForTrip("2026-06-21", ["Thailand", "Tokyo"], "ABC")).toBe("0626-TYO-ABC");
    expect(buildInviteLink("0626-TYO-ABC", "token value")).toBe("http://localhost/join?token=token%20value");
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
});
