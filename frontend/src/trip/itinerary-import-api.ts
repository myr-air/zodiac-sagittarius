/**
 * Itinerary import — POST /itinerary-imports wire client (M81HY2YR T1 #2).
 * Hits /api/v1/trips/{tripId}/itinerary-imports with content (+ optional
 * mode/fileName/contentType); returns ItineraryImportDocument, or ok:false
 * with API/calm error on non-OK (no fake success).
 */

export type ItineraryImportApiDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

export type NormalizeItineraryImportInput = {
  tripId: string;
  sessionToken: string;
  content: string;
  mode?: string;
  fileName?: string;
  contentType?: string;
};

export type ItineraryImportTrip = {
  id: string;
  name: string;
  destinationLabel: string;
  startDate: string;
  endDate: string;
  activePlanVariantId?: string | null;
  mainTripPlanId?: string | null;
  planVariants?: unknown[];
  tripPlans?: unknown[];
};

export type ItineraryImportItem = {
  id: string;
  pathGroupId?: string | null;
  pathId?: string | null;
  pathName?: string | null;
  pathRole?: string | null;
  parentItemId?: string | null;
  itemKind?: string;
  timeMode?: string;
  isPlanBlock?: boolean;
  status?: string;
  priority?: string;
  day: string;
  sortOrder: number;
  startTime: string;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: string;
  activitySubtype?: string | null;
  place: string;
  linkLabel?: string;
  mapLink: string;
  coordinates?: { lat: number; lng: number } | null;
  address?: string | null;
  durationMinutes?: number | null;
  transportation: string;
  details?: unknown;
  advisories?: unknown;
  note: string;
};

export type ItineraryImportDocument = {
  schema: string;
  version: number;
  source: string;
  exportedAt: string;
  trip: ItineraryImportTrip;
  items: ItineraryImportItem[];
  records: unknown;
};

export type NormalizeItineraryImportSuccess = {
  ok: true;
  document: ItineraryImportDocument;
};

export type NormalizeItineraryImportFailure = {
  ok: false;
  error: string;
};

export type NormalizeItineraryImportOutcome =
  | NormalizeItineraryImportSuccess
  | NormalizeItineraryImportFailure;

type ErrorBody = {
  error?: { code?: unknown; message?: unknown };
};

type ImportResponseBody = ErrorBody & Record<string, unknown>;

function apiBase(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/+$/, "");
}

function itineraryImportsUrl(apiBaseUrl: string, tripId: string): string {
  return `${apiBase(apiBaseUrl)}/api/v1/trips/${encodeURIComponent(tripId)}/itinerary-imports`;
}

function failureMessage(body: ErrorBody | null, fallback: string): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  return fromApi || fallback;
}

function parseDocument(body: ImportResponseBody | null): ItineraryImportDocument | null {
  if (!body) return null;
  if (typeof body.schema !== "string") return null;
  if (typeof body.version !== "number") return null;
  if (typeof body.exportedAt !== "string") return null;
  if (!body.trip || typeof body.trip !== "object") return null;
  if (!Array.isArray(body.items)) return null;
  return body as unknown as ItineraryImportDocument;
}

/**
 * POST ImportItineraryRequest (camelCase) with Bearer member session.
 * Returns the normalized ItineraryImportDocument, or ok:false with API/calm
 * error on non-OK — never a fake success.
 */
export async function normalizeItineraryImport(
  input: NormalizeItineraryImportInput,
  deps: ItineraryImportApiDeps,
): Promise<NormalizeItineraryImportOutcome> {
  const url = itineraryImportsUrl(deps.apiBaseUrl, input.tripId);

  const requestBody: Record<string, string> = {
    content: input.content,
  };
  if (input.mode !== undefined) requestBody.mode = input.mode;
  if (input.fileName !== undefined) requestBody.fileName = input.fileName;
  if (input.contentType !== undefined) requestBody.contentType = input.contentType;

  let response: Response;
  try {
    response = await deps.fetch(url, {
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

  let json: unknown | null = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  const body =
    json && typeof json === "object" ? (json as ImportResponseBody) : null;

  if (!response.ok) {
    return {
      ok: false,
      error: failureMessage(
        body,
        "Could not import this itinerary. Please try again.",
      ),
    };
  }

  const document = parseDocument(body);
  if (!document) {
    return {
      ok: false,
      error:
        "Itinerary imported but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, document };
}
