/**
 * Itinerary mutations — POST create + PATCH inline edit / order + DELETE remove.
 */

import type { TripCockpitItineraryItem } from "./trip-cockpit-load";

export type ItineraryApiDeps = {
  fetch: typeof fetch;
  apiBaseUrl: string;
};

/** @deprecated Prefer ItineraryApiDeps — kept as alias for create callers. */
export type CreateItineraryItemDeps = ItineraryApiDeps;

export type CreateItineraryItemInput = {
  tripId: string;
  sessionToken: string;
  planVariantId: string;
  day: string;
  activity: string;
  activityType: string;
  place: string;
  /** Optional; generated when omitted. */
  clientMutationId?: string;
};

export type CreateItineraryItemSuccess = {
  ok: true;
  item: TripCockpitItineraryItem;
};

export type CreateItineraryItemFailure = {
  ok: false;
  error: string;
};

export type CreateItineraryItemOutcome =
  | CreateItineraryItemSuccess
  | CreateItineraryItemFailure;

type CreateItineraryItemBody = {
  id?: unknown;
  tripId?: unknown;
  planVariantId?: unknown;
  day?: unknown;
  activity?: unknown;
  activityType?: unknown;
  place?: unknown;
  startTime?: unknown;
  status?: unknown;
  version?: unknown;
  error?: { code?: unknown; message?: unknown };
};

function itineraryItemsUrl(apiBaseUrl: string, tripId: string): string {
  const base = apiBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/trips/${encodeURIComponent(tripId)}/itinerary-items`;
}

function itineraryItemUrl(
  apiBaseUrl: string,
  tripId: string,
  itemId: string,
): string {
  return `${itineraryItemsUrl(apiBaseUrl, tripId)}/${encodeURIComponent(itemId)}`;
}

function itineraryItemsOrderUrl(apiBaseUrl: string, tripId: string): string {
  return `${itineraryItemsUrl(apiBaseUrl, tripId)}/order`;
}

function nextClientMutationId(prefix = "itinerary"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}`;
}

function failureMessage(body: CreateItineraryItemBody | null, status: number): string {
  const fromApi =
    body && typeof body.error?.message === "string"
      ? body.error.message.trim()
      : "";
  if (fromApi) return fromApi;
  if (status >= 500) {
    return "Something went wrong adding this stop. Please try again.";
  }
  return "Could not add this stop. Please try again.";
}

function parseCreatedItem(body: CreateItineraryItemBody | null): TripCockpitItineraryItem | null {
  if (!body) return null;
  if (typeof body.id !== "string") return null;
  if (typeof body.tripId !== "string") return null;
  if (typeof body.planVariantId !== "string") return null;
  if (typeof body.day !== "string") return null;
  if (typeof body.activity !== "string") return null;
  if (typeof body.activityType !== "string") return null;
  if (typeof body.place !== "string") return null;
  if (typeof body.startTime !== "string") return null;
  if (typeof body.status !== "string") return null;
  if (typeof body.version !== "number") return null;
  return {
    id: body.id,
    tripId: body.tripId,
    planVariantId: body.planVariantId,
    day: body.day,
    activity: body.activity,
    activityType: body.activityType,
    place: body.place,
    startTime: body.startTime,
    status: body.status,
    version: body.version,
  };
}

/**
 * POST CreateItineraryItemRequest (camelCase) with Bearer member session.
 */
