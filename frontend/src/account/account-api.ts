/**
 * Account API client — GET /api/v1/account settings, trips, and explorer;
 * POST /api/v1/account/trips to create a trip under the signed-in account;
 * POST /api/v1/account/classify-trip-seed for AI structure + recommendations.
 */

import type {
  ClassifiedTripSeed,
  ClassifiedWhen,
  TripSeedRecommendations,
} from "../create-trip/classify-seed";
import type { CreateSeedDestination } from "../create-trip/seed";

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

/** Slim seed for account trip create — omit joinId / joinPassword (server defaults). */
export type AccountTripCreateSeed = {
  name: string;
  destinationLabel: string;
  /** Optional ISO dates — omit for flexible / server defaults. */
  startDate?: string;
  endDate?: string;
};

export type CreateAccountTripDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type CreateAccountTripInput = {
  sessionToken: string;
  seed: AccountTripCreateSeed;
};

export type AccountTripMemberSession = {
  tripId: string;
  memberId: string;
  sessionToken: string;
  createdAt: string;
  expiresAt: string;
};

export type CreateAccountTripSuccess = {
  ok: true;
  trip: { id: string; joinId: string };
  joinPassword: string;
  ownerMemberId: string;
  memberSession: AccountTripMemberSession;
};

export type CreateAccountTripFailure = {
  ok: false;
  error: string;
};

export type CreateAccountTripOutcome =
  | CreateAccountTripSuccess
  | CreateAccountTripFailure;

type AccountTripCreateBody = {
  trip?: { id?: unknown; joinId?: unknown };
  ownerMemberId?: unknown;
  joinPassword?: unknown;
  memberSession?: {
    tripId?: unknown;
    memberId?: unknown;
    sessionToken?: unknown;
    createdAt?: unknown;
    expiresAt?: unknown;
  };
  error?: { code?: unknown; message?: unknown };
};

function createTripFailureMessage(
  body: AccountTripCreateBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong creating your trip. Please try again.";
  }
  return "Could not create your trip. Please try again.";
}

/**
 * POST account trip create with Bearer session token and a slim seed body
 * (name + destinationLabel; optional startDate/endDate — no joinId / joinPassword / partySize).
 * On success returns trip.id, trip.joinId, joinPassword, ownerMemberId, and memberSession.
 */
export async function createAccountTrip(
  input: CreateAccountTripInput,
  deps: CreateAccountTripDeps,
): Promise<CreateAccountTripOutcome> {
  const requestBody: Record<string, string> = {
    name: input.seed.name,
    destinationLabel: input.seed.destinationLabel,
  };
  if (input.seed.startDate) requestBody.startDate = input.seed.startDate;
  if (input.seed.endDate) requestBody.endDate = input.seed.endDate;

  let response: Response;
  try {
    response = await deps.fetch(accountTripsUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: AccountTripCreateBody | null = null;
  try {
    body = (await response.json()) as AccountTripCreateBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: createTripFailureMessage(body, response.status) };
  }

  const tripId =
    typeof body?.trip?.id === "string" ? body.trip.id : null;
  const joinId =
    typeof body?.trip?.joinId === "string" ? body.trip.joinId : null;
  const ownerMemberId =
    typeof body?.ownerMemberId === "string" ? body.ownerMemberId : null;
  const joinPassword =
    typeof body?.joinPassword === "string" ? body.joinPassword : null;
  const session = body?.memberSession;

  if (
    !tripId ||
    !ownerMemberId ||
    !session ||
    typeof session.tripId !== "string" ||
    typeof session.memberId !== "string" ||
    typeof session.sessionToken !== "string" ||
    typeof session.createdAt !== "string" ||
    typeof session.expiresAt !== "string"
  ) {
    return {
      ok: false,
      error: "Trip was created but the response was incomplete. Please try again.",
    };
  }

  // joinPassword is required whenever the body includes trip.joinId (partial credentials).
  if (joinId !== null && joinPassword === null) {
    return {
      ok: false,
      error: "Trip was created but the response was incomplete. Please try again.",
    };
  }

  return {
    ok: true,
    trip: { id: tripId, joinId: joinId ?? "" },
    joinPassword: joinPassword ?? "",
    ownerMemberId,
    memberSession: {
      tripId: session.tripId,
      memberId: session.memberId,
      sessionToken: session.sessionToken,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    },
  };
}

function accountClassifyTripSeedUrl(apiBaseUrl: string): string {
  return `${accountUrl(apiBaseUrl)}/classify-trip-seed`;
}

export type ClassifyAccountTripSeedDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type ClassifyAccountTripSeedInput = {
  sessionToken: string;
  text: string;
};

export type ClassifyAccountTripSeedSuccess = {
  ok: true;
  seed: ClassifiedTripSeed;
};

export type ClassifyAccountTripSeedFailure = {
  ok: false;
  error: string;
};

export type ClassifyAccountTripSeedOutcome =
  | ClassifyAccountTripSeedSuccess
  | ClassifyAccountTripSeedFailure;

type ClassifyTripSeedBody = {
  name?: unknown;
  destinations?: unknown;
  when?: unknown;
  confidence?: unknown;
  recommendations?: unknown;
  error?: { code?: unknown; message?: unknown };
};

function classifyFailureMessage(
  body: ClassifyTripSeedBody | null,
  status: number,
): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong understanding your trip. Please try again.";
  }
  return "Could not understand your trip seed. Please try again.";
}

