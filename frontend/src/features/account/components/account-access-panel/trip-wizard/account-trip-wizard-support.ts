import type {
  AccountSettings,
  AccountTripCreateRequest,
} from "@/src/account/api-client";
import type { TripCity } from "@/src/trip/types";
import {
  defaultTripOriginCity,
  tripCityOptions,
  type TripCityOption,
} from "@/src/trip/trip-destinations";
import { generateJoinId, generateJoinPassword } from "./account-trip-credentials";

export { buildInviteEmailHref, buildInviteLink } from "@/src/routes/invite-links";
export { generateJoinId, generateJoinIdForTrip, generateJoinPassword, randomToken } from "./account-trip-credentials";
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
  defaultTripOriginCity,
} from "@/src/trip/trip-destinations";
export type {
  TripCityOption,
  TripContinent,
  TripCountryOption,
  TripDestinationCard,
} from "@/src/trip/trip-destinations";
export { formatPreviewTravelDate, routeCalendarDays, tripNightCount } from "./account-trip-dates";
export type { RouteCalendarDay } from "./account-trip-dates";

export const tripWizardDateSelectionStepValues = ["depart", "return"] as const;
export type TripWizardDateSelectionStep = (typeof tripWizardDateSelectionStepValues)[number];

export const tripWizardSteps = [
  { id: "trip", label: "Trip", regionLabel: "Trip details step", nextCopy: "Next: add destination detail" },
  { id: "place", label: "Place", regionLabel: "Destination step", nextCopy: "Next: choose route dates" },
  { id: "dates", label: "Dates", regionLabel: "Dates step", nextCopy: "Next: check invite access" },
  { id: "invite", label: "Invite", regionLabel: "Invite step", nextCopy: "Next: preview trip" },
  { id: "preview", label: "Preview", regionLabel: "Preview step", nextCopy: "Review before create" },
] as const satisfies ReadonlyArray<{ id: string; label: string; regionLabel: string; nextCopy: string }>;
export type TripWizardStepId = (typeof tripWizardSteps)[number]["id"];

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
    originLabel: form.originLabel.trim() || `${defaultTripOriginCity.city}, ${defaultTripOriginCity.country}`,
    originCity: form.originCity.trim() || defaultTripOriginCity.city,
    originCountry: form.originCountry.trim() || defaultTripOriginCity.country,
    originCountryCode: form.originCountryCode.trim().toUpperCase() || defaultTripOriginCity.countryCode,
    countries: countryNames,
    partySize: Math.max(1, Math.trunc(form.partySize ?? 1)),
    defaultTimezone: (form.defaultTimezone?.trim() || destinationCities[0]?.timezone || defaultTripOriginCity.timezone).slice(0, 64),
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
  return defaultTripOriginCity;
}

export function tripStepComplete(step: TripWizardStepId, state: { tripNameComplete: boolean; destinationComplete: boolean; datesComplete: boolean; accessComplete: boolean }): boolean {
  if (step === "trip") return state.tripNameComplete;
  if (step === "place") return state.destinationComplete;
  if (step === "dates") return state.datesComplete;
  if (step === "invite") return state.accessComplete;
  return true;
}

export function applyTripDestinationCities(form: AccountTripCreateRequest, nextCities: TripCity[]): AccountTripCreateRequest {
  const nextCountries = uniqueList(nextCities.map((city) => city.country));
  return {
    ...form,
    countries: nextCountries,
    destinationCities: nextCities,
    destinationLabel: nextCities.map((city) => city.city).join(", "),
  };
}

export function applyTripStartDate(form: AccountTripCreateRequest, date: string): AccountTripCreateRequest {
  if (!date || !form.endDate) return { ...form, startDate: date };
  if (Date.parse(`${date}T00:00:00`) > Date.parse(`${form.endDate}T00:00:00`)) {
    return { ...form, startDate: form.endDate, endDate: date };
  }
  return { ...form, startDate: date };
}

export function applyTripEndDate(form: AccountTripCreateRequest, date: string): AccountTripCreateRequest {
  if (!date || !form.startDate) return { ...form, endDate: date };
  if (Date.parse(`${date}T00:00:00`) < Date.parse(`${form.startDate}T00:00:00`)) {
    return { ...form, startDate: date, endDate: form.startDate };
  }
  return { ...form, endDate: date };
}

export function applyTripCalendarDate(
  form: AccountTripCreateRequest,
  date: string,
  selectingDateStep: TripWizardDateSelectionStep,
): { form: AccountTripCreateRequest; selectingDateStep: TripWizardDateSelectionStep } {
  if (selectingDateStep === "depart") {
    return {
      form: {
        ...form,
        startDate: date,
        endDate: Date.parse(`${form.endDate}T00:00:00`) < Date.parse(`${date}T00:00:00`) ? date : form.endDate,
      },
      selectingDateStep: "return",
    };
  }

  return {
    form: applyTripEndDate(form, date),
    selectingDateStep: "depart",
  };
}

export function nextTripWizardDateSelectionStep(
  step: TripWizardDateSelectionStep,
): TripWizardDateSelectionStep {
  return step === "depart" ? "return" : "depart";
}

export function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values));
}