export async function createItineraryItem(
  input: CreateItineraryItemInput,
  deps: CreateItineraryItemDeps,
): Promise<CreateItineraryItemOutcome> {
  const clientMutationId =
    input.clientMutationId?.trim() || nextClientMutationId();
  const activity = input.activity.trim() || "Untitled activity";

  let response: Response;
  try {
    response = await deps.fetch(itineraryItemsUrl(deps.apiBaseUrl, input.tripId), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.sessionToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientMutationId,
        planVariantId: input.planVariantId,
        day: input.day,
        activity,
        activityType: input.activityType,
        place: input.place,
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: CreateItineraryItemBody | null = null;
  try {
    body = (await response.json()) as CreateItineraryItemBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return { ok: false, error: failureMessage(body, response.status) };
  }

  const item = parseCreatedItem(body);
  if (!item) {
    return {
      ok: false,
      error: "Stop created but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, item };
}

/** Patch fields for PatchItineraryItemRequest.patch (camelCase). */
export type ItineraryItemPatchFields = {
  /** Empty clear → null (not "") so API HH:MM validation is not tripped. */
  startTime?: string | null;
  endTime?: string | null;
  activity?: string;
  place?: string;
  activityType?: string;
  /** Travel mode (flight/train/…) — draft By chip. */
  activitySubtype?: string | null;
  /** Type-shaped extras (e.g. `{ meal: "Dinner" }` for food). */
  details?: Record<string, unknown>;
  status?: string;
  /** Stop memo — openStopDialog(note) Save. */
  note?: string;
  /** Map / booking URL — openStopDialog(link) Save. */
  mapLink?: string;
};

export type PatchItineraryItemInput = {
  tripId: string;
  itemId: string;
  sessionToken: string;
  expectedVersion: number;
  patch: ItineraryItemPatchFields;
  /** Optional; generated when omitted. */
  clientMutationId?: string;
};

export type PatchItineraryItemSuccess = {
  ok: true;
  item: TripCockpitItineraryItem;
};

export type PatchItineraryItemFailure = {
  ok: false;
  error: string;
  /** Present when API returns version_conflict (T5 #2). */
  code?: string;
};

export type PatchItineraryItemOutcome =
  | PatchItineraryItemSuccess
  | PatchItineraryItemFailure;

/**
 * PATCH PatchItineraryItemRequest (camelCase) with Bearer member session.
 * Body: { clientMutationId, expectedVersion, patch }.
 */
export async function patchItineraryItem(
  input: PatchItineraryItemInput,
  deps: ItineraryApiDeps,
): Promise<PatchItineraryItemOutcome> {
  const clientMutationId =
    input.clientMutationId?.trim() || nextClientMutationId("itinerary-patch");

  let response: Response;
  try {
    response = await deps.fetch(
      itineraryItemUrl(deps.apiBaseUrl, input.tripId, input.itemId),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${input.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientMutationId,
          expectedVersion: input.expectedVersion,
          patch: input.patch,
        }),
      },
    );
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: CreateItineraryItemBody | null = null;
  try {
    body = (await response.json()) as CreateItineraryItemBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const code =
      body && typeof (body as { code?: unknown }).code === "string"
        ? ((body as { code: string }).code)
        : undefined;
    const fromApi =
      body && typeof body.error?.message === "string"
        ? body.error.message.trim()
        : "";
    return {
      ok: false,
      error: fromApi || "Could not save this stop. Please try again.",
      code,
    };
  }

  const item = parseCreatedItem(body);
  if (!item) {
    return {
      ok: false,
      error: "Stop updated but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, item };
}

export type ReorderItineraryItemsInput = {
  tripId: string;
  sessionToken: string;
  planVariantId: string;
  day: string;
  /** Full Plan Day scope in the new order (camelCase itemIds on the wire). */
  itemIds: string[];
  /** Optional; generated when omitted. */
  clientMutationId?: string;
};

export type ReorderItineraryItemsSuccess = {
  ok: true;
  items: TripCockpitItineraryItem[];
};

export type ReorderItineraryItemsFailure = {
  ok: false;
  error: string;
};

export type ReorderItineraryItemsOutcome =
  | ReorderItineraryItemsSuccess
  | ReorderItineraryItemsFailure;

/**
 * PATCH ReorderItineraryItemsRequest (camelCase) with Bearer member session.
 * Body: { clientMutationId, planVariantId, day, itemIds }.
 */
export async function reorderItineraryItems(
  input: ReorderItineraryItemsInput,
  deps: ItineraryApiDeps,
): Promise<ReorderItineraryItemsOutcome> {
  const clientMutationId =
    input.clientMutationId?.trim() || nextClientMutationId("itinerary-reorder");

  let response: Response;
  try {
    response = await deps.fetch(
      itineraryItemsOrderUrl(deps.apiBaseUrl, input.tripId),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${input.sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientMutationId,
          planVariantId: input.planVariantId,
          day: input.day,
          itemIds: input.itemIds,
        }),
      },
    );
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
        ? (body as CreateItineraryItemBody)
        : null;
    const fromApi =
      errorBody && typeof errorBody.error?.message === "string"
        ? errorBody.error.message.trim()
        : "";
    return {
      ok: false,
      error: fromApi || "Could not reorder stops. Please try again.",
    };
  }

  if (!Array.isArray(body)) {
    return {
      ok: false,
      error: "Stops reordered but the response was incomplete. Please try again.",
    };
  }

  const items: TripCockpitItineraryItem[] = [];
  for (const entry of body) {
    const item = parseCreatedItem(
      entry && typeof entry === "object"
        ? (entry as CreateItineraryItemBody)
        : null,
    );
    if (!item) {
      return {
        ok: false,
        error:
          "Stops reordered but the response was incomplete. Please try again.",
      };
    }
    items.push(item);
  }

  return { ok: true, items };
}

export type DeleteItineraryItemInput = {
  tripId: string;
  itemId: string;
  sessionToken: string;
};

export type DeleteItineraryItemSuccess = {
  ok: true;
  item: TripCockpitItineraryItem;
};

export type DeleteItineraryItemFailure = {
  ok: false;
  error: string;
};

export type DeleteItineraryItemOutcome =
  | DeleteItineraryItemSuccess
  | DeleteItineraryItemFailure;

/**
 * DELETE itinerary item with Bearer member session (no body).
 * Backend: 200 ItineraryItemSummary.
 */
export async function deleteItineraryItem(
  input: DeleteItineraryItemInput,
  deps: ItineraryApiDeps,
): Promise<DeleteItineraryItemOutcome> {
  let response: Response;
  try {
    response = await deps.fetch(
      itineraryItemUrl(deps.apiBaseUrl, input.tripId, input.itemId),
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${input.sessionToken}`,
        },
      },
    );
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  let body: CreateItineraryItemBody | null = null;
  try {
    body = (await response.json()) as CreateItineraryItemBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const fromApi =
      body && typeof body.error?.message === "string"
        ? body.error.message.trim()
        : "";
    return {
      ok: false,
      error: fromApi || "Could not remove this stop. Please try again.",
    };
  }

  const item = parseCreatedItem(body);
  if (!item) {
    return {
      ok: false,
      error: "Stop removed but the response was incomplete. Please try again.",
    };
  }

  return { ok: true, item };
}
