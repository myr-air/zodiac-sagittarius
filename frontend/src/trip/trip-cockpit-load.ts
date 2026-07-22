/**
 * Load TripCockpit for /trips/{id} (member Bearer session → cockpit fields).
 */

import {
  loadMemberSession,
  type StorageLike,
} from "../landing/create-trip";

export type LoadTripCockpitDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
  storage: StorageLike;
};

export type LoadTripCockpitInput = {
  tripId: string;
};

/** TripSummary subset from TripCockpit.trip (camelCase API). */
export type TripCockpitTrip = {
  id: string;
  name: string;
  destinationLabel: string;
  startDate: string;
  endDate: string;
  mainTripPlanId: string | null;
  activePlanVariantId: string | null;
  ownerMemberId: string;
  version: number;
};

/** TripPlanSummary / PlanVariantSummary from TripCockpit.tripPlans. */
export type TripCockpitPlan = {
  id: string;
  tripId: string;
  name: string;
  kind: string;
  status: string;
  description: string;
  version: number;
};

/** ItineraryItemSummary subset from TripCockpit.itineraryItems. */
export type TripCockpitItineraryItem = {
  id: string;
  tripId: string;
  planVariantId: string;
  day: string;
  activity: string;
  activityType: string;
  place: string;
  startTime: string;
  status: string;
  version: number;
};

export type LoadTripCockpitSuccess = {
  ok: true;
  trip: TripCockpitTrip;
  tripPlans: TripCockpitPlan[];
  itineraryItems: TripCockpitItineraryItem[];
};

export type LoadTripCockpitFailure = {
  ok: false;
  error: string;
};

export type LoadTripCockpitOutcome =
  | LoadTripCockpitSuccess
  | LoadTripCockpitFailure;

type TripCockpitBody = {
  trip?: unknown;
  tripPlans?: unknown;
  itineraryItems?: unknown;
  error?: { code?: unknown; message?: unknown };
};

function tripCockpitUrl(apiBaseUrl: string, tripId: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/trips/${encodeURIComponent(tripId)}`;
}

function optionalNullableString(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return undefined;
}

function parseTrip(raw: unknown): TripCockpitTrip | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (typeof t.id !== "string") return null;
  if (typeof t.name !== "string") return null;
  if (typeof t.destinationLabel !== "string") return null;
  if (typeof t.startDate !== "string") return null;
  if (typeof t.endDate !== "string") return null;
  if (typeof t.ownerMemberId !== "string") return null;
  if (typeof t.version !== "number") return null;
  const mainTripPlanId = optionalNullableString(t.mainTripPlanId);
  const activePlanVariantId = optionalNullableString(t.activePlanVariantId);
  if (mainTripPlanId === undefined || activePlanVariantId === undefined) {
    return null;
  }
  return {
    id: t.id,
    name: t.name,
    destinationLabel: t.destinationLabel,
    startDate: t.startDate,
    endDate: t.endDate,
    mainTripPlanId,
    activePlanVariantId,
    ownerMemberId: t.ownerMemberId,
    version: t.version,
  };
}

function parsePlan(raw: unknown): TripCockpitPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== "string") return null;
  if (typeof p.tripId !== "string") return null;
  if (typeof p.name !== "string") return null;
  if (typeof p.kind !== "string") return null;
  if (typeof p.status !== "string") return null;
  if (typeof p.description !== "string") return null;
  if (typeof p.version !== "number") return null;
  return {
    id: p.id,
    tripId: p.tripId,
    name: p.name,
    kind: p.kind,
    status: p.status,
    description: p.description,
    version: p.version,
  };
}

function parseItineraryItem(raw: unknown): TripCockpitItineraryItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== "string") return null;
  if (typeof item.tripId !== "string") return null;
  if (typeof item.planVariantId !== "string") return null;
  if (typeof item.day !== "string") return null;
  if (typeof item.activity !== "string") return null;
  if (typeof item.activityType !== "string") return null;
  if (typeof item.place !== "string") return null;
  if (typeof item.startTime !== "string") return null;
  if (typeof item.status !== "string") return null;
  if (typeof item.version !== "number") return null;
  return {
    id: item.id,
    tripId: item.tripId,
    planVariantId: item.planVariantId,
    day: item.day,
    activity: item.activity,
    activityType: item.activityType,
    place: item.place,
    startTime: item.startTime,
    status: item.status,
    version: item.version,
  };
}

function failureMessage(body: TripCockpitBody | null, status: number): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong loading this trip. Please try again.";
  }
  return "Could not load this trip. Please try again.";
}

/**
 * With joii.member.session present, GET /api/v1/trips/{id} with Bearer and map
 * trip + tripPlans + itineraryItems from the TripCockpit body.
 */
export async function loadTripCockpit(
  input: LoadTripCockpitInput,
  deps: LoadTripCockpitDeps,
): Promise<LoadTripCockpitOutcome> {
  const session = loadMemberSession(deps.storage);
  if (!session?.sessionToken) {
    return {
      ok: false,
      error: "Sign in to this trip to continue.",
    };
  }

  let response: Response;
  try {
    response = await deps.fetch(tripCockpitUrl(deps.apiBaseUrl, input.tripId), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.sessionToken}`,
      },
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: TripCockpitBody | null = null;
  try {
    body = (await response.json()) as TripCockpitBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: failureMessage(body, response.status) };
  }

  const trip = parseTrip(body?.trip);
  if (!trip || !Array.isArray(body?.tripPlans) || !Array.isArray(body?.itineraryItems)) {
    return {
      ok: false,
      error: "Trip loaded but the response was incomplete. Please try again.",
    };
  }

  const tripPlans: TripCockpitPlan[] = [];
  for (const row of body.tripPlans) {
    const plan = parsePlan(row);
    if (!plan) {
      return {
        ok: false,
        error: "Trip loaded but the response was incomplete. Please try again.",
      };
    }
    tripPlans.push(plan);
  }

  const itineraryItems: TripCockpitItineraryItem[] = [];
  for (const row of body.itineraryItems) {
    const item = parseItineraryItem(row);
    if (!item) {
      return {
        ok: false,
        error: "Trip loaded but the response was incomplete. Please try again.",
      };
    }
    itineraryItems.push(item);
  }

  return { ok: true, trip, tripPlans, itineraryItems };
}
