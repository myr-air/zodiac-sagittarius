import type {
  AccountSettings,
  AccountTripCreateRequest,
} from "@/src/account/api-client";
import {
  destinationRouteCode,
  tripCityOptions,
  type TripCityOption,
} from "./account-trip-destinations";

export { buildInviteEmailHref, buildInviteLink } from "@/src/routes/invite-links";
export {
  citySuggestions,
  customTripCity,
  destinationMetaParts,
  destinationRouteCode,
  tripCityFromFormOrigin,
  tripCityFromOption,
  tripCityOptions,
  tripCountryOptions,
  tripDestinationCards,
} from "./account-trip-destinations";
export type {
  TripCityOption,
  TripContinent,
  TripCountryOption,
  TripDestinationCard,
} from "./account-trip-destinations";
export { formatPreviewTravelDate, routeCalendarDays, tripNightCount } from "./account-trip-dates";
export type { RouteCalendarDay } from "./account-trip-dates";

export type TripWizardStepId = "trip" | "place" | "dates" | "invite" | "preview";

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

export function generateJoinPassword(): string {
  return `${randomToken(4)}-${randomToken(4)}`;
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
