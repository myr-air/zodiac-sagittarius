import type { TripCity } from "./types";

export const DEFAULT_TRIP_ORIGIN_CITY: TripCity = {
  city: "Bangkok",
  country: "Thailand",
  countryCode: "TH",
  timezone: "Asia/Bangkok",
  latitude: 13.7563,
  longitude: 100.5018,
};

export const DEFAULT_TRIP_TIMEZONE = DEFAULT_TRIP_ORIGIN_CITY.timezone;
