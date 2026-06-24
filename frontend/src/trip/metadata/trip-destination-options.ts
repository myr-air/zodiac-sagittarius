import { DEFAULT_TRIP_ORIGIN_CITY } from "./trip-defaults";
import type { TripCity } from "@/src/trip/types";

export const tripContinentValues = [
  "all",
  "asia",
  "europe",
  "north-america",
  "south-america",
  "oceania",
  "africa",
] as const;
export type TripContinent = (typeof tripContinentValues)[number];

export interface TripCountryOption {
  code: string;
  name: string;
  continent: Exclude<TripContinent, "all">;
  currency: string;
  cities: string[];
  x: number;
  y: number;
}

export type TripCityOption = TripCity & { airportCode: string; capital?: boolean };

export const tripCountryOptions: TripCountryOption[] = [
  { code: "JP", name: "Japan", continent: "asia", currency: "JPY", cities: ["Tokyo", "Osaka", "Kyoto", "Sapporo"], x: 78, y: 42 },
  { code: "KR", name: "South Korea", continent: "asia", currency: "KRW", cities: ["Seoul", "Busan", "Jeju"], x: 74, y: 41 },
  { code: "TH", name: "Thailand", continent: "asia", currency: "THB", cities: ["Bangkok", "Chiang Mai", "Phuket"], x: 68, y: 54 },
  { code: "SG", name: "Singapore", continent: "asia", currency: "SGD", cities: ["Singapore"], x: 69, y: 61 },
  { code: "CN", name: "China", continent: "asia", currency: "CNY", cities: ["Beijing", "Shanghai", "Shenzhen"], x: 71, y: 44 },
  { code: "HK", name: "Hong Kong", continent: "asia", currency: "HKD", cities: ["Hong Kong"], x: 72, y: 51 },
  { code: "TW", name: "Taiwan", continent: "asia", currency: "TWD", cities: ["Taipei", "Kaohsiung"], x: 75, y: 51 },
  { code: "VN", name: "Vietnam", continent: "asia", currency: "VND", cities: ["Hanoi", "Da Nang", "Ho Chi Minh City"], x: 70, y: 55 },
  { code: "FR", name: "France", continent: "europe", currency: "EUR", cities: ["Paris", "Nice", "Lyon"], x: 48, y: 38 },
  { code: "IT", name: "Italy", continent: "europe", currency: "EUR", cities: ["Rome", "Milan", "Venice"], x: 51, y: 42 },
  { code: "ES", name: "Spain", continent: "europe", currency: "EUR", cities: ["Madrid", "Barcelona", "Seville"], x: 45, y: 43 },
  { code: "GB", name: "United Kingdom", continent: "europe", currency: "GBP", cities: ["London", "Edinburgh", "Manchester"], x: 46, y: 34 },
  { code: "DE", name: "Germany", continent: "europe", currency: "EUR", cities: ["Berlin", "Munich", "Frankfurt"], x: 51, y: 36 },
  { code: "CH", name: "Switzerland", continent: "europe", currency: "CHF", cities: ["Zurich", "Lucerne", "Geneva"], x: 50, y: 40 },
  { code: "US", name: "United States", continent: "north-america", currency: "USD", cities: ["New York", "Los Angeles", "San Francisco"], x: 20, y: 41 },
  { code: "CA", name: "Canada", continent: "north-america", currency: "CAD", cities: ["Vancouver", "Toronto", "Montreal"], x: 19, y: 30 },
  { code: "MX", name: "Mexico", continent: "north-america", currency: "MXN", cities: ["Mexico City", "Cancun", "Oaxaca"], x: 19, y: 52 },
  { code: "BR", name: "Brazil", continent: "south-america", currency: "BRL", cities: ["Rio de Janeiro", "Sao Paulo", "Salvador"], x: 34, y: 70 },
  { code: "PE", name: "Peru", continent: "south-america", currency: "PEN", cities: ["Lima", "Cusco"], x: 27, y: 69 },
  { code: "AU", name: "Australia", continent: "oceania", currency: "AUD", cities: ["Sydney", "Melbourne", "Perth"], x: 80, y: 76 },
  { code: "NZ", name: "New Zealand", continent: "oceania", currency: "NZD", cities: ["Auckland", "Queenstown", "Wellington"], x: 88, y: 82 },
  { code: "MA", name: "Morocco", continent: "africa", currency: "MAD", cities: ["Marrakech", "Casablanca", "Fes"], x: 45, y: 51 },
  { code: "EG", name: "Egypt", continent: "africa", currency: "EGP", cities: ["Cairo", "Luxor", "Alexandria"], x: 56, y: 52 },
  { code: "ZA", name: "South Africa", continent: "africa", currency: "ZAR", cities: ["Cape Town", "Johannesburg"], x: 55, y: 80 },
];

