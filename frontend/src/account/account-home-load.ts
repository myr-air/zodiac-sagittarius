/**
 * Load live account-home data (greeting, trips, itinerary).
 */

import {
  fetchAccountExplorer,
  fetchAccountSettings,
  fetchAccountTrips,
} from "./account-api";
import { formatAccountGreeting } from "./greeting";
import { toItinerarySummary, type ItinerarySummary } from "./itinerary-summary";
import { toUpcomingTripCards, type UpcomingTripCard } from "./trip-cards";
import type { AccountHomeDataSource } from "./account-home";

export type LoadAccountHomeDataDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  now: Date;
};

export type LoadAccountHomeDataInput = {
  sessionToken: string;
};

export type AccountHomePlaceholderSection = {
  dataSource: AccountHomeDataSource;
};

export type AccountHomeLoadedData = {
  greeting: string;
  displayName: string;
  upcomingTrips: UpcomingTripCard[];
  itinerary: ItinerarySummary | null;
  stories: AccountHomePlaceholderSection;
  friends: AccountHomePlaceholderSection;
  places: AccountHomePlaceholderSection;
};

const PLACEHOLDER: AccountHomePlaceholderSection = {
  dataSource: "placeholder",
};

/**
 * Fetch only /account, /account/trips, and optionally /account/explorer;
 * map trips + itinerary; keep stories/friends/places as placeholders (no fetch).
 */
export async function loadAccountHomeData(
  input: LoadAccountHomeDataInput,
  deps: LoadAccountHomeDataDeps,
): Promise<AccountHomeLoadedData> {
  const apiDeps = { fetch: deps.fetch, apiBaseUrl: deps.apiBaseUrl };

  const [settings, tripsOutcome, explorerOutcome] = await Promise.all([
    fetchAccountSettings(input, apiDeps),
    fetchAccountTrips(input, apiDeps),
    fetchAccountExplorer(input, apiDeps),
  ]);

  const displayName =
    settings.ok && settings.profile.displayName
      ? settings.profile.displayName
      : "Traveler";

  const upcomingTrips = tripsOutcome.ok
    ? toUpcomingTripCards(tripsOutcome.trips)
    : [];

  const nextTrip =
    explorerOutcome.ok ? explorerOutcome.explorer.nextTrip : null;

  const itinerary = toItinerarySummary({
    nextTrip,
    upcomingCards: upcomingTrips,
  });

  return {
    greeting: formatAccountGreeting(displayName, deps.now),
    displayName,
    upcomingTrips,
    itinerary,
    stories: PLACEHOLDER,
    friends: PLACEHOLDER,
    places: PLACEHOLDER,
  };
}
