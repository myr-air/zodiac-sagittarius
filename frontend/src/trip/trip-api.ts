/**
 * Trip mutations — PATCH trip metadata (e.g. endDate for + Plan Day).
 */

import type { TripCockpitTrip } from "./trip-cockpit-load";

export type TripApiDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type PatchTripInput = {
  tripId: string;
  sessionToken: string;
  expectedVersion: number;
  /** Extend Plan Day spine past current endDate. */
  endDate?: string;
  /** Optional; generated when omitted. */
  clientMutationId?: string;
};

export type PatchTripSuccess = {
  ok: true;
  trip: TripCockpitTrip;
};

export type PatchTripFailure = {
  ok: false;
  error: string;
  /** Present when API returns version_conflict. */
  code?: string;
};

export type PatchTripOutcome = PatchTripSuccess | PatchTripFailure;

type PatchTripBody = {
  id?: unknown;
  name?: unknown;
  destinationLabel?: unknown;
  countries?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  mainTripPlanId?: unknown;
  activePlanVariantId?: unknown;
  ownerMemberId?: unknown;
  version?: unknown;
  error?: { code?: unknown; message?: unknown };
  code?: unknown;
};

function tripUrl(apiBaseUrl: string, tripId: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/trips/${encodeURIComponent(tripId)}`;
}

function nextClientMutationId(prefix = "trip-patch"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

function optionalNullableString(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return undefined;
}

function parseTripSummary(body: PatchTripBody | null): TripCockpitTrip | null {
  if (!body) return null;
  if (typeof body.id !== "string") return null;
  if (typeof body.name !== "string") return null;
  if (typeof body.destinationLabel !== "string") return null;
  if (typeof body.startDate !== "string") return null;
  if (typeof body.endDate !== "string") return null;
  if (typeof body.ownerMemberId !== "string") return null;
  if (typeof body.version !== "number") return null;
  const mainTripPlanId = optionalNullableString(body.mainTripPlanId);
  const activePlanVariantId = optionalNullableString(body.activePlanVariantId);
  if (mainTripPlanId === undefined || activePlanVariantId === undefined) {
    return null;
  }
  const countries = Array.isArray(body.countries)
    ? body.countries.filter((c): c is string => typeof c === "string")
    : [];
  return {
    id: body.id,
    name: body.name,
    destinationLabel: body.destinationLabel,
    countries,
    startDate: body.startDate,
    endDate: body.endDate,
    mainTripPlanId,
    activePlanVariantId,
    ownerMemberId: body.ownerMemberId,
    version: body.version,
  };
}

/**
 * PATCH PatchTripRequest (camelCase) with Bearer member session.
 * Body: { clientMutationId, expectedVersion, endDate?, … }.
 */
export async function patchTrip(
  input: PatchTripInput,
  deps: TripApiDeps,
): Promise<PatchTripOutcome> {
  const clientMutationId =
    input.clientMutationId?.trim() || nextClientMutationId();

  const body: Record<string, unknown> = {
    clientMutationId,
    expectedVersion: input.expectedVersion,
  };
  if (input.endDate !== undefined) {
    body.endDate = input.endDate;
  }

  let response: Response;
  try {
    response = await deps.fetch(tripUrl(deps.apiBaseUrl, input.tripId), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let parsed: PatchTripBody | null = null;
  try {
    parsed = (await response.json()) as PatchTripBody;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const code =
      parsed && typeof parsed.code === "string"
        ? parsed.code
        : parsed && typeof parsed.error?.code === "string"
          ? parsed.error.code
          : undefined;
    const fromApi =
      parsed && typeof parsed.error?.message === "string"
        ? parsed.error.message.trim()
        : "";
    return {
      ok: false,
      error: fromApi || "Could not update this trip. Please try again.",
      code,
    };
  }

  const trip = parseTripSummary(parsed);
  if (!trip) {
    return {
      ok: false,
      error: "Trip updated but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, trip };
}

/** Next UTC calendar day after an ISO YYYY-MM-DD date. */
export function nextCalendarDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