export const tripCityOptions: TripCityOption[] = [
  { city: "Bangkok", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 13.7563, longitude: 100.5018, airportCode: "BKK", capital: true },
  { city: "Chiang Mai", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 18.7883, longitude: 98.9853, airportCode: "CNX" },
  { city: "Phuket", country: "Thailand", countryCode: "TH", timezone: "Asia/Bangkok", latitude: 7.8804, longitude: 98.3923, airportCode: "HKT" },
  { city: "Tokyo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.6762, longitude: 139.6503, airportCode: "TYO", capital: true },
  { city: "Osaka", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 34.6937, longitude: 135.5023, airportCode: "OSA" },
  { city: "Kyoto", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 35.0116, longitude: 135.7681, airportCode: "UKY" },
  { city: "Sapporo", country: "Japan", countryCode: "JP", timezone: "Asia/Tokyo", latitude: 43.0618, longitude: 141.3545, airportCode: "CTS" },
  { city: "Seoul", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 37.5665, longitude: 126.978, airportCode: "SEL", capital: true },
  { city: "Busan", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 35.1796, longitude: 129.0756, airportCode: "PUS" },
  { city: "Jeju", country: "South Korea", countryCode: "KR", timezone: "Asia/Seoul", latitude: 33.4996, longitude: 126.5312, airportCode: "CJU" },
  { city: "Hong Kong", country: "Hong Kong", countryCode: "HK", timezone: "Asia/Hong_Kong", latitude: 22.3193, longitude: 114.1694, airportCode: "HKG", capital: true },
  { city: "Shenzhen", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 22.5431, longitude: 114.0579, airportCode: "SZX" },
  { city: "Shanghai", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 31.2304, longitude: 121.4737, airportCode: "SHA" },
  { city: "Beijing", country: "China", countryCode: "CN", timezone: "Asia/Shanghai", latitude: 39.9042, longitude: 116.4074, airportCode: "BJS", capital: true },
  { city: "Singapore", country: "Singapore", countryCode: "SG", timezone: "Asia/Singapore", latitude: 1.3521, longitude: 103.8198, airportCode: "SIN", capital: true },
  { city: "Taipei", country: "Taiwan", countryCode: "TW", timezone: "Asia/Taipei", latitude: 25.033, longitude: 121.5654, airportCode: "TPE", capital: true },
  { city: "Paris", country: "France", countryCode: "FR", timezone: "Europe/Paris", latitude: 48.8566, longitude: 2.3522, airportCode: "PAR", capital: true },
  { city: "London", country: "United Kingdom", countryCode: "GB", timezone: "Europe/London", latitude: 51.5072, longitude: -0.1276, airportCode: "LON", capital: true },
  { city: "New York", country: "United States", countryCode: "US", timezone: "America/New_York", latitude: 40.7128, longitude: -74.006, airportCode: "NYC" },
  { city: "Los Angeles", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 34.0522, longitude: -118.2437, airportCode: "LAX" },
  { city: "San Francisco", country: "United States", countryCode: "US", timezone: "America/Los_Angeles", latitude: 37.7749, longitude: -122.4194, airportCode: "SFO" },
];

export const defaultTripOriginCity: TripCityOption = tripCityOptions.find((city) => city.city === "Bangkok" && city.countryCode === "TH") ?? {
  ...DEFAULT_TRIP_ORIGIN_CITY,
  airportCode: "BKK",
  capital: true,
};
