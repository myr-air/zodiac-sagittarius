/**
 * Load account trips for /portal/trips (Bearer session → D3 hybrid rows).
 */

import {
  fetchAccountTrips,
  type AccountTripSummary,
} from "../account/account-api";
import { toPortalTripRows, type PortalTripRow } from "./trip-rows";

export type LoadPortalTripsDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type LoadPortalTripsInput = {
  sessionToken: string;
};

export type PortalTripsLoadedData = {
  rows: PortalTripRow[];
  trips: AccountTripSummary[];
};

/**
 * Fetch GET /account/trips and map to D3 hybrid row view-models.
 * On fetch failure returns empty rows (page can still render chrome).
 */
export async function loadPortalTrips(
  input: LoadPortalTripsInput,
  deps: LoadPortalTripsDeps,
): Promise<PortalTripsLoadedData> {
  const outcome = await fetchAccountTrips(input, {
    fetch: deps.fetch,
    apiBaseUrl: deps.apiBaseUrl,
  });

  if (!outcome.ok) {
    return { rows: [], trips: [] };
  }

  return {
    trips: outcome.trips,
    rows: toPortalTripRows(outcome.trips),
  };
}
