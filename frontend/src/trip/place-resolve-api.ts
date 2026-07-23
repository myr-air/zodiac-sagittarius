/**
 * Place resolve — POST /places/resolve wire client (M81HY2YR T1 #1).
 * Hits /api/v1/trips/{tripId}/places/resolve; returns status + candidates
 * (or ok:false with a calm product error on non-OK).
 */

export type PlaceResolveApiDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type ResolvePlaceInput = {
  tripId: string;
  sessionToken: string;
  clientMutationId: string;
  activity: string;
  placeHint: string;
  destinationLabel: string;
  countries: string[];
  day: string;
};

export type PlaceCoordinates = {
  lat: number;
  lng: number;
};

export type PlaceCandidate = {
  name: string;
  address: string;
  coordinates: PlaceCoordinates;
  mapLink: string;
  confidence: number;
  source: string;
  evidence: readonly string[];
};

export type ResolvePlaceSuccess = {
  ok: true;
  status: string;
  candidates: PlaceCandidate[];
};

export type ResolvePlaceFailure = {
  ok: false;
  error: string;
};

export type ResolvePlaceOutcome = ResolvePlaceSuccess | ResolvePlaceFailure;

type ErrorBody = {
  error?: { code?: unknown; message?: unknown };
};

type ResolvePlaceResponseBody = ErrorBody & {
  status?: unknown;
  candidates?: unknown;
};

function apiBase(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/+$/, "");
}

function placesResolveUrl(apiBaseUrl: string, tripId: string): string {
  return `${apiBase(apiBaseUrl)}/api/v1/trips/${encodeURIComponent(tripId)}/places/resolve`;
}

function failureMessage(body: ErrorBody | null, fallback: string): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  return fromApi || fallback;
}

function parseCoordinates(value: unknown): PlaceCoordinates | null {
  if (!value || typeof value !== "object") return null;
  const c = value as Record<string, unknown>;
  if (typeof c.lat !== "number" || typeof c.lng !== "number") return null;
  return { lat: c.lat, lng: c.lng };
}

function parseCandidate(entry: unknown): PlaceCandidate | null {
  if (!entry || typeof entry !== "object") return null;
  const o = entry as Record<string, unknown>;
  const coordinates = parseCoordinates(o.coordinates);
  if (!coordinates) return null;
  if (typeof o.name !== "string") return null;
  if (typeof o.address !== "string") return null;
  if (typeof o.mapLink !== "string") return null;
  if (typeof o.confidence !== "number") return null;
  if (typeof o.source !== "string") return null;
  if (!Array.isArray(o.evidence)) return null;
  return {
    name: o.name,
    address: o.address,
    coordinates,
    mapLink: o.mapLink,
    confidence: o.confidence,
    source: o.source,
    evidence: o.evidence.filter((e): e is string => typeof e === "string"),
  };
}

function parseResponse(
  body: ResolvePlaceResponseBody | null,
): ResolvePlaceSuccess | null {
  if (!body) return null;
  if (typeof body.status !== "string") return null;
  if (!Array.isArray(body.candidates)) return null;

  const candidates: PlaceCandidate[] = [];
  for (const entry of body.candidates) {
    const candidate = parseCandidate(entry);
    if (!candidate) return null;
    candidates.push(candidate);
  }

  return {
    ok: true,
    status: body.status,
    candidates,
  };
}

/**
 * POST ResolvePlaceRequest (camelCase) with Bearer member session.
 * Returns status + candidates, or ok:false with API/calm error on non-OK.
 */
export async function resolvePlace(
  input: ResolvePlaceInput,
  deps: PlaceResolveApiDeps,
): Promise<ResolvePlaceOutcome> {
  const url = placesResolveUrl(deps.apiBaseUrl, input.tripId);

  let response: Response;
  try {
    response = await deps.fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientMutationId: input.clientMutationId,
        activity: input.activity,
        placeHint: input.placeHint,
        destinationLabel: input.destinationLabel,
        countries: input.countries,
        day: input.day,
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let json: unknown | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  const body =
    json && typeof json === "object"
      ? (json as ResolvePlaceResponseBody)
      : null;

  if (!response.ok) {
    return {
      ok: false,
      error: failureMessage(
        body,
        "Could not resolve this place. Please try again.",
      ),
    };
  }

  const parsed = parseResponse(body);
  if (!parsed) {
    return {
      ok: false,
      error:
        "Place resolved but the response was incomplete. Please try again.",
    };
  }

  return parsed;
}
