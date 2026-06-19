import type {
  AccountSettings,
  AccountTripCreateRequest,
} from "@/src/account/api-client";
import type { TripCity } from "@/src/trip/types";

export { buildInviteLink } from "@/src/routes/invite-links";

export type TripContinent = "all" | "asia" | "europe" | "north-america" | "south-america" | "oceania" | "africa";

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

export type TripWizardStepId = "trip" | "place" | "dates" | "invite" | "preview";

export interface TripDestinationCard {
  title: string;
  detail: string;
  meta: string;
  nights: string;
  countryName: string;
}

export interface RouteCalendarDay {
  value: string;
  day: string;
  label: string;
  inRange: boolean;
  tourDay: number | null;
  tourTone: "odd" | "even" | "none";
  dateState: "start" | "end" | "in-range" | "today" | "default";
}

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

export const tripWizardSteps: Array<{ id: TripWizardStepId; label: string; regionLabel: string; nextCopy: string }> = [
  { id: "trip", label: "Trip", regionLabel: "Trip details step", nextCopy: "Next: add destination detail" },
  { id: "place", label: "Place", regionLabel: "Destination step", nextCopy: "Next: choose route dates" },
  { id: "dates", label: "Dates", regionLabel: "Dates step", nextCopy: "Next: check invite access" },
  { id: "invite", label: "Invite", regionLabel: "Invite step", nextCopy: "Next: preview trip" },
  { id: "preview", label: "Preview", regionLabel: "Preview step", nextCopy: "Review before create" },
];

export const defaultTripForm = (ownerDisplayName = "", profile?: AccountSettings["profile"] | null): AccountTripCreateRequest => {
  const origin = originCityFromProfile(profile);
  return {
    name: "",
    originLabel: `${origin.city}, ${origin.country}`,
    originCity: origin.city,
    originCountry: origin.country,
    originCountryCode: origin.countryCode,
    destinationLabel: "",
    destinationCities: [],
    countries: [],
    partySize: 1,
    defaultTimezone: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10),
    ownerDisplayName,
    joinId: generateJoinId(),
    joinPassword: generateJoinPassword(),
  };
};

export function destinationMetaParts(meta: string): string[] {
  return meta.split(" · ").map((part) => part.trim()).filter(Boolean);
}

export function tripDestinationCards(selectedCountryNames: string[], selectedCityNames: string[] = [], locale: string = "en"): TripDestinationCard[] {
  const cards: TripDestinationCard[] = [];
  selectedCityNames.forEach((cityName, index) => {
    const cityCountryName = destinationCityCountryName(cityName);
    cards.push({ title: cityName, detail: cityCountryName ?? selectedCountryNames[0] ?? "City stop", meta: destinationCityMeta(cityName), nights: tripNightBadge(index + 2, locale), countryName: cityCountryName ?? cityName });
  });
  selectedCountryNames
    .filter((name) => !selectedCityNames.some((cityName) => cityBelongsToCountry(cityName, name)))
    .forEach((name, index) => {
      cards.push({ title: name, detail: name, meta: countryCurrencyDetail(name), nights: tripNightBadge(index + 3, locale), countryName: name });
    });
  if (cards.length) return cards.slice(0, 4);
  return [{ title: "Destination", detail: "Trip stop", meta: "", nights: tripNightBadge(3, locale), countryName: "Destination" }];
}

function destinationCityMeta(cityName: string): string {
  const city = tripCityOptions.find((option) => option.city.toLocaleLowerCase() === cityName.toLocaleLowerCase());
  if (!city) return "";
  const currency = tripCountryOptions.find((country) => country.name === city.country)?.currency;
  return [city.timezone, currency].filter(Boolean).join(" · ");
}

function countryCurrencyDetail(countryName: string): string {
  const country = tripCountryOptions.find((option) => option.name === countryName);
  return country?.currency ?? "";
}

function tripNightBadge(nights: number, locale: string): string {
  return locale === "th" ? `${nights} คืน` : `${nights} nights`;
}

