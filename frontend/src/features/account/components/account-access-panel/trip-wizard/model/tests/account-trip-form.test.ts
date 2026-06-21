import { describe, expect, it } from "vitest";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import {
  applyTripDestinationCities,
  normalizedTripForm,
} from "../account-trip-form";

describe("account trip form helpers", () => {
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
