import { describe, expect, it } from "vitest";
import { mapTripSummary } from "./api-response-planning-mappers";
import type { TripSummaryResponse } from "./api-response-types";
import {
  DEFAULT_TRIP_ORIGIN_CITY,
  DEFAULT_TRIP_TIMEZONE,
} from "./trip-defaults";

describe("trip defaults", () => {
  it("keeps the default trip origin and timezone in one source", () => {
    expect(DEFAULT_TRIP_ORIGIN_CITY).toMatchObject({
      city: "Bangkok",
      country: "Thailand",
      countryCode: "TH",
      timezone: "Asia/Bangkok",
    });
    expect(DEFAULT_TRIP_TIMEZONE).toBe(DEFAULT_TRIP_ORIGIN_CITY.timezone);
  });

  it("maps trip summaries with destination timezone before falling back to the default timezone", () => {
    expect(mapTripSummary(tripSummary({ defaultTimezone: "Asia/Tokyo" })).defaultTimezone).toBe("Asia/Tokyo");
    expect(
      mapTripSummary(
        tripSummary({
          defaultTimezone: undefined,
          destinationCities: [{ ...DEFAULT_TRIP_ORIGIN_CITY, city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo" }],
        }),
      ).defaultTimezone,
    ).toBe("Asia/Tokyo");
    expect(mapTripSummary(tripSummary({ defaultTimezone: undefined, destinationCities: [] })).defaultTimezone).toBe(DEFAULT_TRIP_TIMEZONE);
  });
});

function tripSummary(overrides: Partial<TripSummaryResponse> = {}): TripSummaryResponse {
  return {
    id: "trip-defaults",
    activePlanVariantId: null,
    destinationLabel: "Tokyo",
    endDate: "2026-06-24",
    joinId: "0626-TYO-ABC",
    name: "Default trip",
    ownerMemberId: "member-owner",
    startDate: "2026-06-21",
    version: 1,
    ...overrides,
  };
}