function destinationCityCountryName(cityName: string): string | null {
  return tripCountryOptions.find((country) => country.cities.some((city) => city.toLocaleLowerCase() === cityName.toLocaleLowerCase()))?.name ?? null;
}

function cityBelongsToCountry(cityName: string, countryName: string): boolean {
  return destinationCityCountryName(cityName)?.toLocaleLowerCase() === countryName.toLocaleLowerCase();
}

export function formatPreviewTravelDate(value: string): string {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function routeCalendarDays(seed: string, startDate: string, endDate: string): RouteCalendarDay[] {
  const seedDate = new Date(`${seed || "2026-06-01"}T00:00:00`);
  const year = Number.isNaN(seedDate.getTime()) ? 2026 : seedDate.getFullYear();
  const month = Number.isNaN(seedDate.getTime()) ? 5 : seedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  const todayValue = localDateValue(new Date());
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const value = localDateValue(date);
    const time = date.getTime();
    const inRange = Number.isFinite(start) && Number.isFinite(end) && time >= Math.min(start, end) && time <= Math.max(start, end);
    const tourDay = inRange ? Math.round((time - Math.min(start, end)) / 86_400_000) + 1 : null;
    const dateState = value === startDate ? "start" : value === endDate ? "end" : inRange ? "in-range" : value === todayValue ? "today" : "default";
    return {
      value,
      day: String(index + 1),
      label: new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date),
      inRange,
      tourDay,
      tourTone: tourDay ? (tourDay % 2 ? "odd" : "even") : "none",
      dateState,
    };
  });
}