function parseDestination(row: unknown): CreateSeedDestination | null {
  if (!row || typeof row !== "object") return null;
  const d = row as { label?: unknown; role?: unknown };
  if (typeof d.label !== "string" || !d.label.trim()) return null;
  if (d.role !== "primary" && d.role !== "optional") return null;
  return { label: d.label.trim(), role: d.role };
}

function parseWhen(raw: unknown): ClassifiedWhen | null {
  if (!raw || typeof raw !== "object") return null;
  const w = raw as Record<string, unknown>;
  if (w.mode === "flexible") return { mode: "flexible" };
  if (w.mode === "exact") {
    if (typeof w.start !== "string" || typeof w.end !== "string") return null;
    return { mode: "exact", start: w.start, end: w.end };
  }
  if (w.mode === "months") {
    if (
      typeof w.startY !== "number" ||
      typeof w.startM !== "number" ||
      typeof w.endY !== "number" ||
      typeof w.endM !== "number"
    ) {
      return null;
    }
    return {
      mode: "months",
      startY: w.startY,
      startM: w.startM,
      endY: w.endY,
      endM: w.endM,
    };
  }
  return null;
}

function parseRecommendations(raw: unknown): TripSeedRecommendations | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as {
    styles?: unknown;
    relatedPlaces?: unknown;
    seasonHint?: unknown;
  };
  if (!Array.isArray(r.styles) || !Array.isArray(r.relatedPlaces)) {
    return undefined;
  }
  const styles = r.styles.filter((s): s is string => typeof s === "string");
  const relatedPlaces = r.relatedPlaces.filter(
    (p): p is string => typeof p === "string",
  );
  const seasonHint =
    typeof r.seasonHint === "string"
      ? r.seasonHint
      : r.seasonHint == null
        ? null
        : undefined;
  if (seasonHint === undefined && r.seasonHint !== undefined) return undefined;
  return { styles, relatedPlaces, seasonHint };
}

/**
 * POST account classify-trip-seed with Bearer session.
 * Returns structured { name, destinations, when } plus recommendations.
 * Never invents join credentials — user confirms before create.
 */
export async function classifyAccountTripSeed(
  input: ClassifyAccountTripSeedInput,
  deps: ClassifyAccountTripSeedDeps,
): Promise<ClassifyAccountTripSeedOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(accountClassifyTripSeedUrl(deps.apiBaseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input.text }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: ClassifyTripSeedBody | null = null;
  try {
    body = (await response.json()) as ClassifyTripSeedBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: classifyFailureMessage(body, response.status) };
  }

  if (!body || typeof body.name !== "string") {
    return {
      ok: false,
      error: "Trip seed was classified but the response was incomplete. Please try again.",
    };
  }
  if (!Array.isArray(body.destinations)) {
    return {
      ok: false,
      error: "Trip seed was classified but the response was incomplete. Please try again.",
    };
  }
  const destinations: CreateSeedDestination[] = [];
  for (const row of body.destinations) {
    const dest = parseDestination(row);
    if (!dest) {
      return {
        ok: false,
        error:
          "Trip seed was classified but the response was incomplete. Please try again.",
      };
    }
    destinations.push(dest);
  }
  const when = parseWhen(body.when);
  if (!when) {
    return {
      ok: false,
      error: "Trip seed was classified but the response was incomplete. Please try again.",
    };
  }

  const seed: ClassifiedTripSeed = {
    name: body.name,
    destinations,
    when,
  };
  if (typeof body.confidence === "string") {
    seed.confidence = body.confidence;
  }
  const recommendations = parseRecommendations(body.recommendations);
  if (recommendations) {
    seed.recommendations = recommendations;
  }

  return { ok: true, seed };
}
