/**
 * Account API client — GET /api/v1/account settings, trips, and explorer.
 */

export type FetchAccountSettingsDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

/** CamelCase AccountTripSummary fields used by the account home trip list. */
export type AccountTripSummary = {
  id: string;
  name: string;
  destinationLabel: string;
  countries: string[];
  partySize: number;
  startDate: string;
  endDate: string;
  role: string;
};

export type FetchAccountTripsDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type FetchAccountTripsInput = {
  sessionToken: string;
};

export type FetchAccountTripsSuccess = {
  ok: true;
  trips: AccountTripSummary[];
};

export type FetchAccountTripsFailure = {
  ok: false;
  error: string;
};

export type FetchAccountTripsOutcome =
  | FetchAccountTripsSuccess
  | FetchAccountTripsFailure;

export type FetchAccountSettingsInput = {
  sessionToken: string;
};

export type FetchAccountSettingsSuccess = {
  ok: true;
  profile: {
    displayName: string;
  };
};

export type FetchAccountSettingsFailure = {
  ok: false;
  error: string;
};

export type FetchAccountSettingsOutcome =
  | FetchAccountSettingsSuccess
  | FetchAccountSettingsFailure;

type AccountSettingsBody = {
  profile?: {
    displayName?: unknown;
  };
  error?: { code?: unknown; message?: unknown };
};

function accountUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/account`;
}

function accountTripsUrl(apiBaseUrl: string): string {
  return `${accountUrl(apiBaseUrl)}/trips`;
}

function accountExplorerUrl(apiBaseUrl: string): string {
  return `${accountUrl(apiBaseUrl)}/explorer`;
}

function failureMessage(body: AccountSettingsBody | null, status: number): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong loading your account. Please try again.";
  }
  return "Could not load your account. Please try again.";
}

/**
 * GET account settings with Bearer session token.
 * On success returns profile.displayName from the AccountSettings body.
 */
export async function fetchAccountSettings(
  input: FetchAccountSettingsInput,
  deps: FetchAccountSettingsDeps,
): Promise<FetchAccountSettingsOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(accountUrl(deps.apiBaseUrl), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
      },
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: AccountSettingsBody | null = null;
  try {
    body = (await response.json()) as AccountSettingsBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: failureMessage(body, response.status) };
  }

  const displayName =
    typeof body?.profile?.displayName === "string"
      ? body.profile.displayName
      : null;

  if (!displayName) {
    return {
      ok: false,
      error: "Account loaded but the response was incomplete. Please try again.",
    };
  }

  return {
    ok: true,
    profile: { displayName },
  };
}

type AccountTripSummaryBody = {
  id?: unknown;
  name?: unknown;
  destinationLabel?: unknown;
  countries?: unknown;
  partySize?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  role?: unknown;
};

function parseAccountTripSummary(row: unknown): AccountTripSummary | null {
  if (!row || typeof row !== "object") return null;
  const body = row as AccountTripSummaryBody;
  if (typeof body.id !== "string") return null;
  if (typeof body.name !== "string") return null;
  if (typeof body.destinationLabel !== "string") return null;
  if (!Array.isArray(body.countries)) return null;
  if (!body.countries.every((c) => typeof c === "string")) return null;
  if (typeof body.partySize !== "number") return null;
  if (typeof body.startDate !== "string") return null;
  if (typeof body.endDate !== "string") return null;
  if (typeof body.role !== "string") return null;
  return {
    id: body.id,
    name: body.name,
    destinationLabel: body.destinationLabel,
    countries: body.countries,
    partySize: body.partySize,
    startDate: body.startDate,
    endDate: body.endDate,
    role: body.role,
  };
}

/**
 * GET account trips with Bearer session token.
 * On success returns the AccountTripSummary array from the response body.
 */
export async function fetchAccountTrips(
  input: FetchAccountTripsInput,
  deps: FetchAccountTripsDeps,
): Promise<FetchAccountTripsOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(accountTripsUrl(deps.apiBaseUrl), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
      },
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errorBody =
      body && typeof body === "object"
        ? (body as AccountSettingsBody)
        : null;
    return { ok: false, error: failureMessage(errorBody, response.status) };
  }

  if (!Array.isArray(body)) {
    return {
      ok: false,
      error: "Account trips loaded but the response was incomplete. Please try again.",
    };
  }

  const trips: AccountTripSummary[] = [];
  for (const row of body) {
    const trip = parseAccountTripSummary(row);
    if (!trip) {
      return {
        ok: false,
        error:
          "Account trips loaded but the response was incomplete. Please try again.",
      };
    }
    trips.push(trip);
  }

  return { ok: true, trips };
}

/** CamelCase AccountExplorerSummary fields used by the itinerary summary. */
export type AccountExplorerSummary = {
  upcomingTrips: number;
  ownedTrips: number;
  destinationCount: number;
  nextTrip: AccountTripSummary | null;
};

export type FetchAccountExplorerDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type FetchAccountExplorerInput = {
  sessionToken: string;
};

export type FetchAccountExplorerSuccess = {
  ok: true;
  explorer: AccountExplorerSummary;
};

export type FetchAccountExplorerFailure = {
  ok: false;
  error: string;
};

export type FetchAccountExplorerOutcome =
  | FetchAccountExplorerSuccess
  | FetchAccountExplorerFailure;

type AccountExplorerBody = {
  upcomingTrips?: unknown;
  ownedTrips?: unknown;
  destinationCount?: unknown;
  nextTrip?: unknown;
  error?: { code?: unknown; message?: unknown };
};

function parseAccountExplorerSummary(
  body: unknown,
): AccountExplorerSummary | null {
  if (!body || typeof body !== "object") return null;
  const row = body as AccountExplorerBody;
  if (typeof row.upcomingTrips !== "number") return null;
  if (typeof row.ownedTrips !== "number") return null;
  if (typeof row.destinationCount !== "number") return null;

  let nextTrip: AccountTripSummary | null = null;
  if (row.nextTrip != null) {
    nextTrip = parseAccountTripSummary(row.nextTrip);
    if (!nextTrip) return null;
  }

  return {
    upcomingTrips: row.upcomingTrips,
    ownedTrips: row.ownedTrips,
    destinationCount: row.destinationCount,
    nextTrip,
  };
}

/**
 * GET account explorer with Bearer session token.
 * On success returns the AccountExplorerSummary (including optional nextTrip).
 */
export async function fetchAccountExplorer(
  input: FetchAccountExplorerInput,
  deps: FetchAccountExplorerDeps,
): Promise<FetchAccountExplorerOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(accountExplorerUrl(deps.apiBaseUrl), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
      },
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errorBody =
      body && typeof body === "object"
        ? (body as AccountSettingsBody)
        : null;
    return { ok: false, error: failureMessage(errorBody, response.status) };
  }

  const explorer = parseAccountExplorerSummary(body);
  if (!explorer) {
    return {
      ok: false,
      error:
        "Account explorer loaded but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, explorer };
}