function localDateValue(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function tripNightCount(startDate: string, endDate: string, locale: string): string {
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return locale === "th" ? "ยังไม่กำหนด" : "Not set";
  const days = Math.round((end - start) / 86_400_000);
  return locale === "th" ? `${days} คืน (${days + 1} วัน)` : `${days} nights (${days + 1} days)`;
}

export function normalizedTripForm(form: AccountTripCreateRequest, defaultOwnerDisplayName: string): AccountTripCreateRequest {
  const name = form.name.trim();
  const destinationCities = form.destinationCities.map((city) => ({
    ...city,
    city: city.city.trim(),
    country: city.country.trim(),
    countryCode: city.countryCode.trim().toUpperCase(),
    timezone: city.timezone.trim(),
  })).filter((city) => city.city && city.country && city.countryCode);
  const countryNames = uniqueList(destinationCities.map((city) => city.country));
  return {
    ...form,
    name,
    originLabel: form.originLabel.trim() || "Bangkok, Thailand",
    originCity: form.originCity.trim() || "Bangkok",
    originCountry: form.originCountry.trim() || "Thailand",
    originCountryCode: form.originCountryCode.trim().toUpperCase() || "TH",
    countries: countryNames,
    partySize: Math.max(1, Math.trunc(form.partySize ?? 1)),
    defaultTimezone: (form.defaultTimezone?.trim() || destinationCities[0]?.timezone || "Asia/Bangkok").slice(0, 64),
    destinationCities,
    destinationLabel: destinationCities.length ? destinationCities.map((city) => city.city).join(", ") : form.destinationLabel.trim() || name,
    ownerDisplayName: form.ownerDisplayName.trim() || defaultOwnerDisplayName,
    joinId: form.joinId.trim().toUpperCase(),
    joinPassword: form.joinPassword.trim().toUpperCase(),
  };
}

export function citySuggestions(query: string, selectedCities: TripCity[]): TripCityOption[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return tripCityOptions
    .filter((city) => !selectedCities.some((selected) => selected.city === city.city && selected.countryCode === city.countryCode))
    .filter((city) => {
      if (!normalizedQuery) return true;
      return [city.city, city.country, city.countryCode, city.airportCode]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    })
    .slice(0, normalizedQuery ? 8 : 6);
}

export function tripCityFromOption(option: TripCityOption): TripCity {
  return {
    city: option.city,
    country: option.country,
    countryCode: option.countryCode,
    timezone: option.timezone,
    latitude: option.latitude,
    longitude: option.longitude,
  };
}

function originCityFromProfile(profile?: AccountSettings["profile"] | null): TripCityOption {
  const profileCity = profile?.homeCity?.trim();
  const profileCountry = profile?.homeCountry?.trim();
  if (profileCity) {
    const exact = tripCityOptions.find((city) => city.city.toLocaleLowerCase() === profileCity.toLocaleLowerCase() && (!profileCountry || city.country.toLocaleLowerCase() === profileCountry.toLocaleLowerCase()));
    if (exact) return exact;
  }
  if (profileCountry) {
    const capital = tripCityOptions.find((city) => city.capital && city.country.toLocaleLowerCase() === profileCountry.toLocaleLowerCase());
    if (capital) return capital;
  }
  return tripCityOptions.find((city) => city.city === "Bangkok" && city.countryCode === "TH") ?? {
    city: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    timezone: "Asia/Bangkok",
    latitude: 13.7563,
    longitude: 100.5018,
    airportCode: "BKK",
    capital: true,
  };
}

export function customTripCity(city: string, fallback?: TripCity): TripCity {
  const match = tripCityOptions.find((option) => option.city.toLocaleLowerCase() === city.toLocaleLowerCase());
  if (match) return tripCityFromOption(match);
  return {
    city,
    country: fallback?.country ?? "Thailand",
    countryCode: fallback?.countryCode ?? "TH",
    timezone: fallback?.timezone ?? "Asia/Bangkok",
    latitude: fallback?.latitude ?? 13.7563,
    longitude: fallback?.longitude ?? 100.5018,
  };
}

export function tripCityFromFormOrigin(form: AccountTripCreateRequest): TripCity {
  const match = tripCityOptions.find((option) => option.city === form.originCity && option.countryCode === form.originCountryCode);
  if (match) return tripCityFromOption(match);
  return {
    city: form.originCity || "Bangkok",
    country: form.originCountry || "Thailand",
    countryCode: form.originCountryCode || "TH",
    timezone: "Asia/Bangkok",
    latitude: 13.7563,
    longitude: 100.5018,
  };
}

export function tripStepComplete(step: TripWizardStepId, state: { tripNameComplete: boolean; destinationComplete: boolean; datesComplete: boolean; accessComplete: boolean }): boolean {
  if (step === "trip") return state.tripNameComplete;
  if (step === "place") return state.destinationComplete;
  if (step === "dates") return state.datesComplete;
  if (step === "invite") return state.accessComplete;
  return true;
}

export function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function generateJoinId(): string {
  return generateJoinIdForTrip(new Date().toISOString().slice(0, 10), [], randomToken(3));
}

export function generateJoinIdForTrip(startDate: string, destinations: string[], suffix = randomToken(3)): string {
  const date = new Date(`${startDate}T00:00:00`);
  const month = Number.isNaN(date.getTime()) ? "00" : String(date.getMonth() + 1).padStart(2, "0");
  const year = Number.isNaN(date.getTime()) ? "00" : String(date.getFullYear()).slice(-2);
  return `${month}${year}-${destinationRouteCode(destinations)}-${suffix}`.toUpperCase();
}

export function destinationRouteCode(destinations: string[]): string {
  const primary = destinations[destinations.length > 1 ? 1 : 0] ?? destinations[0] ?? "TRP";
  const city = tripCityOptions.find((option) => option.city.toLocaleLowerCase() === primary.toLocaleLowerCase());
  if (city) return city.airportCode;
  const option = tripCountryOptions.find((country) => country.name === primary || country.cities.some((cityName) => cityName.toLocaleLowerCase() === primary.toLocaleLowerCase()));
  if (option) return option.code;
  return primary.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).padEnd(3, "X").toUpperCase();
}

export function generateJoinPassword(): string {
  return `${randomToken(4)}-${randomToken(4)}`;
}

export function buildInviteEmailHref(tripName: string, inviteLink: string): string {
  const subject = `Join ${tripName}`;
  const body = `Join this trip in Joii: ${inviteLink}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function randomToken(length: number): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const values = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256);
  }
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}
